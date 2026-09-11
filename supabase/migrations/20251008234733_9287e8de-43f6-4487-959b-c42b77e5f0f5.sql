-- Phase 1: Update subscription_plans table for hybrid mode
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_import_source TEXT CHECK (stripe_import_source IN ('auto', 'imported')),
ADD COLUMN IF NOT EXISTS last_stripe_sync TIMESTAMPTZ;

-- Phase 2: Update user_subscriptions table for better tracking
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly', 'lifetime')),
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_plan ON user_subscriptions(user_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_free_tier ON subscription_plans(is_free_tier);

-- Add comment for documentation
COMMENT ON COLUMN subscription_plans.is_free_tier IS 'True if this plan does not require Stripe checkout';
COMMENT ON COLUMN subscription_plans.stripe_import_source IS 'How the Stripe IDs were created: auto (created by system) or imported (from existing Stripe)';
COMMENT ON COLUMN user_subscriptions.billing_interval IS 'Billing frequency: monthly, yearly, or lifetime for free plans';
COMMENT ON COLUMN user_subscriptions.is_trial IS 'True if this is a trial subscription';
COMMENT ON COLUMN user_subscriptions.trial_ends_at IS 'When the trial period ends';