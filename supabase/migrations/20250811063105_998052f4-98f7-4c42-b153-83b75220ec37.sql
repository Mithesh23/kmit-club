-- Update all existing club admin passwords to the new default password
UPDATE public.club_admins 
SET password_hash = crypt('Kmit123$', gen_salt('bf'));