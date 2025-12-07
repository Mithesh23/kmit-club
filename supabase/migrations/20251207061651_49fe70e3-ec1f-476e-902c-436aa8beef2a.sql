-- Create password reset tokens table for students
CREATE TABLE public.student_password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_number text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No direct access - only through edge functions using service role
-- Create function to reset student password with token
CREATE OR REPLACE FUNCTION public.reset_student_password_with_token(
  reset_token text,
  new_password text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Find valid token
  SELECT roll_number INTO token_record
  FROM student_password_reset_tokens
  WHERE token = reset_token
  AND expires_at > now()
  AND used = false;
  
  IF token_record IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired reset token'::text;
    RETURN;
  END IF;
  
  -- Update password
  UPDATE student_accounts
  SET password_hash = crypt(new_password, gen_salt('bf'))
  WHERE roll_number = token_record.roll_number;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Student account not found'::text;
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE student_password_reset_tokens
  SET used = true
  WHERE token = reset_token;
  
  RETURN QUERY SELECT true, 'Password reset successfully'::text;
END;
$$;