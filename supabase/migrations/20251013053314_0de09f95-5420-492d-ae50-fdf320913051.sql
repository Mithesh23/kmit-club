-- Create report_type enum
CREATE TYPE public.report_type AS ENUM ('monthly', 'yearly', 'event');

-- Create registration_status enum
CREATE TYPE public.registration_status AS ENUM ('pending', 'approved', 'rejected');

-- Create club_reports table
CREATE TABLE public.club_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type public.report_type NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on club_reports
ALTER TABLE public.club_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for club_reports (admin only)
CREATE POLICY "Club admins can view their reports"
ON public.club_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id = club_reports.club_id
  )
);

CREATE POLICY "Club admins can manage their reports"
ON public.club_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id = club_reports.club_id
  )
);

-- Add status column to club_registrations
ALTER TABLE public.club_registrations 
ADD COLUMN status public.registration_status DEFAULT 'pending' NOT NULL;

-- Create club-reports storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-reports', 'club-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for club-reports bucket
CREATE POLICY "Admins can upload reports"
ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'club-reports'
  AND EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Admins can view their reports"
ON storage.objects
FOR SELECT TO anon
USING (
  bucket_id = 'club-reports'
  AND EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Admins can delete their reports"
ON storage.objects
FOR DELETE TO anon
USING (
  bucket_id = 'club-reports'
  AND EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id::text = (storage.foldername(name))[1]
  )
);