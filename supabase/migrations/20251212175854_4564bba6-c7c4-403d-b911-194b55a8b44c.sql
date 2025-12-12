-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_all_club_credentials();
DROP FUNCTION IF EXISTS public.get_all_student_credentials();

-- Recreate get_all_club_credentials with password_changed indicator
CREATE FUNCTION public.get_all_club_credentials()
 RETURNS TABLE(club_name text, admin_email text, plain_password text, password_changed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.name as club_name,
        ca.email as admin_email,
        'Kmit123$'::text as plain_password,
        (ca.password_hash != crypt('Kmit123$', ca.password_hash)) as password_changed
    FROM public.clubs c
    JOIN public.club_admins ca ON c.id = ca.club_id
    ORDER BY c.name;
END;
$function$;

-- Recreate get_all_student_credentials with password_changed indicator
CREATE FUNCTION public.get_all_student_credentials()
 RETURNS TABLE(id uuid, roll_number text, student_email text, phone text, year text, branch text, password_changed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.roll_number,
    sa.student_email,
    sa.phone,
    sa.year,
    sa.branch,
    (sa.password_hash != crypt('Kmitclubs123', sa.password_hash)) as password_changed
  FROM public.student_accounts sa
  ORDER BY sa.roll_number;
END;
$function$;