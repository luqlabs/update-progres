-- Add welcomed_at column to track if welcome email was sent
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcomed_at timestamptz DEFAULT NULL;