-- Create certificate_requests table
CREATE TABLE public.certificate_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;

-- Policy for club admins to view their own requests
CREATE POLICY "Club admins can view their own requests"
ON public.certificate_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM get_current_admin_session() cas
    WHERE cas.club_id = certificate_requests.club_id
  )
);

-- Policy for club admins to create requests
CREATE POLICY "Club admins can create requests"
ON public.certificate_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_current_admin_session() cas
    WHERE cas.club_id = certificate_requests.club_id
  )
);

-- Policy for mentors to view all requests
CREATE POLICY "Mentors can view all requests"
ON public.certificate_requests
FOR SELECT
USING (is_mentor());

-- Policy for mentors to update requests (grant/reject)
CREATE POLICY "Mentors can update requests"
ON public.certificate_requests
FOR UPDATE
USING (is_mentor());

-- Create unique constraint to prevent duplicate requests
CREATE UNIQUE INDEX idx_certificate_requests_event_unique 
ON public.certificate_requests(event_id) 
WHERE status = 'pending';

-- Create a function to auto-grant certificate_permission when request is approved
CREATE OR REPLACE FUNCTION public.handle_certificate_request_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.events
    SET certificate_permission = true
    WHERE id = NEW.event_id;
    NEW.responded_at = now();
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_certificate_request_status_change
BEFORE UPDATE ON public.certificate_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_certificate_request_approval();