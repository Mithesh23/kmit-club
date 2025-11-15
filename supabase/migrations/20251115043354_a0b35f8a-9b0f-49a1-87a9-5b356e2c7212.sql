-- Add event_date to events table
ALTER TABLE events ADD COLUMN event_date timestamp with time zone;

-- Create student_accounts table for student authentication
CREATE TABLE public.student_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;

-- Create student_sessions table for authentication tokens
CREATE TABLE public.student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES student_accounts(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE student_sessions ENABLE ROW LEVEL SECURITY;

-- Function to authenticate students
CREATE OR REPLACE FUNCTION authenticate_student(student_roll_number text, student_password text)
RETURNS TABLE(success boolean, token text, roll_number text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to get current student session
CREATE OR REPLACE FUNCTION get_current_student_session()
RETURNS TABLE(student_id uuid, roll_number text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- Trigger function to create student account when registration is approved
CREATE OR REPLACE FUNCTION create_student_account_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE TRIGGER on_registration_approved
AFTER UPDATE ON club_registrations
FOR EACH ROW
EXECUTE FUNCTION create_student_account_on_approval();

-- RLS policies for student_accounts
CREATE POLICY "Students can view their own account"
ON student_accounts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM get_current_student_session() gss
  WHERE gss.roll_number = student_accounts.roll_number
));

-- RLS policies for student_sessions
CREATE POLICY "Students can view their own sessions"
ON student_sessions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM get_current_student_session() gss
  WHERE gss.student_id = student_sessions.student_id
));

-- Allow students to view clubs they're registered in
CREATE POLICY "Students can view clubs they're approved for"
ON club_registrations
FOR SELECT
USING (
  status = 'approved' AND EXISTS (
    SELECT 1 FROM get_current_student_session() gss
    WHERE gss.roll_number = club_registrations.roll_number
  )
);

-- Allow students to view reports where they participated
CREATE POLICY "Students can view reports they participated in"
ON club_reports
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM get_current_student_session() gss
  WHERE gss.roll_number = ANY(club_reports.participants_roll_numbers)
));