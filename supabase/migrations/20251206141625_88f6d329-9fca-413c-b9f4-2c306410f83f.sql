-- Create quiz-media storage bucket for quiz images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-media', 'quiz-media', true);

-- Allow authenticated users to upload quiz media
CREATE POLICY "Users can upload quiz media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their quiz media
CREATE POLICY "Users can update own quiz media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'quiz-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their quiz media
CREATE POLICY "Users can delete own quiz media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quiz-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for quiz images
CREATE POLICY "Public quiz media access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz-media');