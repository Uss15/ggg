-- Make sure the evidence-photos bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'evidence-photos';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete evidence photos" ON storage.objects;

-- Create storage policies for evidence photos
CREATE POLICY "Authenticated users can upload evidence photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence-photos');

CREATE POLICY "Anyone can view evidence photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evidence-photos');

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'evidence-photos' AND owner::uuid = auth.uid());

CREATE POLICY "Admins can delete evidence photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'evidence-photos');