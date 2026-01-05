-- Create event_attendance table to track QR-based attendance
CREATE TABLE public.event_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, registration_id)
);

-- Enable RLS
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- Anyone can view attendance for validation (needed for QR scanning)
CREATE POLICY "Anyone can view attendance for validation"
ON public.event_attendance
FOR SELECT
USING (true);

-- Club admins can manage attendance for their events
CREATE POLICY "Club admins can manage their event attendance"
ON public.event_attendance
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM get_current_admin_session() gas
    JOIN events e ON e.club_id = gas.club_id
    WHERE e.id = event_attendance.event_id
  )
);

-- Allow inserts from edge functions (for registration confirmation emails)
CREATE POLICY "Allow insert for new registrations"
ON public.event_attendance
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_event_attendance_qr_token ON public.event_attendance(qr_token);
CREATE INDEX idx_event_attendance_event_id ON public.event_attendance(event_id);

-- Function to validate and mark attendance
CREATE OR REPLACE FUNCTION public.mark_event_attendance(p_qr_token TEXT, p_event_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  student_name TEXT,
  roll_number TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attendance event_attendance%ROWTYPE;
BEGIN
  -- Find the attendance record
  SELECT * INTO v_attendance
  FROM event_attendance ea
  WHERE ea.qr_token = p_qr_token;
  
  -- Check if QR exists
  IF v_attendance.id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid QR Code - Not found'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check if QR belongs to the correct event
  IF v_attendance.event_id != p_event_id THEN
    RETURN QUERY SELECT false, 'Invalid QR Code - Wrong event'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check if already scanned
  IF v_attendance.is_present = true THEN
    RETURN QUERY SELECT false, 'Attendance already marked'::TEXT, v_attendance.student_name, v_attendance.roll_number, v_attendance.scanned_at;
    RETURN;
  END IF;
  
  -- Mark attendance
  UPDATE event_attendance
  SET is_present = true, scanned_at = now()
  WHERE id = v_attendance.id
  RETURNING * INTO v_attendance;
  
  RETURN QUERY SELECT true, 'Attendance marked successfully'::TEXT, v_attendance.student_name, v_attendance.roll_number, v_attendance.scanned_at;
END;
$$;