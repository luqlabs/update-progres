-- Update deduct_credit function to handle monthly resets and plan-based credits
CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits integer;
  max_credits text;
  last_reset timestamp with time zone;
  should_reset boolean;
BEGIN
  -- Get the user's plan credit limit
  max_credits := public.get_user_feature_limit(_user_id, 'credits');
  
  -- If no limit is set, default to 100
  IF max_credits IS NULL THEN
    max_credits := '100';
  END IF;
  
  -- Get current usage tracking record
  SELECT credits, last_reset_date INTO current_credits, last_reset
  FROM public.usage_tracking
  WHERE user_id = _user_id;
  
  -- Check if we need to reset (more than a month has passed)
  should_reset := last_reset IS NULL OR 
                  (EXTRACT(YEAR FROM age(NOW(), last_reset)) * 12 + 
                   EXTRACT(MONTH FROM age(NOW(), last_reset))) >= 1;
  
  -- If no usage record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.usage_tracking (user_id, credits, last_reset_date)
    VALUES (_user_id, 
            CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer - 1 END,
            NOW());
    RETURN true;
  END IF;
  
  -- Reset credits if a month has passed
  IF should_reset THEN
    UPDATE public.usage_tracking
    SET credits = CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END,
        last_reset_date = NOW()
    WHERE user_id = _user_id;
    
    -- Get updated credits after reset
    SELECT credits INTO current_credits
    FROM public.usage_tracking
    WHERE user_id = _user_id;
  END IF;
  
  -- Check if unlimited
  IF max_credits = 'unlimited' THEN
    RETURN true;
  END IF;
  
  -- Check if user has credits
  IF current_credits <= 0 THEN
    RETURN false;
  END IF;
  
  -- Deduct credit
  UPDATE public.usage_tracking
  SET credits = credits - 1
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Update get_user_credits function to handle monthly resets and plan-based credits
CREATE OR REPLACE FUNCTION public.get_user_credits(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits integer;
  max_credits text;
  last_reset timestamp with time zone;
  should_reset boolean;
BEGIN
  -- Get the user's plan credit limit
  max_credits := public.get_user_feature_limit(_user_id, 'credits');
  
  -- If no limit is set, default to 100
  IF max_credits IS NULL THEN
    max_credits := '100';
  END IF;
  
  -- Get current usage tracking record
  SELECT credits, last_reset_date INTO current_credits, last_reset
  FROM public.usage_tracking
  WHERE user_id = _user_id;
  
  -- If no record exists, create one and return max credits
  IF NOT FOUND THEN
    INSERT INTO public.usage_tracking (user_id, credits, last_reset_date)
    VALUES (_user_id, 
            CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END,
            NOW());
    RETURN CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END;
  END IF;
  
  -- Check if we need to reset (more than a month has passed)
  should_reset := last_reset IS NULL OR 
                  (EXTRACT(YEAR FROM age(NOW(), last_reset)) * 12 + 
                   EXTRACT(MONTH FROM age(NOW(), last_reset))) >= 1;
  
  -- Reset credits if a month has passed
  IF should_reset THEN
    UPDATE public.usage_tracking
    SET credits = CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END,
        last_reset_date = NOW()
    WHERE user_id = _user_id;
    
    RETURN CASE WHEN max_credits = 'unlimited' THEN 999999 ELSE max_credits::integer END;
  END IF;
  
  -- Return current credits
  RETURN COALESCE(current_credits, 0);
END;
$$;