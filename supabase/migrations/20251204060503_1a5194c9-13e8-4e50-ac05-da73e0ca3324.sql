-- Create attendance_events table for storing event details
CREATE TABLE public.attendance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_records table for tracking who attended
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_event_id UUID NOT NULL REFERENCES public.attendance_events(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attendance_event_id, roll_number)
);

-- Enable RLS
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for attendance_events
CREATE POLICY "Anyone can view attendance events"
ON public.attendance_events
FOR SELECT
USING (true);

CREATE POLICY "Club admins can manage their attendance events"
ON public.attendance_events
FOR ALL
USING (EXISTS (
  SELECT 1 FROM get_current_admin_session() gas
  WHERE gas.club_id = attendance_events.club_id
));

-- RLS policies for attendance_records
CREATE POLICY "Anyone can view attendance records"
ON public.attendance_records
FOR SELECT
USING (true);

CREATE POLICY "Club admins can manage attendance records"
ON public.attendance_records
FOR ALL
USING (EXISTS (
  SELECT 1 FROM get_current_admin_session() gas
  JOIN attendance_events ae ON ae.club_id = gas.club_id
  WHERE ae.id = attendance_records.attendance_event_id
));

CREATE POLICY "Students can view their own attendance"
ON public.attendance_records
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM get_current_student_session() gss
  WHERE gss.roll_number = attendance_records.roll_number
));