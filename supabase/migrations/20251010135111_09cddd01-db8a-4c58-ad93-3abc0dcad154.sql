-- Create plan_pricing_features table
CREATE TABLE public.plan_pricing_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_pricing_features ENABLE ROW LEVEL SECURITY;

-- Admins can manage pricing features
CREATE POLICY "Admins can manage pricing features"
ON public.plan_pricing_features
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view pricing features for active plans
CREATE POLICY "Anyone can view pricing features"
ON public.plan_pricing_features
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.subscription_plans
    WHERE subscription_plans.id = plan_pricing_features.plan_id
      AND subscription_plans.is_active = true
  )
);

-- Create index for better query performance
CREATE INDEX idx_plan_pricing_features_plan_id ON public.plan_pricing_features(plan_id);
CREATE INDEX idx_plan_pricing_features_order ON public.plan_pricing_features(plan_id, display_order);