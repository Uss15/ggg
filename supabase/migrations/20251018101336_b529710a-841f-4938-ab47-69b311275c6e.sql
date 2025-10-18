-- Fix 1: Remove the incorrect foreign key constraint
-- evidence_bags.initial_collector should reference auth.users, not profiles_public
ALTER TABLE public.evidence_bags
DROP CONSTRAINT IF EXISTS evidence_bags_initial_collector_fkey;

-- Fix 2: Drop and recreate the chain_of_custody_log RLS policies to avoid infinite recursion
DROP POLICY IF EXISTS "Users can view custody for accessible evidence" ON public.chain_of_custody_log;
DROP POLICY IF EXISTS "Authenticated users can add to chain of custody" ON public.chain_of_custody_log;

-- Create a security definer function to check if user can access a bag
CREATE OR REPLACE FUNCTION public.can_access_bag(_user_id uuid, _bag_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM evidence_bags eb
    WHERE eb.id = _bag_id
      AND (
        has_role(_user_id, 'admin'::app_role)
        OR has_role(_user_id, 'collector'::app_role)
        OR eb.initial_collector = _user_id
      )
  )
$$;

-- Recreate RLS policies using the security definer function
CREATE POLICY "Users can view custody for accessible evidence"
ON public.chain_of_custody_log
FOR SELECT
USING (public.can_access_bag(auth.uid(), bag_id));

CREATE POLICY "Authenticated users can add to chain of custody"
ON public.chain_of_custody_log
FOR INSERT
WITH CHECK (auth.uid() = performed_by AND public.can_access_bag(auth.uid(), bag_id));