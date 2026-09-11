-- Update handle_new_user function to send webhook to Make.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  free_plan_id uuid;
  signup_method text;
  webhook_url text;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create free subscription
  SELECT id INTO free_plan_id
  FROM public.subscription_plans
  WHERE is_free_tier = true AND price_monthly = 0
  LIMIT 1;
  
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, billing_interval, current_period_start)
    VALUES (NEW.id, free_plan_id, 'active', 'lifetime', NOW());
  END IF;

  -- Determine signup method
  signup_method := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- Get webhook URL from environment
  SELECT decrypted_secret INTO webhook_url
  FROM vault.decrypted_secrets
  WHERE name = 'MAKE_WEBHOOK_URL'
  LIMIT 1;

  -- Send webhook to Make.com using pg_net
  IF webhook_url IS NOT NULL THEN
    PERFORM net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', NEW.id::text,
        'email', NEW.email,
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'signup_method', signup_method,
        'signup_timestamp', NOW()::text,
        'app_url', 'https://www.quizabl.com'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;