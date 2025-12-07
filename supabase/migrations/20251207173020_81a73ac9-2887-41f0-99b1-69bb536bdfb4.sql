-- Update get_current_mentor_session to also check custom header
CREATE OR REPLACE FUNCTION public.get_current_mentor_session()
 RETURNS TABLE(mentor_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    auth_header text;
    custom_header text;
    token_value text;
BEGIN
    -- First try custom header (for REST API calls)
    custom_header := current_setting('request.headers', true)::json->>'x-mentor-token';
    
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
    SELECT ms.mentor_id
    FROM mentor_sessions ms
    WHERE ms.token = token_value 
    AND ms.expires_at > now();
END;
$function$;