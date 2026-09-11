-- Add new fields to blog_posts for enhanced blog features
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS reading_time integer,
ADD COLUMN IF NOT EXISTS author_name text,
ADD COLUMN IF NOT EXISTS author_bio text,
ADD COLUMN IF NOT EXISTS author_avatar text;

-- Create function to calculate reading time (avg 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_reading_time(content_html text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  word_count integer;
  reading_time integer;
BEGIN
  -- Strip HTML tags and count words
  word_count := array_length(
    regexp_split_to_array(
      regexp_replace(content_html, '<[^>]*>', '', 'g'),
      '\s+'
    ),
    1
  );
  
  -- Calculate reading time (200 words per minute, minimum 1 minute)
  reading_time := GREATEST(1, ROUND(word_count::numeric / 200));
  
  RETURN reading_time;
END;
$$;

-- Create trigger to auto-calculate reading time on insert/update
CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.reading_time := calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_reading_time_trigger ON blog_posts;
CREATE TRIGGER blog_posts_reading_time_trigger
BEFORE INSERT OR UPDATE OF content ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_reading_time();