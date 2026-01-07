-- Add certificate_permission column to events table to track mentor approval
ALTER TABLE public.events 
ADD COLUMN certificate_permission boolean NOT NULL DEFAULT false;

-- Update RLS policy to allow mentors to update certificate permission
CREATE POLICY "Mentors can update event certificate permission"
ON public.events
FOR UPDATE
USING (is_mentor())
WITH CHECK (is_mentor());