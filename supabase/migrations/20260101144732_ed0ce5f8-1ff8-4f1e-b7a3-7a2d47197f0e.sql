-- Table to store landing page feature card images
CREATE TABLE public.landing_feature_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_index integer NOT NULL UNIQUE,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_feature_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view (for public landing page)
CREATE POLICY "Anyone can view feature images"
ON public.landing_feature_images
FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert feature images"
ON public.landing_feature_images
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update feature images"
ON public.landing_feature_images
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete feature images"
ON public.landing_feature_images
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_landing_feature_images_updated_at
BEFORE UPDATE ON public.landing_feature_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();