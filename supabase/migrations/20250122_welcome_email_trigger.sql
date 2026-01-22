-- Welcome Email Trigger
-- Sends welcome email when user completes their profile (profile_complete = true)

-- Enable pg_net for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send welcome email when profile is completed
CREATE OR REPLACE FUNCTION send_welcome_email_on_profile_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when profile_complete changes from false to true
  IF NEW.profile_complete = true AND (OLD.profile_complete = false OR OLD.profile_complete IS NULL) THEN
    PERFORM net.http_post(
      url := 'https://xorwukhufqdzoqaygzgd.supabase.co/functions/v1/send-welcome-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'email', NEW.email,
        'name', COALESCE(NEW.first_name, ''),
        'app_name', 'RemedyGo',
        'app_url', 'https://remedygo.netlify.app'
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't fail the update
  RAISE WARNING 'Welcome email error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger on users table UPDATE
DROP TRIGGER IF EXISTS on_profile_complete_send_welcome ON users;
CREATE TRIGGER on_profile_complete_send_welcome
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_on_profile_complete();

-- Remove old auth.users trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_send_welcome ON auth.users;
DROP FUNCTION IF EXISTS send_welcome_email_on_signup();
