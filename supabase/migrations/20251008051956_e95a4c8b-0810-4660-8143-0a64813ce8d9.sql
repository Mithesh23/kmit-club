-- Storage RLS policies to allow club admins (custom token) to manage uploads
-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Admins can upload club logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update club logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete club logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;

-- Club Logos bucket: path format `${club_id}/logo.ext`
CREATE POLICY "Admins can upload club logos"
ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'club-logos'
  AND EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Admins can update club logos"
ON storage.objects
FOR UPDATE TO anon
USING (
  bucket_id = 'club-logos'
  AND EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'club-logos'
  AND EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Admins can delete club logos"
ON storage.objects
FOR DELETE TO anon
USING (
  bucket_id = 'club-logos'
  AND EXISTS (
    SELECT 1 FROM get_current_admin_session() gas(admin_id, club_id)
    WHERE gas.club_id::text = (storage.foldername(name))[1]
  )
);

-- Event Images bucket: path format `${event_id}/<timestamp>.<ext>`
CREATE POLICY "Admins can upload event images"
ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'event-images'
  AND is_admin_for_event_storage(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins can update event images"
ON storage.objects
FOR UPDATE TO anon
USING (
  bucket_id = 'event-images'
  AND is_admin_for_event_storage(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'event-images'
  AND is_admin_for_event_storage(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins can delete event images"
ON storage.objects
FOR DELETE TO anon
USING (
  bucket_id = 'event-images'
  AND is_admin_for_event_storage(((storage.foldername(name))[1])::uuid)
);