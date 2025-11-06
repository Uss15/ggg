-- Security Fix: Add explicit DENY policy for tamper_alerts INSERT
-- This makes it clear that only SECURITY DEFINER functions can insert tamper alerts
CREATE POLICY "Only system functions can insert tamper alerts"
ON public.tamper_alerts
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Add comment explaining the security model
COMMENT ON POLICY "Only system functions can insert tamper alerts" ON public.tamper_alerts IS 
'Explicit DENY policy. Tamper alerts can only be inserted via SECURITY DEFINER functions (create_tamper_alert), never by direct user action.';