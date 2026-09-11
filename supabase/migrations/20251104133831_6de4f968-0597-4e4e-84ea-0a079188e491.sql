-- Fix credit defaults from 100 to 5 (free tier default)
ALTER TABLE public.usage_tracking 
ALTER COLUMN credits SET DEFAULT 5;

-- Update get_user_credits function to use 5 as default instead of 100
CREATE OR REPLACE FUNCTION public.get_user_credits(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits integer;
  max_credits text;
  last_reset timestamp with time zone;
  should_reset boolean;
BEGIN
  max_credits := public.get_user_feature_limit(_user_id, 'credits');
  
  IF max_credits IS NULL THEN
    max_credits := '5';
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

-- Update deduct_credit function to use 5 as default instead of 100
CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits integer;
  max_credits text;
  last_reset timestamp with time zone;
  should_reset boolean;
BEGIN
  max_credits := public.get_user_feature_limit(_user_id, 'credits');
  
  IF max_credits IS NULL THEN
    max_credits := '5';
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