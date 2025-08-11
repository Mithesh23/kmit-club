-- First, let's create a function to validate admin sessions for storage
CREATE OR REPLACE FUNCTION public.is_admin_for_event_storage(event_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    admin_session record;
    event_club_id uuid;
    auth_header text;
    token_value text;
BEGIN
    -- Get the authorization header
    auth_header := current_setting('request.headers', true)::json->>'authorization';
    
    if auth_header IS NULL then
        return false;
    end if;
    
    -- Extract token (remove 'Bearer ' prefix if present)
    token_value := CASE 
        WHEN auth_header LIKE 'Bearer %' THEN substring(auth_header from 8)
        ELSE auth_header
    END;
    
    -- Check if this is a valid admin session token
    SELECT cas.admin_id, ca.club_id INTO admin_session
    FROM club_admin_sessions cas
    JOIN club_admins ca ON cas.admin_id = ca.id
    WHERE cas.token = token_value 
    AND cas.expires_at > now();
    
    IF admin_session.admin_id IS NULL THEN
        return false;
    END IF;
    
    -- Get the club_id for the event
    SELECT club_id INTO event_club_id
    FROM events
    WHERE id = event_id_param;
    
    -- Check if the admin belongs to the same club as the event
    return admin_session.club_id = event_club_id;
END;
$$;

-- Drop ALL existing storage policies for event-images bucket
DO $$
DECLARE
    policy_record record;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END;
$$;

-- Create storage policy for uploading event images
CREATE POLICY "Club admins can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'event-images' 
    AND public.is_admin_for_event_storage(
        (string_to_array(name, '/'))[1]::uuid
    )
);

-- Create storage policy for viewing event images  
CREATE POLICY "Anyone can view event images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

-- Create policy for updating event images
CREATE POLICY "Club admins can update event images" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'event-images' 
    AND public.is_admin_for_event_storage(
        (string_to_array(name, '/'))[1]::uuid
    )
);

-- Create policy for deleting event images
CREATE POLICY "Club admins can delete event images" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'event-images' 
    AND public.is_admin_for_event_storage(
        (string_to_array(name, '/'))[1]::uuid
    )
);