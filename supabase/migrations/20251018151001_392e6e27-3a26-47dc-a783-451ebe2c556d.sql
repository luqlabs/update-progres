-- Add show_on_landing column to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN show_on_landing BOOLEAN DEFAULT true;

-- Set existing active plans to show on landing by default
UPDATE subscription_plans 
SET show_on_landing = true 
WHERE is_active = true;

-- Add helpful comment
COMMENT ON COLUMN subscription_plans.show_on_landing IS 'Controls whether this plan is displayed on the landing page pricing section';