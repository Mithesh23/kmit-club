-- Create a function for mentors to insert clubs using their session token
CREATE OR REPLACE FUNCTION public.mentor_create_club(
  p_name text,
  p_short_description text DEFAULT NULL,
  p_registration_open boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentor_id uuid;
  v_new_club_id uuid;
BEGIN
  -- Check if the current request has a valid mentor session
  SELECT mentor_id INTO v_mentor_id
  FROM get_current_mentor_session();
  
  IF v_mentor_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not logged in as a mentor';
  END IF;
  
  -- Insert the new club
  INSERT INTO clubs (name, short_description, is_active, registration_open)
  VALUES (p_name, p_short_description, true, p_registration_open)
  RETURNING id INTO v_new_club_id;
  
  RETURN v_new_club_id;
END;
$$;

-- Create a function for mentors to update club status
CREATE OR REPLACE FUNCTION public.mentor_update_club_status(
  p_club_id uuid,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentor_id uuid;
BEGIN
  -- Check if the current request has a valid mentor session
  SELECT mentor_id INTO v_mentor_id
  FROM get_current_mentor_session();
  
  IF v_mentor_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not logged in as a mentor';
  END IF;
  
  -- Update the club status
  UPDATE clubs
  SET is_active = p_is_active, updated_at = now()
  WHERE id = p_club_id;
  
  RETURN true;
END;
$$;