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
$function$;