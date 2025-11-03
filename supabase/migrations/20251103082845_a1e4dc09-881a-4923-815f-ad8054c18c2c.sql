-- Create tamper detection log table
CREATE TABLE IF NOT EXISTS public.tamper_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL, -- 'UPDATE', 'DELETE', 'SUSPICIOUS'
  old_data JSONB,
  new_data JSONB,
  detected_by UUID REFERENCES auth.users(id),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.tamper_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view tamper alerts
CREATE POLICY "Admins can view tamper alerts"
ON public.tamper_alerts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update tamper alerts (for resolution)
CREATE POLICY "Admins can resolve tamper alerts"
ON public.tamper_alerts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_tamper_alerts_resolved ON public.tamper_alerts(resolved, detected_at DESC);
CREATE INDEX idx_tamper_alerts_severity ON public.tamper_alerts(severity, detected_at DESC);

-- Function to create tamper alert and notify admins
CREATE OR REPLACE FUNCTION public.create_tamper_alert(
  p_table_name TEXT,
  p_record_id UUID,
  p_action TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Insert tamper alert
  INSERT INTO public.tamper_alerts (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    detected_by,
    severity
  ) VALUES (
    p_table_name,
    p_record_id,
    p_action,
    p_old_data,
    p_new_data,
    auth.uid(),
    p_severity
  );

  -- Notify all admins
  FOR v_admin_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      v_admin_id,
      'Security Alert: Potential Tampering Detected',
      format('Suspicious %s detected on %s. Record ID: %s', p_action, p_table_name, p_record_id),
      'security',
      'tamper_alert',
      p_record_id
    );
  END LOOP;
END;
$$;

-- Trigger function to detect evidence bag modifications
CREATE OR REPLACE FUNCTION public.detect_evidence_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Detect unauthorized status changes or critical field modifications
  IF TG_OP = 'UPDATE' THEN
    -- Check if critical fields changed
    IF (OLD.bag_id != NEW.bag_id OR 
        OLD.initial_collector != NEW.initial_collector OR
        OLD.date_collected != NEW.date_collected) THEN
      
      PERFORM public.create_tamper_alert(
        'evidence_bags',
        NEW.id,
        'UNAUTHORIZED_MODIFICATION',
        to_jsonb(OLD),
        to_jsonb(NEW),
        'high'
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_tamper_alert(
      'evidence_bags',
      OLD.id,
      'DELETION_ATTEMPT',
      to_jsonb(OLD),
      NULL,
      'critical'
    );
    -- Prevent deletion
    RAISE EXCEPTION 'Evidence bags cannot be deleted. This incident has been logged.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function to detect chain of custody tampering
CREATE OR REPLACE FUNCTION public.detect_custody_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.create_tamper_alert(
      'chain_of_custody_log',
      NEW.id,
      'CUSTODY_LOG_MODIFICATION',
      to_jsonb(OLD),
      to_jsonb(NEW),
      'critical'
    );
    -- Prevent modification
    RAISE EXCEPTION 'Chain of custody logs cannot be modified. This incident has been logged.';
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_tamper_alert(
      'chain_of_custody_log',
      OLD.id,
      'CUSTODY_LOG_DELETION',
      to_jsonb(OLD),
      NULL,
      'critical'
    );
    -- Prevent deletion
    RAISE EXCEPTION 'Chain of custody logs cannot be deleted. This incident has been logged.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function to detect photo tampering
CREATE OR REPLACE FUNCTION public.detect_photo_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Check if hash or URL changed
    IF (OLD.file_hash != NEW.file_hash OR OLD.photo_url != NEW.photo_url) THEN
      PERFORM public.create_tamper_alert(
        'evidence_photos',
        NEW.id,
        'PHOTO_MODIFICATION',
        to_jsonb(OLD),
        to_jsonb(NEW),
        'critical'
      );
      -- Prevent modification
      RAISE EXCEPTION 'Evidence photos cannot be modified. This incident has been logged.';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_tamper_alert(
      'evidence_photos',
      OLD.id,
      'PHOTO_DELETION',
      to_jsonb(OLD),
      NULL,
      'critical'
    );
    -- Prevent deletion
    RAISE EXCEPTION 'Evidence photos cannot be deleted. This incident has been logged.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for tamper detection
CREATE TRIGGER evidence_tampering_detection
  BEFORE UPDATE OR DELETE ON public.evidence_bags
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_evidence_tampering();

CREATE TRIGGER custody_tampering_detection
  BEFORE UPDATE OR DELETE ON public.chain_of_custody_log
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_custody_tampering();

CREATE TRIGGER photo_tampering_detection
  BEFORE UPDATE OR DELETE ON public.evidence_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_photo_tampering();

-- Function to verify blockchain integrity of custody chain
CREATE OR REPLACE FUNCTION public.verify_custody_chain_integrity(p_bag_id UUID)
RETURNS TABLE (
  log_id UUID,
  is_valid BOOLEAN,
  expected_hash TEXT,
  actual_hash TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_previous_hash TEXT := '';
  v_calculated_hash TEXT;
BEGIN
  FOR v_record IN 
    SELECT * FROM public.chain_of_custody_log
    WHERE bag_id = p_bag_id
    ORDER BY timestamp ASC
  LOOP
    -- Calculate what the hash should be
    v_calculated_hash := encode(
      digest(
        v_record.bag_id::TEXT || 
        v_record.action::TEXT || 
        v_record.performed_by::TEXT || 
        v_record.timestamp::TEXT || 
        COALESCE(v_previous_hash, ''),
        'sha256'
      ),
      'hex'
    );
    
    -- Return comparison result
    RETURN QUERY SELECT 
      v_record.id,
      (v_record.current_hash = v_calculated_hash),
      v_calculated_hash,
      v_record.current_hash;
    
    v_previous_hash := v_record.current_hash;
  END LOOP;
END;
$$;