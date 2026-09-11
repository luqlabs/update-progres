-- Simplify handle_new_user function - remove webhook logic (will be handled by frontend)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  free_plan_id uuid;
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
  
  RETURN NEW;
END;
$function$;