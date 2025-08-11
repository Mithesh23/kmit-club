-- Create a function to automatically create admin credentials for new clubs
CREATE OR REPLACE FUNCTION public.create_default_admin_for_club()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default admin credentials for the new club
    INSERT INTO public.club_admins (club_id, email, password_hash)
    VALUES (
        NEW.id, 
        LOWER(REPLACE(NEW.name, ' ', '')) || '@admin.com',
        crypt('admin123', gen_salt('bf'))
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create admin when club is created
DROP TRIGGER IF EXISTS create_club_admin_trigger ON public.clubs;
CREATE TRIGGER create_club_admin_trigger
    AFTER INSERT ON public.clubs
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_admin_for_club();

-- Create function to get all club passwords for admin purposes
CREATE OR REPLACE FUNCTION public.get_all_club_credentials()
RETURNS TABLE(
    club_name text,
    admin_email text,
    plain_password text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name as club_name,
        ca.email as admin_email,
        'admin123'::text as plain_password
    FROM public.clubs c
    JOIN public.club_admins ca ON c.id = ca.club_id
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing clubs without admins to have default credentials
INSERT INTO public.club_admins (club_id, email, password_hash)
SELECT 
    c.id,
    LOWER(REPLACE(c.name, ' ', '')) || '@admin.com',
    crypt('admin123', gen_salt('bf'))
FROM public.clubs c
LEFT JOIN public.club_admins ca ON c.id = ca.club_id
WHERE ca.id IS NULL;

-- Create function to update club admin password
CREATE OR REPLACE FUNCTION public.update_club_admin_password(
    club_admin_email text,
    new_password text
)
RETURNS TABLE(success boolean, message text) AS $$
BEGIN
    UPDATE public.club_admins 
    SET password_hash = crypt(new_password, gen_salt('bf'))
    WHERE email = club_admin_email;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Password updated successfully'::text;
    ELSE
        RETURN QUERY SELECT false, 'Admin not found'::text;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;