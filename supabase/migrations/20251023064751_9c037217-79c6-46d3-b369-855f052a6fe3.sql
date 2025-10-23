-- Drop the restrictive policy that denies all public access
DROP POLICY IF EXISTS "Deny public access to registrations" ON public.club_registrations;

-- Create a new policy to allow anyone to view approved registrations
CREATE POLICY "Anyone can view approved registrations"
ON public.club_registrations
FOR SELECT
USING (status = 'approved');

-- Keep the existing policy for admins to view all their club registrations
-- (This already exists, so no need to recreate it)