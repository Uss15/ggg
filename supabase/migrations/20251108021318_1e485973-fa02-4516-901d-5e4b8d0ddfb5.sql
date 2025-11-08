-- Remove lab tech ability to UPDATE evidence_bags
DROP POLICY IF EXISTS "Collectors, lab techs and admins can update evidence bags" ON public.evidence_bags;

CREATE POLICY "Collectors and admins can update evidence bags"
ON public.evidence_bags
FOR UPDATE
USING (
  has_role(auth.uid(), 'collector'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'collector'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);
