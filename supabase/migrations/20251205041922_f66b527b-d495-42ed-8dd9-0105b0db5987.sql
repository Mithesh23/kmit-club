-- Add is_active column to clubs table
ALTER TABLE public.clubs ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create function to check if club is active for authentication
CREATE OR REPLACE FUNCTION public.is_club_active(club_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_active, true)
  FROM public.clubs
  WHERE id = club_id_param
$$;

-- Update authenticate_club_admin to check if club is active
CREATE OR REPLACE FUNCTION public.authenticate_club_admin(admin_email text, admin_password text)
RETURNS TABLE(success boolean, token text, club_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    admin_record RECORD;
    session_token TEXT;
    club_active BOOLEAN;
BEGIN
    -- Check if admin exists and password matches
    SELECT ca.id, ca.club_id INTO admin_record 
    FROM public.club_admins ca
    WHERE ca.email = admin_email AND ca.password_hash = crypt(admin_password, ca.password_hash);
    
    IF admin_record IS NULL THEN
        RETURN QUERY SELECT false, ''::TEXT, NULL::UUID, 'Invalid credentials'::TEXT;
        RETURN;
    END IF;
    
    -- Check if club is active
    SELECT c.is_active INTO club_active
    FROM public.clubs c
    WHERE c.id = admin_record.club_id;
    
    IF NOT COALESCE(club_active, true) THEN
        RETURN QUERY SELECT false, ''::TEXT, NULL::UUID, 'This club has been disabled. Please contact the administrator.'::TEXT;
        RETURN;
    END IF;
    
    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create session
    INSERT INTO public.club_admin_sessions (admin_id, token, expires_at)
    VALUES (admin_record.id, session_token, now() + INTERVAL '24 hours');
    
    RETURN QUERY SELECT true, session_token, admin_record.club_id, 'Login successful'::TEXT;
END;
$function$;