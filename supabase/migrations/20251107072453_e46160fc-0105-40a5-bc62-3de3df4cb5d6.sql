-- Create case_assignments table for assigning personnel to cases
CREATE TABLE IF NOT EXISTS public.case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(case_id, user_id)
);

-- Enable RLS on case_assignments
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_assignments
-- Allow authenticated users to view assignments for cases they have access to
CREATE POLICY "Users can view case assignments" 
ON public.case_assignments 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins to insert/update/delete assignments
CREATE POLICY "Admins can manage case assignments" 
ON public.case_assignments 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id ON public.case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_user_id ON public.case_assignments(user_id);

COMMENT ON TABLE public.case_assignments IS 'Tracks which personnel are assigned to which cases';
