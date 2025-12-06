-- Create function to promote students in May
CREATE OR REPLACE FUNCTION public.promote_students_yearly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update 4th year students to "Pass Out"
  UPDATE public.student_accounts
  SET year = 'Pass Out'
  WHERE year = '4th Year';
  
  UPDATE public.club_registrations
  SET year = 'Pass Out'
  WHERE year = '4th Year';

  -- Promote 3rd year to 4th year
  UPDATE public.student_accounts
  SET year = '4th Year'
  WHERE year = '3rd Year';
  
  UPDATE public.club_registrations
  SET year = '4th Year'
  WHERE year = '3rd Year';

  -- Promote 2nd year to 3rd year
  UPDATE public.student_accounts
  SET year = '3rd Year'
  WHERE year = '2nd Year';
  
  UPDATE public.club_registrations
  SET year = '3rd Year'
  WHERE year = '2nd Year';

  -- Promote 1st year to 2nd year
  UPDATE public.student_accounts
  SET year = '2nd Year'
  WHERE year = '1st Year';
  
  UPDATE public.club_registrations
  SET year = '2nd Year'
  WHERE year = '1st Year';
END;
$$;

-- Add RLS policy to allow students to update their own account (email and phone only)
CREATE POLICY "Students can update their own profile"
ON public.student_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM get_current_student_session() gss(student_id, roll_number)
    WHERE gss.roll_number = student_accounts.roll_number
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM get_current_student_session() gss(student_id, roll_number)
    WHERE gss.roll_number = student_accounts.roll_number
  )
);