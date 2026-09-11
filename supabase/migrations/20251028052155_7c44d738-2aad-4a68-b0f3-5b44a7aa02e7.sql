-- Add last_seen column to profiles table
ALTER TABLE public.profiles
ADD COLUMN last_seen timestamp with time zone;

-- Create index for better query performance
CREATE INDEX idx_profiles_last_seen ON public.profiles(last_seen);

-- Create function to update last_seen timestamp
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = now()
  WHERE id = auth.uid();
  RETURN NULL;
END;
$$;

-- Note: Trigger implementation would go on auth activities table if available
-- For now, last_seen can be updated via application code when user performs actions