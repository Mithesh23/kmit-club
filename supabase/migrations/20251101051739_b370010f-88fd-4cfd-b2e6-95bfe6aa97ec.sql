-- Add registration_open column to events table
ALTER TABLE public.events 
ADD COLUMN registration_open boolean NOT NULL DEFAULT true;

-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_email text NOT NULL,
  roll_number text NOT NULL,
  branch text NOT NULL,
  year text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, student_email)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_registrations
CREATE POLICY "Anyone can register for events"
ON public.event_registrations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Club admins can view their event registrations"
ON public.event_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM get_current_admin_session() gas
    JOIN events e ON e.club_id = gas.club_id
    WHERE e.id = event_registrations.event_id
  )
);

CREATE POLICY "Anyone can view their own registrations"
ON public.event_registrations
FOR SELECT
USING (true);

-- Create index for better performance
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_email ON public.event_registrations(student_email);