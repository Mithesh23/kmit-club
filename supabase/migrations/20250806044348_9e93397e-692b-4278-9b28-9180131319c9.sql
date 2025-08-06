-- Fix RLS policies to properly authenticate club admins using session tokens
-- The issue is that the current policies are trying to extract token from wrong header format

-- First, let's create a helper function to get the current admin session
CREATE OR REPLACE FUNCTION public.get_current_admin_session()
RETURNS TABLE(admin_id uuid, club_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    auth_header text;
    token_value text;
BEGIN
    -- Get the authorization header
    auth_header := current_setting('request.headers', true)::json->>'authorization';
    
    -- Extract token (remove 'Bearer ' prefix if present)
    IF auth_header IS NULL THEN
        RETURN;
    END IF;
    
    token_value := CASE 
        WHEN auth_header LIKE 'Bearer %' THEN substring(auth_header from 8)
        ELSE auth_header
    END;
    
    -- Return admin session info
    RETURN QUERY
    SELECT cas.admin_id, ca.club_id
    FROM club_admin_sessions cas
    JOIN club_admins ca ON cas.admin_id = ca.id
    WHERE cas.token = token_value 
    AND cas.expires_at > now();
END;
$$;

-- Update clubs table RLS policy
DROP POLICY IF EXISTS "Club admins can update their own club" ON clubs;
CREATE POLICY "Club admins can update their own club" ON clubs
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() 
        WHERE club_id = clubs.id
    )
);

-- Update announcements table RLS policy  
DROP POLICY IF EXISTS "Club admins can manage their announcements" ON announcements;
CREATE POLICY "Club admins can manage their announcements" ON announcements
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() 
        WHERE club_id = announcements.club_id
    )
);

-- Update club_members table RLS policy
DROP POLICY IF EXISTS "Club admins can manage their club members" ON club_members;
CREATE POLICY "Club admins can manage their club members" ON club_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() 
        WHERE club_id = club_members.club_id
    )
);

-- Update events table RLS policy
DROP POLICY IF EXISTS "Club admins can manage their events" ON events;
CREATE POLICY "Club admins can manage their events" ON events
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() 
        WHERE club_id = events.club_id
    )
);

-- Update event_images table RLS policy
DROP POLICY IF EXISTS "Club admins can manage event images" ON event_images;
CREATE POLICY "Club admins can manage event images" ON event_images
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() gas
        JOIN events e ON e.club_id = gas.club_id
        WHERE e.id = event_images.event_id
    )
);

-- Update club_admin_sessions table RLS policy
DROP POLICY IF EXISTS "Club admins can view their own sessions" ON club_admin_sessions;
CREATE POLICY "Club admins can view their own sessions" ON club_admin_sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() 
        WHERE admin_id = club_admin_sessions.admin_id
    )
);

-- Update club_admins table RLS policy
DROP POLICY IF EXISTS "Club admins can view their own data" ON club_admins;
CREATE POLICY "Club admins can view their own data" ON club_admins
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() 
        WHERE admin_id = club_admins.id
    )
);

-- Update club_registrations table RLS policy
DROP POLICY IF EXISTS "Club admins can view their registrations" ON club_registrations;
CREATE POLICY "Club admins can view their registrations" ON club_registrations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM get_current_admin_session() 
        WHERE club_id = club_registrations.club_id
    )
);