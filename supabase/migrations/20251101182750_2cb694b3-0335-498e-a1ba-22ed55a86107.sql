-- Create offices table
CREATE TABLE IF NOT EXISTS public.offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on offices
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- Policies for offices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'offices' AND policyname = 'Anyone authenticated can view offices'
  ) THEN
    CREATE POLICY "Anyone authenticated can view offices"
    ON public.offices
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'offices' AND policyname = 'Admins can manage offices'
  ) THEN
    CREATE POLICY "Admins can manage offices"
    ON public.offices
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Seed a few offices if table is empty
INSERT INTO public.offices (name, code, city, address, phone, email)
SELECT * FROM (VALUES
  ('Baghdad Central Office', 'BGD-CENT', 'Baghdad', 'Al-Karrada, Baghdad', '+964-1-111-2222', 'baghdad.central@example.gov'),
  ('Basra Regional Office', 'BSR-REG', 'Basra', 'Corniche St, Basra', '+964-1-333-4444', 'basra.office@example.gov'),
  ('Erbil Directorate', 'ERB-DIR', 'Erbil', 'Sami Abdulrahman Park, Erbil', '+964-1-555-6666', 'erbil.dir@example.gov'),
  ('Nineveh Field Office', 'NIV-FLD', 'Mosul', 'Al-Muthanna, Mosul', '+964-1-777-8888', 'nineveh.field@example.gov'),
  ('Kirkuk Unit', 'KRK-UNIT', 'Kirkuk', 'Citadel Rd, Kirkuk', '+964-1-999-0000', 'kirkuk.unit@example.gov')
) AS v(name, code, city, address, phone, email)
WHERE NOT EXISTS (SELECT 1 FROM public.offices);

-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  offense_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  location TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  lead_officer UUID NOT NULL,
  office_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT cases_lead_officer_fkey FOREIGN KEY (lead_officer) REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT cases_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE SET NULL
);

-- Trigger to keep updated_at fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_cases_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Enable RLS on cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Policies for cases
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cases' AND policyname = 'Users can view cases'
  ) THEN
    CREATE POLICY "Users can view cases"
    ON public.cases
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cases' AND policyname = 'Users can create cases for themselves'
  ) THEN
    CREATE POLICY "Users can create cases for themselves"
    ON public.cases
    FOR INSERT
    TO authenticated
    WITH CHECK (lead_officer = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cases' AND policyname = 'Owners or admins can update cases'
  ) THEN
    CREATE POLICY "Owners or admins can update cases"
    ON public.cases
    FOR UPDATE
    TO authenticated
    USING (lead_officer = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    WITH CHECK (lead_officer = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cases' AND policyname = 'Admins can delete cases'
  ) THEN
    CREATE POLICY "Admins can delete cases"
    ON public.cases
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'Users can view own audit or admins all'
  ) THEN
    CREATE POLICY "Users can view own audit or admins all"
    ON public.audit_log
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'Users can insert own audit rows'
  ) THEN
    CREATE POLICY "Users can insert own audit rows"
    ON public.audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Function to generate case numbers like CASE-YYYY-0001
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  year TEXT;
  counter INT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');

  SELECT COUNT(*) + 1 INTO counter
  FROM public.cases
  WHERE case_number LIKE 'CASE-' || year || '-%';

  new_id := 'CASE-' || year || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_id;
END;
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- Create notifications table to remove runtime errors
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can insert own notifications'
  ) THEN
    CREATE POLICY "Users can insert own notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
