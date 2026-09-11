-- Allow authenticated users to insert/upsert feature images (for dev/edit mode)
CREATE POLICY "Authenticated users can insert feature images"
ON public.landing_feature_images
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update feature images
CREATE POLICY "Authenticated users can update feature images"
ON public.landing_feature_images
FOR UPDATE
TO authenticated
USING (true);