-- Create mentor sessions table
CREATE TABLE IF NOT EXISTS public.mentor_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on mentor_sessions
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

-- Create function to authenticate mentor and create session
CREATE OR REPLACE FUNCTION public.authenticate_mentor(mentor_email text, mentor_password text)
RETURNS TABLE(success boolean, token text, mentor_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    mentor_record RECORD;
    session_token TEXT;
BEGIN
    -- Check if mentor exists and password matches
    SELECT m.id INTO mentor_record 
    FROM public.mentors m
    WHERE m.email = mentor_email AND m.password = mentor_password;
    
    IF mentor_record IS NULL THEN
        RETURN QUERY SELECT false, ''::TEXT, NULL::UUID, 'Invalid credentials'::TEXT;
        RETURN;
    END IF;
    
    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create session
    INSERT INTO public.mentor_sessions (mentor_id, token, expires_at)
    VALUES (mentor_record.id, session_token, now() + INTERVAL '24 hours');
    
    RETURN QUERY SELECT true, session_token, mentor_record.id, 'Login successful'::TEXT;
END;
$function$;

-- Create function to get current mentor session
CREATE OR REPLACE FUNCTION public.get_current_mentor_session()
RETURNS TABLE(mentor_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    auth_header text;
    token_value text;
BEGIN
    auth_header := current_setting('request.headers', true)::json->>'authorization';
    
    IF auth_header IS NULL OR auth_header = '' THEN
        RETURN;
    END IF;
    
    token_value := CASE 
        WHEN auth_header LIKE 'Bearer %' THEN substring(auth_header from 8)
        ELSE auth_header
    END;
    
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

-- Create function to check if current user is a mentor
CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM get_current_mentor_session()
    )
$$;

-- Add INSERT policy for clubs (mentors can create clubs)
CREATE POLICY "Mentors can create clubs"
ON public.clubs
FOR INSERT
WITH CHECK (public.is_mentor());

-- Add UPDATE policy for clubs (mentors can update any club)
CREATE POLICY "Mentors can update any club"
ON public.clubs
FOR UPDATE
USING (public.is_mentor());

-- RLS policy for mentor sessions
CREATE POLICY "Mentors can view their own sessions"
ON public.mentor_sessions
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM get_current_mentor_session() gms
    WHERE gms.mentor_id = mentor_sessions.mentor_id
));