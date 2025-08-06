-- Fix the ambiguous column reference in authenticate_club_admin function
CREATE OR REPLACE FUNCTION public.authenticate_club_admin(admin_email text, admin_password text)
 RETURNS TABLE(success boolean, token text, club_id uuid, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    admin_record RECORD;
    session_token TEXT;
BEGIN
    -- Check if admin exists and password matches (in real app, use proper password hashing)
    SELECT ca.id, ca.club_id INTO admin_record 
    FROM public.club_admins ca
    WHERE ca.email = admin_email AND ca.password_hash = crypt(admin_password, ca.password_hash);
    
    IF admin_record IS NULL THEN
        RETURN QUERY SELECT false, ''::TEXT, NULL::UUID, 'Invalid credentials'::TEXT;
        RETURN;
    END IF;
    
    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create session
    INSERT INTO public.club_admin_sessions (admin_id, token, expires_at)
    VALUES (admin_record.id, session_token, now() + INTERVAL '24 hours');
    
    RETURN QUERY SELECT true, session_token, admin_record.club_id, 'Login successful'::TEXT;
END;
$function$