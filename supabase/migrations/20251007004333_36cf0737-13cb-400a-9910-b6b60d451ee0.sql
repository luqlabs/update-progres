-- Add credits column to usage_tracking table
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS credits integer DEFAULT 100;

-- Create function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits integer;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.usage_tracking
  WHERE user_id = _user_id;
  
  -- If no usage record exists, create one with default credits
  IF NOT FOUND THEN
    INSERT INTO public.usage_tracking (user_id, credits)
    VALUES (_user_id, 99)
    RETURNING credits INTO current_credits;
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

-- Create function to get user credits
CREATE OR REPLACE FUNCTION public.get_user_credits(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(credits, 100)
  FROM public.usage_tracking
  WHERE user_id = _user_id
  LIMIT 1;
$$;