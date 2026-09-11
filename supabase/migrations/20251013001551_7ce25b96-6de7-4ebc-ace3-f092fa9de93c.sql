-- Allow anonymous users to read user_subscriptions for play page validation
CREATE POLICY "Allow anon read for play validation"
ON public.user_subscriptions
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read plan_features for play page features
CREATE POLICY "Allow anon read for play features"
ON public.plan_features
FOR SELECT
TO anon
USING (true);