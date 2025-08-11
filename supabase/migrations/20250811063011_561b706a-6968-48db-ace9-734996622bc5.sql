-- Update all existing club admin passwords to the new default password
UPDATE public.club_admins 
SET password_hash = crypt('Kmit123$', gen_salt('bf'));

-- Update the function to return the new default password
CREATE OR REPLACE FUNCTION public.get_all_club_credentials()
 RETURNS TABLE(club_name text, admin_email text, plain_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.name as club_name,
        ca.email as admin_email,
        'Kmit123$'::text as plain_password
    FROM public.clubs c
    JOIN public.club_admins ca ON c.id = ca.club_id
    ORDER BY c.name;
END;
$function$

-- Update the trigger function to use the new default password for new clubs
CREATE OR REPLACE FUNCTION public.create_default_admin_for_club()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert default admin credentials for the new club with new default password
    INSERT INTO public.club_admins (club_id, email, password_hash)
    VALUES (
        NEW.id, 
        LOWER(REPLACE(NEW.name, ' ', '')) || '@admin.com',
        crypt('Kmit123$', gen_salt('bf'))
    );
    
    RETURN NEW;
END;
$function$