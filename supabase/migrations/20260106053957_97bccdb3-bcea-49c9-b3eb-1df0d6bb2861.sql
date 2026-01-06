-- Create certificates table
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  roll_number text NOT NULL,
  student_name text NOT NULL,
  student_email text NOT NULL,
  certificate_title text NOT NULL,
  description text,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  certificate_number text UNIQUE NOT NULL DEFAULT ('CERT-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_certificates_roll_number ON public.certificates(roll_number);
CREATE INDEX idx_certificates_event_id ON public.certificates(event_id);
CREATE INDEX idx_certificates_club_id ON public.certificates(club_id);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view certificates (for verification purposes)
CREATE POLICY "Anyone can view certificates"
ON public.certificates
FOR SELECT
USING (true);

-- Policy: Club admins can manage certificates for their club
CREATE POLICY "Club admins can manage their certificates"
ON public.certificates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM get_current_admin_session() gas
    WHERE gas.club_id = certificates.club_id
  )
);

-- Policy: Students can view their own certificates
CREATE POLICY "Students can view their own certificates"
ON public.certificates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM get_current_student_session() gss
    WHERE gss.roll_number = certificates.roll_number
  )
);