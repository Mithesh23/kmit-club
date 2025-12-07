-- Drop existing policies on kmit_event_images
DROP POLICY IF EXISTS "Mentors can delete images" ON public.kmit_event_images;
DROP POLICY IF EXISTS "Mentors can insert images" ON public.kmit_event_images;
DROP POLICY IF EXISTS "Public can read images" ON public.kmit_event_images;

-- Create proper PERMISSIVE policies
CREATE POLICY "Public can read kmit event images"
ON public.kmit_event_images
FOR SELECT
USING (true);

CREATE POLICY "Mentors can insert kmit event images"
ON public.kmit_event_images
FOR INSERT
WITH CHECK (is_mentor());

CREATE POLICY "Mentors can delete kmit event images"
ON public.kmit_event_images
FOR DELETE
USING (is_mentor());