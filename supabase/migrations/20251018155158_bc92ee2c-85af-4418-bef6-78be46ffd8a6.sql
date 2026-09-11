-- Add billing flexibility columns to support subscription, one-time, and future credits models
ALTER TABLE subscription_plans 
ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'subscription' 
  CHECK (billing_type IN ('subscription', 'one_time', 'credits')),
ADD COLUMN price_one_time NUMERIC,
ADD COLUMN stripe_price_id_one_time TEXT,
ADD COLUMN credits_amount INTEGER,
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Add column comments for documentation
COMMENT ON COLUMN subscription_plans.billing_type IS 
  'Type of billing: subscription (recurring), one_time (lifetime/permanent), or credits (pay-as-you-go)';
COMMENT ON COLUMN subscription_plans.price_one_time IS 
  'One-time payment price (for lifetime access plans)';
COMMENT ON COLUMN subscription_plans.stripe_price_id_one_time IS 
  'Stripe price ID for one-time payments';
COMMENT ON COLUMN subscription_plans.credits_amount IS 
  'Number of credits included (for credit packages - future use)';
COMMENT ON COLUMN subscription_plans.metadata IS 
  'Flexible JSON field for future extensions';

-- Make subscription-specific fields nullable for one-time plans
ALTER TABLE subscription_plans 
ALTER COLUMN price_monthly DROP NOT NULL,
ALTER COLUMN price_yearly DROP NOT NULL;

-- Update existing plans to explicitly set billing_type
UPDATE subscription_plans 
SET billing_type = 'subscription' 
WHERE billing_type IS NULL OR billing_type = 'subscription';