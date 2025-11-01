-- Create case_evidence linking table
CREATE TABLE IF NOT EXISTS public.case_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  bag_id UUID NOT NULL REFERENCES public.evidence_bags(id) ON DELETE CASCADE,
  linked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_evidence_case_id ON public.case_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_case_evidence_bag_id ON public.case_evidence(bag_id);
CREATE INDEX IF NOT EXISTS idx_case_evidence_linked_at ON public.case_evidence(linked_at DESC);

-- Enable RLS
ALTER TABLE public.case_evidence ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='case_evidence' AND policyname='Authenticated users can view links'
  ) THEN
    CREATE POLICY "Authenticated users can view links"
    ON public.case_evidence
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='case_evidence' AND policyname='Users can link evidence to cases'
  ) THEN
    CREATE POLICY "Users can link evidence to cases"
    ON public.case_evidence
    FOR INSERT
    TO authenticated
    WITH CHECK (linked_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='case_evidence' AND policyname='Admins can manage links'
  ) THEN
    CREATE POLICY "Admins can manage links"
    ON public.case_evidence
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;