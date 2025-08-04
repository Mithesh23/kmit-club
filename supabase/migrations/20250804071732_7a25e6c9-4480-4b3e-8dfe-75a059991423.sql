-- Create tables for the club management system

-- Clubs table
CREATE TABLE public.clubs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    short_description TEXT,
    detailed_description TEXT,
    registration_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Club admins table for club-specific authentication
CREATE TABLE public.club_admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Club members table for roles like President, Secretary, etc.
CREATE TABLE public.club_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event images table
CREATE TABLE public.event_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student registrations table
CREATE TABLE public.club_registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(club_id, student_email)
);

-- Club admin sessions table for custom authentication
CREATE TABLE public.club_admin_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.club_admins(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Clubs: Public read access, admin write access
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);

CREATE POLICY "Club admins can update their own club" ON public.clubs 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE ca.club_id = clubs.id 
        AND cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

-- Club admins: Only admins can read their own data
CREATE POLICY "Club admins can view their own data" ON public.club_admins 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        WHERE cas.admin_id = club_admins.id 
        AND cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

-- Club members: Public read, admin write
CREATE POLICY "Anyone can view club members" ON public.club_members FOR SELECT USING (true);

CREATE POLICY "Club admins can manage their club members" ON public.club_members 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE ca.club_id = club_members.club_id 
        AND cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

-- Announcements: Public read, admin write
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);

CREATE POLICY "Club admins can manage their announcements" ON public.announcements 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE ca.club_id = announcements.club_id 
        AND cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

-- Events: Public read, admin write
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);

CREATE POLICY "Club admins can manage their events" ON public.events 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE ca.club_id = events.club_id 
        AND cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

-- Event images: Public read, admin write through events
CREATE POLICY "Anyone can view event images" ON public.event_images FOR SELECT USING (true);

CREATE POLICY "Club admins can manage event images" ON public.event_images 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        JOIN public.events e ON e.club_id = ca.club_id
        WHERE e.id = event_images.event_id 
        AND cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

-- Club registrations: Public insert, admin read
CREATE POLICY "Anyone can register for clubs" ON public.club_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Club admins can view their registrations" ON public.club_registrations 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE ca.club_id = club_registrations.club_id 
        AND cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

-- Club admin sessions: Admins can read their own sessions
CREATE POLICY "Club admins can view their own sessions" ON public.club_admin_sessions 
FOR SELECT USING (
    token = current_setting('request.headers')::json->>'authorization'
);

-- Functions for authentication
CREATE OR REPLACE FUNCTION public.authenticate_club_admin(admin_email TEXT, admin_password TEXT)
RETURNS TABLE(success BOOLEAN, token TEXT, club_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    session_token TEXT;
BEGIN
    -- Check if admin exists and password matches (in real app, use proper password hashing)
    SELECT id, club_id INTO admin_record 
    FROM public.club_admins 
    WHERE email = admin_email AND password_hash = crypt(admin_password, password_hash);
    
    IF admin_record IS NULL THEN
        RETURN QUERY SELECT false, ''::TEXT, NULL::UUID, 'Invalid credentials'::TEXT;
        RETURN;
    END IF;
    
    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create session
    INSERT INTO public.club_admin_sessions (admin_id, token, expires_at)
    VALUES (admin_record.id, session_token, now() + INTERVAL '24 hours');
    
    RETURN QUERY SELECT true, session_token, admin_record.club_id, 'Login successful'::TEXT;
END;
$$;

-- Function to create club admin (with password hashing)
CREATE OR REPLACE FUNCTION public.create_club_admin(club_id UUID, admin_email TEXT, admin_password TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.club_admins (club_id, email, password_hash)
    VALUES (club_id, admin_email, crypt(admin_password, gen_salt('bf')));
    
    RETURN QUERY SELECT true, 'Admin created successfully'::TEXT;
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT false, 'Email already exists'::TEXT;
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating admin'::TEXT;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for clubs table
CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON public.clubs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.clubs (name, short_description, detailed_description) VALUES
('Computer Science Club', 'Explore the world of programming and technology', 'The Computer Science Club is dedicated to fostering innovation and learning in the field of computer science. We organize coding competitions, tech talks, and workshops on latest technologies.'),
('Robotics Club', 'Build and program robots for competitions', 'Our Robotics Club brings together students passionate about robotics and automation. We participate in national competitions and work on innovative robotic solutions.'),
('Drama Club', 'Express creativity through theatrical performances', 'The Drama Club provides a platform for students to showcase their acting talents and explore the world of theater. We organize plays, skits, and cultural events.'),
('Music Club', 'Share your musical talents with the community', 'Join our Music Club to explore various musical genres, learn new instruments, and perform at college events. We welcome all skill levels.');

-- Create sample club admins
INSERT INTO public.club_admins (club_id, email, password_hash) 
SELECT c.id, LOWER(REPLACE(c.name, ' ', '')) || '@kmit.ac.in', crypt('admin123', gen_salt('bf'))
FROM public.clubs c;

-- Add sample club members
INSERT INTO public.club_members (club_id, name, role) 
SELECT c.id, 'Rahul Sharma', 'President' FROM public.clubs c WHERE c.name = 'Computer Science Club'
UNION ALL
SELECT c.id, 'Priya Patel', 'Secretary' FROM public.clubs c WHERE c.name = 'Computer Science Club'
UNION ALL
SELECT c.id, 'Arjun Kumar', 'President' FROM public.clubs c WHERE c.name = 'Robotics Club'
UNION ALL
SELECT c.id, 'Sneha Reddy', 'Vice President' FROM public.clubs c WHERE c.name = 'Robotics Club';

-- Add sample announcements
INSERT INTO public.announcements (club_id, title, content)
SELECT c.id, 'Welcome to New Session!', 'We are excited to announce the beginning of our new academic session. Join us for exciting activities and learning opportunities.' 
FROM public.clubs c WHERE c.name = 'Computer Science Club'
UNION ALL
SELECT c.id, 'Hackathon Coming Soon', 'Get ready for our annual hackathon! Registration opens next week. Prizes worth ₹50,000 to be won!'
FROM public.clubs c WHERE c.name = 'Computer Science Club';

-- Add sample events
INSERT INTO public.events (club_id, title, description)
SELECT c.id, 'Tech Talk: AI and Machine Learning', 'Join us for an insightful session on Artificial Intelligence and Machine Learning trends in 2024.'
FROM public.clubs c WHERE c.name = 'Computer Science Club'
UNION ALL
SELECT c.id, 'Robot Building Workshop', 'Hands-on workshop where you will learn to build and program your own robot from scratch.'
FROM public.clubs c WHERE c.name = 'Robotics Club';