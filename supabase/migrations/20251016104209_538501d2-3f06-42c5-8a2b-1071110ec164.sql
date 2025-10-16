-- Create evidence_photos table for storing photo metadata
CREATE TABLE public.evidence_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id UUID NOT NULL REFERENCES public.evidence_bags(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evidence_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view photos for bags they have access to
CREATE POLICY "Users can view photos for accessible bags" 
  ON public.evidence_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evidence_bags eb
      WHERE eb.id = evidence_photos.bag_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'collector'::app_role)
        OR eb.initial_collector = auth.uid()
        OR EXISTS (
          SELECT 1 FROM chain_of_custody_log ccl
          WHERE ccl.bag_id = eb.id
          AND ccl.performed_by = auth.uid()
        )
      )
    )
  );

-- Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload photos" 
  ON public.evidence_photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);