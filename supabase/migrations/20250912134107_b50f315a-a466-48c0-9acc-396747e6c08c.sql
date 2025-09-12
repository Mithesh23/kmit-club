-- Fix security issue: Restrict club_registrations SELECT access to club admins only

-- Drop existing SELECT policy that may be too permissive
DROP POLICY IF EXISTS "Club admins can view their registrations" ON public.club_registrations;

-- Create a more restrictive SELECT policy that explicitly checks for valid admin session
CREATE POLICY "Only club admins can view their club registrations" 
ON public.club_registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM get_current_admin_session() gas
    WHERE gas.admin_id IS NOT NULL 
    AND gas.club_id = club_registrations.club_id
  )
);

-- Add explicit policy to deny public access to registrations
CREATE POLICY "Deny public access to registrations" 
ON public.club_registrations 
FOR SELECT 
TO anon 
USING (false);

-- Ensure the get_current_admin_session function properly validates sessions
CREATE OR REPLACE FUNCTION public.get_current_admin_session()
RETURNS TABLE(admin_id uuid, club_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    auth_header text;
    token_value text;
BEGIN
    -- Get the authorization header
    auth_header := current_setting('request.headers', true)::json->>'authorization';
    
    -- Return empty if no auth header
    IF auth_header IS NULL OR auth_header = '' THEN
        RETURN;
    END IF;
    
    -- Extract token (remove 'Bearer ' prefix if present)
    token_value := CASE 
        WHEN auth_header LIKE 'Bearer %' THEN substring(auth_header from 8)
        ELSE auth_header
    END;
    
    -- Return empty if no token
    IF token_value IS NULL OR token_value = '' THEN
        RETURN;
    END IF;
    
    -- Return admin session info only for valid, non-expired sessions
    RETURN QUERY
    SELECT cas.admin_id, ca.club_id
    FROM club_admin_sessions cas
    JOIN club_admins ca ON cas.admin_id = ca.id
    WHERE cas.token = token_value 
    AND cas.expires_at > now()
    AND cas.admin_id IS NOT NULL
    AND ca.club_id IS NOT NULL;
END;
$function$;