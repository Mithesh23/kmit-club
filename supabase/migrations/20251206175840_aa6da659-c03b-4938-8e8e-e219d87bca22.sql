-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_club_registration_approved ON public.club_registrations;
DROP TRIGGER IF EXISTS club_registration_approved_trigger ON public.club_registrations;

-- Create or replace the function to handle student account creation with all fields
CREATE OR REPLACE FUNCTION public.create_student_account_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Only act when status becomes 'approved' and roll_number is present
  IF NEW.status = 'approved' AND NEW.roll_number IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Insert new account or update existing one with additional details
    INSERT INTO student_accounts (roll_number, password_hash, student_email, phone, year, branch)
    VALUES (
      NEW.roll_number, 
      crypt('Kmitclubs123', gen_salt('bf')),
      NEW.student_email,
      NEW.phone,
      NEW.year,
      NEW.branch
    )
    ON CONFLICT (roll_number) DO UPDATE
    SET
      student_email = COALESCE(EXCLUDED.student_email, student_accounts.student_email),
      phone = COALESCE(EXCLUDED.phone, student_accounts.phone),
      year = COALESCE(EXCLUDED.year, student_accounts.year),
      branch = COALESCE(EXCLUDED.branch, student_accounts.branch);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_club_registration_approved
  AFTER UPDATE ON public.club_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_account_on_approval();