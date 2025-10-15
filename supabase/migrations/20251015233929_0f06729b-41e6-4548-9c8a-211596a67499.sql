-- Security Fix: Restrict evidence_bags viewing to authorized users only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all evidence bags" ON public.evidence_bags;

-- Create role-based policy: admins/collectors see all, others see only what they handled
CREATE POLICY "Staff can view authorized evidence" ON public.evidence_bags
  FOR SELECT TO authenticated
  USING (
    -- Admins and collectors can view all (supervisory roles)
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'collector')
    -- OR user created this bag
    OR initial_collector = auth.uid()
    -- OR user performed any custody action on this bag
    OR EXISTS (
      SELECT 1 FROM chain_of_custody_log
      WHERE bag_id = evidence_bags.id
      AND performed_by = auth.uid()
    )
  );

-- Security Fix: Restrict chain of custody log viewing to authorized users
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view chain of custody" ON public.chain_of_custody_log;

-- Create policy that mirrors evidence bag access rules
CREATE POLICY "Users can view custody for accessible evidence" ON public.chain_of_custody_log
  FOR SELECT TO authenticated
  USING (
    -- Check if user can access the parent evidence bag
    EXISTS (
      SELECT 1 FROM evidence_bags eb
      WHERE eb.id = chain_of_custody_log.bag_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'collector')
        OR eb.initial_collector = auth.uid()
        OR EXISTS (
          SELECT 1 FROM chain_of_custody_log ccl
          WHERE ccl.bag_id = eb.id
          AND ccl.performed_by = auth.uid()
        )
      )
    )
  );