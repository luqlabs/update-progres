-- Create function to calculate user's storage usage from quiz-media bucket
CREATE OR REPLACE FUNCTION public.get_user_storage_bytes(_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  total_bytes bigint;
BEGIN
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) INTO total_bytes
  FROM storage.objects
  WHERE bucket_id = 'quiz-media'
    AND name LIKE _user_id::text || '/%';
  
  RETURN total_bytes;
END;
$$;