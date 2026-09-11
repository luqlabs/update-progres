-- Add onboarding tracking columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'welcome';