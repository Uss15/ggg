-- Update RLS policy for evidence_photos to include lab_tech role
DROP POLICY IF EXISTS "Users can view photos for accessible bags" ON evidence_photos;

CREATE POLICY "Users can view photos for accessible bags"
ON evidence_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM evidence_bags eb
    WHERE eb.id = evidence_photos.bag_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'collector'::app_role)
      OR has_role(auth.uid(), 'lab_tech'::app_role)
      OR eb.initial_collector = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM chain_of_custody_log ccl
        WHERE ccl.bag_id = eb.id
        AND ccl.performed_by = auth.uid()
      )
    )
  )
);