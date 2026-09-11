ALTER TABLE public.analytics_summary 
ADD COLUMN ai_overview text DEFAULT NULL,
ADD COLUMN ai_overview_generated_at timestamptz DEFAULT NULL;