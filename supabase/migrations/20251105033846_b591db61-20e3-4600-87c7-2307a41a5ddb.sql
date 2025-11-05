-- Create table for AI analysis results
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('evidence_bag', 'custody_log', 'case')),
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('classification', 'anomaly', 'prediction')),
  result JSONB NOT NULL,
  confidence DECIMAL(3,2),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  performed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view AI analysis"
  ON public.ai_analysis FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert AI analysis"
  ON public.ai_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage AI analysis"
  ON public.ai_analysis FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_ai_analysis_entity ON public.ai_analysis(entity_id, entity_type);
CREATE INDEX idx_ai_analysis_type ON public.ai_analysis(analysis_type, performed_at DESC);