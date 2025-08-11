-- Update the trigger function to use the new default password for new clubs
CREATE OR REPLACE FUNCTION public.create_default_admin_for_club()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert default admin credentials for the new club with new default password
    INSERT INTO public.club_admins (club_id, email, password_hash)
    VALUES (
        NEW.id, 
        LOWER(REPLACE(NEW.name, ' ', '')) || '@admin.com',
        crypt('Kmit123$', gen_salt('bf'))
    );
    
    RETURN NEW;
END;
$function$;