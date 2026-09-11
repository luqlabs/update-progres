-- Add columns for non-gradable question analytics
ALTER TABLE analytics_summary 
ADD COLUMN IF NOT EXISTS poll_results jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS word_cloud_data jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS open_ended_summary jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN analytics_summary.poll_results IS 'Array of poll question results with vote distributions';
COMMENT ON COLUMN analytics_summary.word_cloud_data IS 'Array of word cloud questions with aggregated word frequencies';
COMMENT ON COLUMN analytics_summary.open_ended_summary IS 'Array of open-ended questions with response summaries';