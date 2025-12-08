-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Mentors can insert events" ON public.kmit_events;

-- Create a new permissive INSERT policy that checks is_mentor()
CREATE POLICY "Mentors can insert events" 
ON public.kmit_events 
FOR INSERT 
TO public
WITH CHECK (is_mentor());

-- Also fix the UPDATE and DELETE policies to properly check is_mentor()
DROP POLICY IF EXISTS "Mentors can update events" ON public.kmit_events;
CREATE POLICY "Mentors can update events" 
ON public.kmit_events 
FOR UPDATE 
TO public
USING (is_mentor());

DROP POLICY IF EXISTS "Mentors can delete events" ON public.kmit_events;
CREATE POLICY "Mentors can delete events" 
ON public.kmit_events 
FOR DELETE 
TO public
USING (is_mentor());