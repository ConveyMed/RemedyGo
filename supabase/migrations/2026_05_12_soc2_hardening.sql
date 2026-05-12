-- ============================================================
-- SOC 2 Security Hardening — applied 2026-05-12
-- Project: xorwukhufqdzoqaygzgd (RemedyGo)
-- ============================================================
-- This migration captures live changes applied via Supabase MCP.
-- Source tables (analytics_tables.sql, user_devices.sql) have
-- been updated inline to keep fresh setups secure.
-- ============================================================

-- ---- DROP PERMISSIVE READ POLICIES ----
DROP POLICY IF EXISTS "Service role can read all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Service role can read all screen views" ON public.screen_views;
DROP POLICY IF EXISTS "Service role can read all asset events" ON public.asset_events;
DROP POLICY IF EXISTS "Service role can read all AI queries" ON public.ai_queries;
DROP POLICY IF EXISTS "Service role can read all profile views" ON public.profile_views;
DROP POLICY IF EXISTS "Service role can read all directory searches" ON public.directory_searches;
DROP POLICY IF EXISTS "Service role can read all notification clicks" ON public.notification_clicks;
DROP POLICY IF EXISTS "Service role full access to owner profiles" ON public.owner_profiles;
DROP POLICY IF EXISTS "Authenticated can read devices for notifications" ON public.user_devices;
DROP POLICY IF EXISTS "Allow authenticated users to read all notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Service role can insert preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Service role can read all preferences" ON public.user_notification_preferences;

-- ---- VIEWS: flip to security_invoker (RemedyGo has 6 to fix) ----
ALTER VIEW IF EXISTS public.ai_unanswered_questions SET (security_invoker = true);
ALTER VIEW IF EXISTS public.ai_usage SET (security_invoker = true);
ALTER VIEW IF EXISTS public.asset_engagement SET (security_invoker = true);
ALTER VIEW IF EXISTS public.content_by_organization SET (security_invoker = true);
ALTER VIEW IF EXISTS public.daily_active_users SET (security_invoker = true);
ALTER VIEW IF EXISTS public.screen_popularity SET (security_invoker = true);

-- ---- FUNCTIONS: pin search_path ----
ALTER FUNCTION public.assign_content_to_org(uuid, uuid, uuid[], integer[]) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_comment_notification() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_notification_preferences() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_post_notification() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_org_content(character varying, character varying) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_unread_notification_count(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.send_welcome_email_on_profile_complete() SET search_path = public, pg_temp;
ALTER FUNCTION public.send_welcome_email_on_signup() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_organizations_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_users_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.user_is_chat_member(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.user_is_in_chat_org(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_invite_code(uuid, character varying) SET search_path = public, pg_temp;

-- ---- REVOKE EXECUTE on sensitive SECURITY DEFINER fns ----
-- RemedyGo has explicit anon grants; revoke from both PUBLIC and anon.
REVOKE EXECUTE ON FUNCTION public.assign_content_to_org(uuid, uuid, uuid[], integer[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_comment_notification() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_notification_preferences() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_post_notification() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_unread_notification_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_welcome_email_on_profile_complete() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_welcome_email_on_signup() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_chat_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_in_chat_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_invite_code(uuid, character varying) FROM PUBLIC, anon;

-- ---- STORAGE BUCKETS: remove broad listing policies ----
DROP POLICY IF EXISTS "Public read access for chat files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
