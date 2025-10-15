-- Security Fix 1: Create limited profiles view and restrict profiles table access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a limited public view with only name and badge (no phone)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, full_name, badge_number
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Restrict full profiles table to own profile + admins
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Security Fix 2: Make evidence-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'evidence-photos';

-- Security Fix 3: Add role check to generate_bag_id function
CREATE OR REPLACE FUNCTION public.generate_bag_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  year TEXT;
  counter INT;
BEGIN
  -- Restrict to collectors and admins only
  IF NOT (public.has_role(auth.uid(), 'collector') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized: Only collectors and admins can generate bag IDs';
  END IF;
  
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO counter
  FROM public.evidence_bags
  WHERE bag_id LIKE 'BAG-' || year || '-%';
  
  new_id := 'BAG-' || year || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Security Fix 4: Auto-assign collector role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, badge_number, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'badge_number',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Assign default 'collector' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'collector');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;