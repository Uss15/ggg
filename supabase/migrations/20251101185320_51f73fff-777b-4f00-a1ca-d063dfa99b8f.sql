-- Add 'investigator' role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'investigator';

-- Add digital signature and hash chaining to chain_of_custody_log
ALTER TABLE chain_of_custody_log
ADD COLUMN IF NOT EXISTS digital_signature TEXT,
ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS previous_hash TEXT,
ADD COLUMN IF NOT EXISTS current_hash TEXT;

-- Add file hash to evidence_photos for integrity verification
ALTER TABLE evidence_photos
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add case closure immutability fields
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS closure_notes TEXT;

-- Create disposal_requests table for disposal workflow with witness signatures
CREATE TABLE IF NOT EXISTS disposal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id UUID NOT NULL REFERENCES evidence_bags(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  disposal_type TEXT NOT NULL CHECK (disposal_type IN ('released', 'destroyed', 'returned')),
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  witness1_name TEXT,
  witness1_signature TEXT,
  witness1_signed_at TIMESTAMP WITH TIME ZONE,
  witness2_name TEXT,
  witness2_signature TEXT,
  witness2_signed_at TIMESTAMP WITH TIME ZONE,
  disposal_documentation TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on disposal_requests
ALTER TABLE disposal_requests ENABLE ROW LEVEL SECURITY;

-- Disposal RLS Policies
CREATE POLICY "Authenticated users can view disposal requests"
ON disposal_requests FOR SELECT
USING (true);

CREATE POLICY "Users can create disposal requests"
ON disposal_requests FOR INSERT
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can manage disposal requests"
ON disposal_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit_checks table for random audit feature
CREATE TABLE IF NOT EXISTS audit_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  total_items INT NOT NULL DEFAULT 0,
  checked_items INT NOT NULL DEFAULT 0,
  discrepancies INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_check_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audit_checks(id) ON DELETE CASCADE,
  bag_id UUID NOT NULL REFERENCES evidence_bags(id),
  expected_status TEXT NOT NULL,
  actual_status TEXT,
  expected_location TEXT NOT NULL,
  actual_location TEXT,
  discrepancy BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMP WITH TIME ZONE,
  checked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit tables
ALTER TABLE audit_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_check_items ENABLE ROW LEVEL SECURITY;

-- Audit RLS Policies
CREATE POLICY "Admins can manage audits"
ON audit_checks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view audits"
ON audit_checks FOR SELECT
USING (true);

CREATE POLICY "Admins can manage audit items"
ON audit_check_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view audit items"
ON audit_check_items FOR SELECT
USING (true);

-- Add trigger for disposal_requests updated_at
CREATE TRIGGER update_disposal_requests_updated_at
BEFORE UPDATE ON disposal_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to generate custody hash chain
CREATE OR REPLACE FUNCTION generate_custody_hash(
  p_bag_id UUID,
  p_action TEXT,
  p_performed_by UUID,
  p_timestamp TIMESTAMP WITH TIME ZONE,
  p_previous_hash TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- Generate SHA-256 hash of concatenated values
  v_hash := encode(
    digest(
      p_bag_id::TEXT || 
      p_action::TEXT || 
      p_performed_by::TEXT || 
      p_timestamp::TEXT || 
      COALESCE(p_previous_hash, ''),
      'sha256'
    ),
    'hex'
  );
  RETURN v_hash;
END;
$$;

-- Function to prevent case modification after closure
CREATE OR REPLACE FUNCTION prevent_closed_case_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_closed = TRUE THEN
    RAISE EXCEPTION 'Cannot modify closed case. Case % was closed on %', OLD.case_number, OLD.closed_at;
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to prevent closed case modifications
CREATE TRIGGER prevent_closed_case_update
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION prevent_closed_case_modification();