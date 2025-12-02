-- Fix search_path for functions that use pgcrypto.crypt so that
-- the 'extensions' schema is correctly included in the path.

CREATE OR REPLACE FUNCTION public.update_club_admin_password(club_admin_email text, new_password text)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
    UPDATE public.club_admins 
    SET password_hash = crypt(new_password, gen_salt('bf'))
    WHERE email = club_admin_email;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Password updated successfully'::text;
    ELSE
        RETURN QUERY SELECT false, 'Admin not found'::text;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_admin_for_club()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
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
$function$;

CREATE OR REPLACE FUNCTION public.authenticate_club_admin(admin_email text, admin_password text)
 RETURNS TABLE(success boolean, token text, club_id uuid, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
    admin_record RECORD;
    session_token TEXT;
BEGIN
    -- Check if admin exists and password matches
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
$function$;

CREATE OR REPLACE FUNCTION public.create_student_account_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
  IF NEW.status = 'approved' AND NEW.roll_number IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    IF NOT EXISTS (SELECT 1 FROM student_accounts WHERE roll_number = NEW.roll_number) THEN
      INSERT INTO student_accounts (roll_number, password_hash)
      VALUES (NEW.roll_number, crypt('Kmitclubs123', gen_salt('bf')));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.authenticate_student(student_roll_number text, student_password text)
 RETURNS TABLE(success boolean, token text, roll_number text, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  student_record RECORD;
  session_token TEXT;
BEGIN
  SELECT sa.id, sa.roll_number INTO student_record 
  FROM public.student_accounts sa
  WHERE sa.roll_number = student_roll_number 
  AND sa.password_hash = crypt(student_password, sa.password_hash);
  
  IF student_record IS NULL THEN
    RETURN QUERY SELECT false, ''::TEXT, ''::TEXT, 'Invalid credentials'::TEXT;
    RETURN;
  END IF;
  
  session_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO public.student_sessions (student_id, token, expires_at)
  VALUES (student_record.id, session_token, now() + INTERVAL '24 hours');
  
  RETURN QUERY SELECT true, session_token, student_record.roll_number, 'Login successful'::TEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_club_admin(club_id uuid, admin_email text, admin_password text)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
    INSERT INTO public.club_admins (club_id, email, password_hash)
    VALUES (club_id, admin_email, crypt(admin_password, gen_salt('bf')));
    
    RETURN QUERY SELECT true, 'Admin created successfully'::TEXT;
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT false, 'Email already exists'::TEXT;
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating admin'::TEXT;
END;
$function$;