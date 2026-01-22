-- Welcome Email Trigger
-- Automatically sends a welcome email when a new user signs up via Supabase Auth

-- Enable the pg_net extension if not already enabled (for HTTP requests from triggers)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send welcome email via Edge Function
CREATE OR REPLACE FUNCTION send_welcome_email_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  service_key TEXT;
BEGIN
  -- Get the edge function URL
  edge_function_url := 'https://xorwukhufqdzoqaygzgd.supabase.co/functions/v1/send-welcome-email';

  -- Get service role key from vault (you'll need to set this)
  -- For now, we'll use the anon key which works for public functions
  service_key := current_setting('app.settings.service_role_key', true);

  -- Call the edge function asynchronously
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claim.sub', true))
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'name', COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', ''),
      'app_name', 'RemedyGo',
      'app_url', 'https://remedygo.netlify.app'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'Welcome email trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_send_welcome ON auth.users;

CREATE TRIGGER on_auth_user_created_send_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_on_signup();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, service_role;
