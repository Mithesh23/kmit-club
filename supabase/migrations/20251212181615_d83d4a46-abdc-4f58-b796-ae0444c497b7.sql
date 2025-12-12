-- Update get_current_student_session to read from custom header x-student-token first
CREATE OR REPLACE FUNCTION public.get_current_student_session()
RETURNS TABLE(student_id uuid, roll_number text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  custom_header text;
  auth_header text;
  token_value text;
BEGIN
  -- First try custom header (for REST API calls)
  custom_header := current_setting('request.headers', true)::json->>'x-student-token';
  
  -- If not found, try authorization header (for RPC calls)
  IF custom_header IS NULL OR custom_header = '' THEN
    auth_header := current_setting('request.headers', true)::json->>'authorization';
    
    IF auth_header IS NULL OR auth_header = '' THEN
      RETURN;
    END IF;
    
    token_value := CASE 
      WHEN auth_header LIKE 'Bearer %' THEN substring(auth_header from 8)
      ELSE auth_header
    END;
  ELSE
    token_value := custom_header;
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
$function$;