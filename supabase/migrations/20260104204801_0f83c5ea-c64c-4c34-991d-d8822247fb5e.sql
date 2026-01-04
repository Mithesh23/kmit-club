-- Enable required extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to insert the student session
CREATE OR REPLACE FUNCTION public.insert_daily_student_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student_id uuid;
  v_roll_number text := '24bd5a6711';
BEGIN
  -- Get the student_id for the roll number
  SELECT id INTO v_student_id
  FROM student_accounts
  WHERE roll_number = v_roll_number;
  
  -- If student doesn't exist, create a placeholder (or skip)
  IF v_student_id IS NULL THEN
    RAISE NOTICE 'Student with roll number % not found, skipping insertion', v_roll_number;
    RETURN;
  END IF;
  
  -- Check if a session was already created today for this student
  IF EXISTS (
    SELECT 1 FROM student_sessions
    WHERE student_id = v_student_id
    AND created_at::date = CURRENT_DATE
  ) THEN
    RAISE NOTICE 'Session already exists for today, skipping';
    RETURN;
  END IF;
  
  -- Insert new session with dummy data
  INSERT INTO student_sessions (student_id, token, expires_at, created_at)
  VALUES (
    v_student_id,
    'auto_session_' || encode(gen_random_bytes(16), 'hex'),
    now() + INTERVAL '24 hours',
    now()
  );
  
  RAISE NOTICE 'Successfully inserted session for roll number %', v_roll_number;
END;
$$;

-- Schedule the cron job to run at 11:11 AM IST (05:41 UTC) every day
SELECT cron.schedule(
  'daily-student-session-insert',
  '41 5 * * *',
  $$SELECT public.insert_daily_student_session()$$
);