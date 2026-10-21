-- Round 5 (store submit fixes).
--   1. verify_invite_code only moves the caller's own account, unless the caller
--      is an admin or owner. Before this any signed-in user could move any user
--      into another organization by passing their id.
--   2. delete_user_account(): the in-app Delete Account button has called this
--      RPC since launch and it never existed. Deletes only the caller's account,
--      their own content and settings, their profile and their login.
--   3. chat_members.added_by had no ON DELETE rule, so deleting anyone who had
--      ever added someone to a chat failed. Now SET NULL.
--   4. Posts, comments and likes by the developer account are hidden from every
--      other signed-in user, so nobody sees "Unknown" author items.

set lock_timeout = '5s';

-- 1. verify_invite_code: own account only -------------------------------------
-- Same signature, so installed builds that pass p_user_id keep working.
create or replace function public.verify_invite_code(p_user_id uuid, p_invite_code character varying)
 returns json
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_caller uuid := auth.uid();
  v_org_id uuid;
  v_org_name text;
begin
  -- auth.uid() is null only for service_role (anon has no EXECUTE).
  if v_caller is not null
     and p_user_id is distinct from v_caller
     and not exists (
       select 1 from users u
       where u.id = v_caller
         and (coalesce(u.is_admin, false) or coalesce(u.is_owner, false))
     ) then
    raise exception 'Not authorized to change another user''s organization'
      using errcode = '42501';
  end if;

  select id, name into v_org_id, v_org_name
  from organizations
  where invite_code = p_invite_code and is_active = true;

  if v_org_id is null then
    return json_build_object('success', false, 'error', 'Invalid organization code');
  end if;

  perform set_config('app.allow_privilege_change', 'on', true);

  update users
  set organization_id = v_org_id
  where id = p_user_id;

  perform set_config('app.allow_privilege_change', 'off', true);

  return json_build_object('success', true, 'organization_id', v_org_id, 'organization_name', v_org_name);
end;
$function$;

revoke all on function public.verify_invite_code(uuid, character varying) from public;
revoke all on function public.verify_invite_code(uuid, character varying) from anon;
grant execute on function public.verify_invite_code(uuid, character varying) to authenticated, service_role;

-- 3. chat_members.added_by: SET NULL so a user delete is not blocked -----------
alter table public.chat_members drop constraint if exists chat_members_added_by_fkey;
alter table public.chat_members
  add constraint chat_members_added_by_fkey
  foreign key (added_by) references public.users(id) on delete set null;

-- 2. delete_user_account -------------------------------------------------------
-- Deletes the caller's own rows in tables that carry a user id with no foreign
-- key (they would otherwise stay behind as "Unknown" content), then the profile.
-- on_profile_deleted_remove_login removes the login, and the foreign keys
-- cascade or null the rest: chat memberships and reactions go, chats they
-- created and other people's replies stay. Analytics rows cascade from
-- auth.users. Other people's comments on the caller's own posts go with the post.
-- The developer account is refused here and again by guard_developer_account.
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if exists (select 1 from users where id = v_uid and is_developer) then
    raise exception 'The app developer account cannot be deleted' using errcode = '42501';
  end if;

  delete from post_likes where user_id = v_uid;
  delete from post_bookmarks where user_id = v_uid;
  delete from post_comments where user_id = v_uid;
  delete from posts where user_id = v_uid;
  delete from activity_notifications where actor_id = v_uid;
  delete from notification_reads where user_id = v_uid;
  delete from user_notification_state where user_id = v_uid;
  delete from user_notifications where user_id = v_uid;
  delete from user_post_reads where user_id = v_uid;
  delete from post_notification_settings where user_id = v_uid;
  delete from user_notification_preferences where user_id = v_uid;
  delete from user_devices where user_id = v_uid;
  delete from ai_chat_history where user_id = v_uid;
  delete from messages where sender_id = v_uid;

  delete from users where id = v_uid;

  -- The profile trigger swallows a failed login delete; make sure it is gone.
  delete from auth.users where id = v_uid;
end;
$fn$;

revoke all on function public.delete_user_account() from public;
revoke all on function public.delete_user_account() from anon;
grant execute on function public.delete_user_account() to authenticated, service_role;

-- 4. Developer posts, comments and likes are hidden ------------------------------
-- Visible to the developer accounts themselves, hidden from everyone else.
-- (select ...) wrappers are fine here: these tables are not users.
do $do$
declare
  t text;
begin
  foreach t in array array['posts', 'post_comments', 'post_likes'] loop
    execute format('drop policy if exists "Developer content is hidden" on public.%I', t);
    execute format($p$
      create policy "Developer content is hidden"
        on public.%I
        as restrictive
        for select
        to authenticated
        using (
          not coalesce(user_id = any ((select public.developer_user_ids())::uuid[]), false)
          or coalesce((select auth.uid()) = any ((select public.developer_user_ids())::uuid[]), false)
        )$p$, t);
  end loop;
end;
$do$;

reset lock_timeout;
