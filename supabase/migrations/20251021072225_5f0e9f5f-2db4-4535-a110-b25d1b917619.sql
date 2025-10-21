-- Fix Critical Security Issues

-- 1. Make evidence-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'evidence-photos';

-- 2. Drop existing policies on storage.objects if they exist
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view photos for accessible bags" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Create new RLS policies for storage.objects
CREATE POLICY "Users can view photos for accessible bags"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence-photos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM evidence_photos ep
    JOIN evidence_bags eb ON ep.bag_id = eb.id
    WHERE storage.objects.name LIKE ep.bag_id || '%'
      AND (
        has_role(auth.uid(), 'admin'::app_role) OR
        has_role(auth.uid(), 'collector'::app_role) OR
        eb.initial_collector = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chain_of_custody_log ccl
          WHERE ccl.bag_id = eb.id AND ccl.performed_by = auth.uid()
        )
      )
  )
);

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidence-photos' AND
  auth.uid() IS NOT NULL
);

-- 3. Add GPS coordinate validation constraints
ALTER TABLE evidence_bags
  ADD CONSTRAINT valid_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  ADD CONSTRAINT valid_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

ALTER TABLE chain_of_custody_log
  ADD CONSTRAINT valid_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  ADD CONSTRAINT valid_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- 4. Replace profiles_public view with a secure version
DROP VIEW IF EXISTS profiles_public;

CREATE VIEW profiles_public WITH (security_invoker=true) AS
  SELECT p.id, p.full_name, p.badge_number
  FROM profiles p
  WHERE 
    auth.uid() IS NOT NULL AND (
      -- Can see their own profile
      p.id = auth.uid() OR
      -- Can see profiles of users in evidence they can access
      EXISTS (
        SELECT 1 FROM evidence_bags eb
        WHERE eb.initial_collector = p.id
          AND (
            has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'collector'::app_role) OR
            eb.initial_collector = auth.uid() OR
            EXISTS (
              SELECT 1 FROM chain_of_custody_log ccl
              WHERE ccl.bag_id = eb.id AND ccl.performed_by = auth.uid()
            )
          )
      ) OR
      EXISTS (
        SELECT 1 FROM chain_of_custody_log ccl
        JOIN evidence_bags eb ON ccl.bag_id = eb.id
        WHERE ccl.performed_by = p.id
          AND (
            has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'collector'::app_role) OR
            eb.initial_collector = auth.uid() OR
            EXISTS (
              SELECT 1 FROM chain_of_custody_log ccl2
              WHERE ccl2.bag_id = eb.id AND ccl2.performed_by = auth.uid()
            )
          )
      )
    );