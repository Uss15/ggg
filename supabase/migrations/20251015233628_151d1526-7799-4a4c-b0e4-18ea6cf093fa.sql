-- Fix the security definer view issue
-- Drop the existing view and recreate without security definer
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT id, full_name, badge_number
FROM public.profiles;

-- Ensure authenticated users can access the view
GRANT SELECT ON public.profiles_public TO authenticated;