-- Fix search path for new student authentication functions
CREATE OR REPLACE FUNCTION authenticate_student(student_roll_number text, student_password text)
RETURNS TABLE(success boolean, token text, roll_number text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION get_current_student_session()
RETURNS TABLE(student_id uuid, roll_number text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_header text;
  token_value text;
BEGIN
  auth_header := current_setting('request.headers', true)::json->>'authorization';
  
  IF auth_header IS NULL OR auth_header = '' THEN
    RETURN;
  END IF;
  
  token_value := CASE 
    WHEN auth_header LIKE 'Bearer %' THEN substring(auth_header from 8)
    ELSE auth_header
  END IF;
  
  IF token_value IS NULL OR token_value = '' THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT ss.student_id, sa.roll_number
  FROM student_sessions ss
  JOIN student_accounts sa ON ss.student_id = sa.id
  WHERE ss.token = token_value 
  AND ss.expires_at > now();
END;
$$;

CREATE OR REPLACE FUNCTION create_student_account_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;