-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

-- Create storage policies for event images
CREATE POLICY "Anyone can view event images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Club admins can upload event images" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

CREATE POLICY "Club admins can update event images" ON storage.objects 
FOR UPDATE USING (
    bucket_id = 'event-images' AND
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);

CREATE POLICY "Club admins can delete event images" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'event-images' AND
    EXISTS (
        SELECT 1 FROM public.club_admin_sessions cas
        JOIN public.club_admins ca ON cas.admin_id = ca.id
        WHERE cas.token = current_setting('request.headers')::json->>'authorization'
        AND cas.expires_at > now()
    )
);