-- Add accepting_responses column to apps table
ALTER TABLE public.apps 
ADD COLUMN accepting_responses boolean DEFAULT true;