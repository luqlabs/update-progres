-- Allow authenticated users to upload to feature-cards folder
CREATE POLICY "Allow feature card uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-media' AND name LIKE 'feature-cards/%');

-- Allow updating feature card images
CREATE POLICY "Allow feature card updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'quiz-media' AND name LIKE 'feature-cards/%');

-- Allow deleting feature card images
CREATE POLICY "Allow feature card deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'quiz-media' AND name LIKE 'feature-cards/%');