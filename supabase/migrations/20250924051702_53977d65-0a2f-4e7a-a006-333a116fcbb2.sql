-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public) VALUES ('club-logos', 'club-logos', true);

-- Add logo_url column to clubs table
ALTER TABLE public.clubs ADD COLUMN logo_url TEXT;

-- Create storage policies for club logos
CREATE POLICY "Club logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'club-logos');

CREATE POLICY "Club admins can upload their own club logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'club-logos' AND 
  EXISTS (
    SELECT 1 
    FROM get_current_admin_session() gas
    WHERE gas.admin_id IS NOT NULL AND 
          gas.club_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Club admins can update their own club logo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'club-logos' AND 
  EXISTS (
    SELECT 1 
    FROM get_current_admin_session() gas
    WHERE gas.admin_id IS NOT NULL AND 
          gas.club_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Club admins can delete their own club logo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'club-logos' AND 
  EXISTS (
    SELECT 1 
    FROM get_current_admin_session() gas
    WHERE gas.admin_id IS NOT NULL AND 
          gas.club_id::text = (storage.foldername(name))[1]
  )
);