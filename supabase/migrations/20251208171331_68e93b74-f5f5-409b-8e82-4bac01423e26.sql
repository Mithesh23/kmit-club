-- Allow mentors to delete mentor records
CREATE POLICY "Mentors can delete mentors"
ON public.mentors
FOR DELETE
USING (is_mentor());