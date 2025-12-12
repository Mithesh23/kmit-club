-- Create function to get all student credentials (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_all_student_credentials()
RETURNS TABLE(
  id uuid,
  roll_number text,
  student_email text,
  phone text,
  year text,
  branch text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.roll_number,
    sa.student_email,
    sa.phone,
    sa.year,
    sa.branch
  FROM public.student_accounts sa
  ORDER BY sa.roll_number;
END;
$$;

-- Create function to get all mentor credentials (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_all_mentor_credentials()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  password text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.email,
    m.password
  FROM public.mentors m
  ORDER BY m.name, m.email;
END;
$$;