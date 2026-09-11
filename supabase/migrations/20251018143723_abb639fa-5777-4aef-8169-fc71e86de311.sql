-- Fix search_path for the new functions - proper order
DROP TRIGGER IF EXISTS blog_posts_reading_time_trigger ON blog_posts;
DROP FUNCTION IF EXISTS update_reading_time();
DROP FUNCTION IF EXISTS calculate_reading_time(text);

CREATE OR REPLACE FUNCTION calculate_reading_time(content_html text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  word_count integer;
  reading_time integer;
BEGIN
  word_count := array_length(
    regexp_split_to_array(
      regexp_replace(content_html, '<[^>]*>', '', 'g'),
      '\s+'
    ),
    1
  );
  
  reading_time := GREATEST(1, ROUND(word_count::numeric / 200));
  
  RETURN reading_time;
END;
$$;

CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.reading_time := calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_reading_time_trigger
BEFORE INSERT OR UPDATE OF content ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_reading_time();