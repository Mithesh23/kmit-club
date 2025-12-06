-- Clean up duplicate triggers - keep only one
DROP TRIGGER IF EXISTS on_registration_approved ON public.club_registrations;
DROP TRIGGER IF EXISTS club_registrations_after_approve_trigger ON public.club_registrations;

-- Drop the old duplicate function
DROP FUNCTION IF EXISTS public.club_registrations_after_approve() CASCADE;

-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kmit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kmit_event_images ENABLE ROW LEVEL SECURITY;