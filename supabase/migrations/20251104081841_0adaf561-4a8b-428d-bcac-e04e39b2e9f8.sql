-- Enhanced Security Features: Geo-fencing, Role Auditing, and Access Control

-- Table for authorized geo-fencing zones
CREATE TABLE IF NOT EXISTS public.authorized_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  center_latitude DOUBLE PRECISION NOT NULL,
  center_longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_latitude CHECK (center_latitude >= -90 AND center_latitude <= 90),
  CONSTRAINT valid_longitude CHECK (center_longitude >= -180 AND center_longitude <= 180),
  CONSTRAINT valid_radius CHECK (radius_meters > 0)
);

-- Table for login attempts and security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL DEFAULT 'success',
  ip_address TEXT,
  user_agent TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_authorized BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (event_type IN ('login', 'logout', 'mfa_enrollment', 'mfa_verification', 'role_change', 'password_change', 'api_access')),
  CONSTRAINT valid_event_status CHECK (event_status IN ('success', 'failed', 'blocked'))
);

-- Table for role change history
CREATE TABLE IF NOT EXISTS public.role_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  old_roles JSONB,
  new_roles JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for IP whitelist/blacklist
CREATE TABLE IF NOT EXISTS public.ip_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  access_type TEXT NOT NULL DEFAULT 'whitelist',
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT valid_access_type CHECK (access_type IN ('whitelist', 'blacklist'))
);

-- Enable RLS
ALTER TABLE public.authorized_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_access_control ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authorized_zones
CREATE POLICY "Admins can manage authorized zones"
  ON public.authorized_zones
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view authorized zones"
  ON public.authorized_zones
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for security_events
CREATE POLICY "Users can view own security events"
  ON public.security_events
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all security events"
  ON public.security_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert security events"
  ON public.security_events
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for role_changes
CREATE POLICY "Users can view own role changes"
  ON public.role_changes
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all role changes"
  ON public.role_changes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert role changes"
  ON public.role_changes
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for ip_access_control
CREATE POLICY "Admins can manage IP access control"
  ON public.ip_access_control
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_status TEXT DEFAULT 'success',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_location_authorized BOOLEAN DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_status,
    ip_address,
    user_agent,
    latitude,
    longitude,
    location_authorized,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_status,
    p_ip_address,
    p_user_agent,
    p_latitude,
    p_longitude,
    p_location_authorized,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to validate geo-fencing
CREATE OR REPLACE FUNCTION public.validate_geofence(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS TABLE(is_authorized BOOLEAN, zone_name TEXT, office_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as is_authorized,
    az.zone_name,
    o.name as office_name
  FROM public.authorized_zones az
  LEFT JOIN public.offices o ON o.id = az.office_id
  WHERE az.is_active = true
    AND (
      -- Calculate distance using Haversine formula (approximate)
      6371000 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(az.center_latitude)) * 
        cos(radians(az.center_longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(az.center_latitude))
      )
    ) <= az.radius_meters
  LIMIT 1;
END;
$$;

-- Function to check IP access
CREATE OR REPLACE FUNCTION public.check_ip_access(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_blacklisted BOOLEAN;
  v_is_whitelisted BOOLEAN;
  v_has_whitelist BOOLEAN;
BEGIN
  -- Check if there are any active whitelist entries
  SELECT EXISTS (
    SELECT 1 FROM public.ip_access_control
    WHERE access_type = 'whitelist' AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_whitelist;
  
  -- Check if IP is blacklisted
  SELECT EXISTS (
    SELECT 1 FROM public.ip_access_control
    WHERE ip_address = p_ip_address
      AND access_type = 'blacklist'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_blacklisted;
  
  IF v_is_blacklisted THEN
    RETURN false;
  END IF;
  
  -- If whitelist exists, check if IP is whitelisted
  IF v_has_whitelist THEN
    SELECT EXISTS (
      SELECT 1 FROM public.ip_access_control
      WHERE ip_address = p_ip_address
        AND access_type = 'whitelist'
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    ) INTO v_is_whitelisted;
    
    RETURN v_is_whitelisted;
  END IF;
  
  -- If no whitelist exists and IP is not blacklisted, allow access
  RETURN true;
END;
$$;

-- Trigger to track role changes
CREATE OR REPLACE FUNCTION public.track_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_changes (user_id, changed_by, old_roles, new_roles, reason)
    VALUES (
      NEW.user_id,
      auth.uid(),
      '[]'::jsonb,
      jsonb_build_array(NEW.role),
      'Role assigned'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_changes (user_id, changed_by, old_roles, new_roles, reason)
    VALUES (
      OLD.user_id,
      auth.uid(),
      jsonb_build_array(OLD.role),
      '[]'::jsonb,
      'Role removed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS track_role_changes_trigger ON public.user_roles;
CREATE TRIGGER track_role_changes_trigger
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.track_role_changes();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_role_changes_user_id ON public.role_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_created_at ON public.role_changes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_access_control_ip ON public.ip_access_control(ip_address) WHERE is_active = true;