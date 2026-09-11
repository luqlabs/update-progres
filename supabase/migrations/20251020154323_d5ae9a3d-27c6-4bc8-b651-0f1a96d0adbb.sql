-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload background audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view background audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own background audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own background audio" ON storage.objects;

-- Recreate storage policies for background-audio bucket
-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload background audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'background-audio'
);

-- Allow anyone to view/download background audio files (public bucket)
CREATE POLICY "Anyone can view background audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'background-audio');

-- Allow users to update their own uploaded files
CREATE POLICY "Users can update their own background audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'background-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own background audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'background-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);