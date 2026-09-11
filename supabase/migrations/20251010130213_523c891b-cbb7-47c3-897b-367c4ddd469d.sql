-- Step 1: Update Free plan to have is_free_tier flag
UPDATE subscription_plans
SET is_free_tier = true
WHERE price_monthly = 0 AND name = 'Free';

-- Step 2: Backfill existing free users with subscription records
INSERT INTO user_subscriptions (user_id, plan_id, status, billing_interval, current_period_start, created_at, updated_at)
SELECT 
  p.id as user_id,
  sp.id as plan_id,
  'active' as status,
  'lifetime' as billing_interval,
  p.created_at as current_period_start,
  p.created_at as created_at,
  NOW() as updated_at
FROM profiles p
CROSS JOIN subscription_plans sp
LEFT JOIN user_subscriptions us ON p.id = us.user_id
WHERE us.id IS NULL 
  AND sp.is_free_tier = true
  AND sp.price_monthly = 0;

-- Step 3: Update handle_new_user trigger to automatically create free subscriptions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Get the free plan ID
  SELECT id INTO free_plan_id
  FROM public.subscription_plans
  WHERE is_free_tier = true AND price_monthly = 0
  LIMIT 1;
  
  -- Create free subscription for new user
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, billing_interval, current_period_start)
    VALUES (NEW.id, free_plan_id, 'active', 'lifetime', NOW());
  END IF;
  
  RETURN NEW;
END;
$$;