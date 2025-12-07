-- Function to change student password
CREATE OR REPLACE FUNCTION public.change_student_password(
  student_roll_number text,
  old_password text,
  new_password text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  student_record RECORD;
BEGIN
  -- Verify old password
  SELECT id INTO student_record 
  FROM public.student_accounts 
  WHERE roll_number = student_roll_number 
  AND password_hash = crypt(old_password, password_hash);
  
  IF student_record IS NULL THEN
    RETURN QUERY SELECT false, 'Current password is incorrect'::text;
    RETURN;
  END IF;
  
  -- Update to new password
  UPDATE public.student_accounts 
  SET password_hash = crypt(new_password, gen_salt('bf'))
  WHERE roll_number = student_roll_number;
  
  RETURN QUERY SELECT true, 'Password changed successfully'::text;
END;
$$;

-- Function to change club admin password
CREATE OR REPLACE FUNCTION public.change_club_admin_password(
  admin_club_id uuid,
  old_password text,
  new_password text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Verify old password
  SELECT id INTO admin_record 
  FROM public.club_admins 
  WHERE club_id = admin_club_id 
  AND password_hash = crypt(old_password, password_hash);
  
  IF admin_record IS NULL THEN
    RETURN QUERY SELECT false, 'Current password is incorrect'::text;
    RETURN;
  END IF;
  
  -- Update to new password
  UPDATE public.club_admins 
  SET password_hash = crypt(new_password, gen_salt('bf'))
  WHERE club_id = admin_club_id;
  
  RETURN QUERY SELECT true, 'Password changed successfully'::text;
END;
$$;

-- Function to change mentor password
CREATE OR REPLACE FUNCTION public.change_mentor_password(
  mentor_email_param text,
  old_password text,
  new_password text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mentor_record RECORD;
BEGIN
  -- Verify old password (mentors use plain password)
  SELECT id INTO mentor_record 
  FROM public.mentors 
  WHERE email = mentor_email_param 
  AND password = old_password;
  
  IF mentor_record IS NULL THEN
    RETURN QUERY SELECT false, 'Current password is incorrect'::text;
    RETURN;
  END IF;
  
  -- Update to new password
  UPDATE public.mentors 
  SET password = new_password
  WHERE email = mentor_email_param;
  
  RETURN QUERY SELECT true, 'Password changed successfully'::text;
END;
$$;