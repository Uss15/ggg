-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('collector', 'transport', 'lab_tech', 'admin');

-- Create enum for evidence types
CREATE TYPE public.evidence_type AS ENUM ('weapon', 'clothing', 'biological_sample', 'documents', 'electronics', 'other');

-- Create enum for evidence status
CREATE TYPE public.evidence_status AS ENUM ('collected', 'in_transport', 'in_lab', 'analyzed', 'archived');

-- Create enum for action types
CREATE TYPE public.action_type AS ENUM ('collected', 'packed', 'transferred', 'received', 'analyzed', 'archived');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  badge_number TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create evidence_bags table
CREATE TABLE public.evidence_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id TEXT UNIQUE NOT NULL,
  type evidence_type NOT NULL,
  description TEXT NOT NULL,
  initial_collector UUID REFERENCES auth.users(id) NOT NULL,
  date_collected TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT NOT NULL,
  notes TEXT,
  current_status evidence_status NOT NULL DEFAULT 'collected',
  qr_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.evidence_bags ENABLE ROW LEVEL SECURITY;

-- Create chain_of_custody_log table
CREATE TABLE public.chain_of_custody_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id UUID REFERENCES public.evidence_bags(id) ON DELETE CASCADE NOT NULL,
  action action_type NOT NULL,
  performed_by UUID REFERENCES auth.users(id) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chain_of_custody_log ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for evidence photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-photos', 'evidence-photos', true);

-- RLS policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for evidence_bags
CREATE POLICY "Authenticated users can view all evidence bags"
  ON public.evidence_bags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Collectors and admins can create evidence bags"
  ON public.evidence_bags FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'collector') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Collectors, lab techs and admins can update evidence bags"
  ON public.evidence_bags FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'collector') OR
    public.has_role(auth.uid(), 'lab_tech') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete evidence bags"
  ON public.evidence_bags FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for chain_of_custody_log
CREATE POLICY "Authenticated users can view chain of custody"
  ON public.chain_of_custody_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add to chain of custody"
  ON public.chain_of_custody_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = performed_by);

-- Storage policies for evidence-photos
CREATE POLICY "Authenticated users can view photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'evidence-photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evidence-photos');

CREATE POLICY "Authenticated users can update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'evidence-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'evidence-photos' AND public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidence_bags_updated_at
  BEFORE UPDATE ON public.evidence_bags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, badge_number, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'badge_number',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique bag IDs
CREATE OR REPLACE FUNCTION public.generate_bag_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  year TEXT;
  counter INT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO counter
  FROM public.evidence_bags
  WHERE bag_id LIKE 'BAG-' || year || '-%';
  
  new_id := 'BAG-' || year || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;