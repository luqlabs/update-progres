-- Fix 1: Tighten student_sessions RLS policies - Remove unrestricted UPDATE
-- Drop the problematic policy that allows anyone to update any session
DROP POLICY IF EXISTS "Allow unauthenticated users to update sessions" ON public.student_sessions;

-- Create a restricted policy: only allow updating completion data for active sessions
CREATE POLICY "Allow session completion updates only"
ON public.student_sessions
FOR UPDATE
USING (completed_at IS NULL)
WITH CHECK (
  completed_at IS NOT NULL 
  AND score IS NOT NULL 
  AND total_questions IS NOT NULL
);

-- Fix 2: Tighten user_subscriptions RLS policies - Remove broad authenticated access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;

-- Recreate with stricter access control
CREATE POLICY "Users can view only their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Add fixed search_path to all SECURITY DEFINER functions
-- Update deduct_credit function
CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_credits integer;
  max_credits text;
  last_reset timestamp with time zone;
  should_reset boolean;
BEGIN
  max_credits := public.get_user_feature_limit(_user_id, 'credits');
  
  IF max_credits IS NULL THEN
    max_credits := '100';
  END IF;
  
  SELECT credits, last_reset_date INTO current_credits, last_reset
  FROM public.usage_tracking
  WHERE user_id = _user_id;
  
  should_reset := last_reset IS NULL OR 
                  (EXTRACT(YEAR FROM age(NOW(), last_reset)) * 12 + 
                   EXTRACT(MONTH FROM age(NOW(), last_reset))) >= 1;
  
  IF NOT FOUND THEN
    INSERT INTO public.usage_tracking (user_id, credits, last_reset_date)
    VALUES (_user_id, 
            CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer - 1 END,
            NOW());
    RETURN true;
  END IF;
  
  IF should_reset THEN
    UPDATE public.usage_tracking
    SET credits = CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END,
        last_reset_date = NOW()
    WHERE user_id = _user_id;
    
    SELECT credits INTO current_credits
    FROM public.usage_tracking
    WHERE user_id = _user_id;
  END IF;
  
  IF max_credits = 'unlimited' THEN
    RETURN true;
  END IF;
  
  IF current_credits <= 0 THEN
    RETURN false;
  END IF;
  
  UPDATE public.usage_tracking
  SET credits = credits - 1
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$function$;

-- Update get_user_credits function
CREATE OR REPLACE FUNCTION public.get_user_credits(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_credits integer;
  max_credits text;
  last_reset timestamp with time zone;
  should_reset boolean;
BEGIN
  max_credits := public.get_user_feature_limit(_user_id, 'credits');
  
  IF max_credits IS NULL THEN
    max_credits := '100';
  END IF;
  
  SELECT credits, last_reset_date INTO current_credits, last_reset
  FROM public.usage_tracking
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.usage_tracking (user_id, credits, last_reset_date)
    VALUES (_user_id, 
            CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END,
            NOW());
    RETURN CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END;
  END IF;
  
  should_reset := last_reset IS NULL OR 
                  (EXTRACT(YEAR FROM age(NOW(), last_reset)) * 12 + 
                   EXTRACT(MONTH FROM age(NOW(), last_reset))) >= 1;
  
  IF should_reset THEN
    UPDATE public.usage_tracking
    SET credits = CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END,
        last_reset_date = NOW()
    WHERE user_id = _user_id;
    
    RETURN CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END;
  END IF;
  
  RETURN COALESCE(current_credits, 0);
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  free_plan_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
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

-- Update update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;