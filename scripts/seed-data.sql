-- SFEP Evidence Tracking System - Seed Data Script
-- This script creates sample data for testing and demonstration

-- Note: Run this AFTER creating your first admin user via the signup form

-- ============================================
-- 1. CREATE SAMPLE OFFICES
-- ============================================

INSERT INTO public.offices (code, name, city, address, phone, email) VALUES
  ('SF-HQ', 'San Francisco Headquarters', 'San Francisco', '850 Bryant St, San Francisco, CA 94103', '(415) 553-0123', 'sf-hq@sfep.example.com'),
  ('LA-01', 'Los Angeles Office', 'Los Angeles', '100 W 1st St, Los Angeles, CA 90012', '(213) 486-0150', 'la-01@sfep.example.com'),
  ('SD-01', 'San Diego Office', 'San Diego', '1401 Broadway, San Diego, CA 92101', '(619) 531-2000', 'sd-01@sfep.example.com'),
  ('OAK-01', 'Oakland Office', 'Oakland', '455 7th St, Oakland, CA 94607', '(510) 238-3365', 'oak-01@sfep.example.com'),
  ('SJ-01', 'San Jose Office', 'San Jose', '201 W Mission St, San Jose, CA 95110', '(408) 277-8900', 'sj-01@sfep.example.com')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. CREATE SAMPLE USERS
-- ============================================
-- Note: You need to create users via Supabase Auth first, then assign roles
-- This is just reference data showing what to create

/*
SAMPLE USERS TO CREATE VIA SIGNUP FORM:

1. Admin User:
   Email: admin@sfep.example.com
   Password: Admin123!@#
   Full Name: System Administrator
   Badge: ADMIN-001

2. Collector User:
   Email: collector@sfep.example.com
   Password: Collector123!
   Full Name: Evidence Collector
   Badge: COLLECT-001

3. Lab Tech User:
   Email: labtech@sfep.example.com
   Password: LabTech123!
   Full Name: Lab Technician
   Badge: LAB-001

4. Investigator User:
   Email: investigator@sfep.example.com
   Password: Investigator123!
   Full Name: Lead Investigator
   Badge: INV-001
*/

-- ============================================
-- 3. ASSIGN ROLES TO USERS
-- ============================================
-- Run these AFTER creating users above
-- Replace {user_id} with actual UUIDs from auth.users

/*
-- Admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@sfep.example.com'
ON CONFLICT DO NOTHING;

-- Collector role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'collector'::app_role
FROM auth.users
WHERE email = 'collector@sfep.example.com'
ON CONFLICT DO NOTHING;

-- Lab tech role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'lab_tech'::app_role
FROM auth.users
WHERE email = 'labtech@sfep.example.com'
ON CONFLICT DO NOTHING;

-- Investigator role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'investigator'::app_role
FROM auth.users
WHERE email = 'investigator@sfep.example.com'
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- 4. CREATE SAMPLE CASES
-- ============================================
-- Run this AFTER creating users and assigning roles

/*
INSERT INTO public.cases (case_number, offense_type, location, description, lead_officer, status, office_id)
SELECT 
  'CASE-2025-0001',
  'Burglary',
  '123 Market St, San Francisco, CA',
  'Residential burglary with forced entry. Multiple items stolen including electronics and jewelry.',
  (SELECT id FROM auth.users WHERE email = 'investigator@sfep.example.com' LIMIT 1),
  'under_investigation',
  (SELECT id FROM public.offices WHERE code = 'SF-HQ' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'investigator@sfep.example.com');

INSERT INTO public.cases (case_number, offense_type, location, description, lead_officer, status, office_id)
SELECT 
  'CASE-2025-0002',
  'Assault',
  '456 Mission St, San Francisco, CA',
  'Assault with a deadly weapon. Witness statements collected.',
  (SELECT id FROM auth.users WHERE email = 'investigator@sfep.example.com' LIMIT 1),
  'open',
  (SELECT id FROM public.offices WHERE code = 'SF-HQ' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'investigator@sfep.example.com');

INSERT INTO public.cases (case_number, offense_type, location, description, lead_officer, status, office_id)
SELECT 
  'CASE-2025-0003',
  'Theft',
  '789 Valencia St, San Francisco, CA',
  'Vehicle theft from parking garage. Security footage available.',
  (SELECT id FROM auth.users WHERE email = 'investigator@sfep.example.com' LIMIT 1),
  'open',
  (SELECT id FROM public.offices WHERE code = 'SF-HQ' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'investigator@sfep.example.com');
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify data was created successfully

-- Check offices
SELECT * FROM public.offices ORDER BY code;

-- Check user roles (after creating users)
/*
SELECT 
  ur.role,
  p.full_name,
  p.badge_number,
  au.email
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN public.profiles p ON ur.user_id = p.id
ORDER BY ur.role, p.full_name;
*/

-- Check cases
/*
SELECT 
  c.case_number,
  c.offense_type,
  c.status,
  p.full_name as lead_officer,
  o.name as office
FROM public.cases c
LEFT JOIN public.profiles p ON c.lead_officer = p.id
LEFT JOIN public.offices o ON c.office_id = o.id
ORDER BY c.created_at DESC;
*/

-- ============================================
-- NOTES
-- ============================================
/*
1. You must create users via the signup form first before running role assignments
2. Evidence bags should be created through the UI to ensure proper initialization
3. Chain of custody entries must be created through the UI to maintain hash chain integrity
4. Run this script in parts - create offices first, then users, then roles, then cases
5. For production, remove this seed data and create real users/cases as needed
*/
