-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policy for user_roles - admins can view all, users can view their own
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT UNIQUE,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active plans (for pricing page)
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Only admins can manage plans
CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create plan_features table
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  feature_value TEXT NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('number', 'boolean', 'text')),
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Everyone can view features for active plans
CREATE POLICY "Anyone can view plan features" ON public.plan_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subscription_plans 
      WHERE id = plan_id AND is_active = true
    )
  );

-- Only admins can manage features
CREATE POLICY "Admins can manage features" ON public.plan_features
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- System/Stripe can insert/update subscriptions
CREATE POLICY "System can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (true);

-- Create usage_tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  apps_created INTEGER DEFAULT 0,
  monthly_plays INTEGER DEFAULT 0,
  ai_generations_used INTEGER DEFAULT 0,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all usage" ON public.usage_tracking
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- System can update usage
CREATE POLICY "System can manage usage" ON public.usage_tracking
  FOR ALL USING (true);

-- Create helper function to get feature limit for a user
CREATE OR REPLACE FUNCTION public.get_user_feature_limit(_user_id UUID, _feature_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pf.feature_value
  FROM public.user_subscriptions us
  JOIN public.plan_features pf ON pf.plan_id = us.plan_id
  WHERE us.user_id = _user_id 
    AND pf.feature_key = _feature_key
    AND us.status = 'active'
  LIMIT 1
$$;

-- Create function to check if user can create app
CREATE OR REPLACE FUNCTION public.can_create_app(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_apps TEXT;
  current_apps INTEGER;
BEGIN
  -- Get the max apps limit
  max_apps := public.get_user_feature_limit(_user_id, 'max_apps');
  
  -- If unlimited, return true
  IF max_apps = 'unlimited' THEN
    RETURN true;
  END IF;
  
  -- Count current apps
  SELECT COUNT(*) INTO current_apps
  FROM public.apps
  WHERE teacher_id = _user_id;
  
  -- Check if under limit
  RETURN current_apps < max_apps::INTEGER;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default free plan
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, display_order) 
VALUES ('Free', 'Get started with basic features', 0, 0, 1);

-- Get the free plan ID and insert default features
DO $$
DECLARE
  free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free';
  
  INSERT INTO public.plan_features (plan_id, feature_key, feature_value, feature_type, display_name) VALUES
  (free_plan_id, 'max_apps', '3', 'number', 'Maximum Apps'),
  (free_plan_id, 'max_monthly_plays', '100', 'number', 'Monthly Plays'),
  (free_plan_id, 'max_ai_generations', '10', 'number', 'AI Generations per Month'),
  (free_plan_id, 'advanced_analytics', 'false', 'boolean', 'Advanced Analytics'),
  (free_plan_id, 'custom_branding', 'false', 'boolean', 'Custom Branding'),
  (free_plan_id, 'priority_support', 'false', 'boolean', 'Priority Support');
END $$;