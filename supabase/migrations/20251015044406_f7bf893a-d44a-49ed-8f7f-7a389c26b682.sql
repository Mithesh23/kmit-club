-- Add UPDATE policy for club_registrations to allow admins to update registration status
CREATE POLICY "Club admins can update their club registrations"
ON public.club_registrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM get_current_admin_session() gas
    WHERE gas.admin_id IS NOT NULL 
    AND gas.club_id = club_registrations.club_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM get_current_admin_session() gas
    WHERE gas.admin_id IS NOT NULL 
    AND gas.club_id = club_registrations.club_id
  )
);