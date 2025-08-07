-- Update all existing club admin passwords and add missing credentials
-- Update existing club admin passwords with standardized credentials

-- Update Aalap Club credentials
UPDATE club_admins 
SET password_hash = crypt('aalap123', gen_salt('bf'))
WHERE email = 'musicclub@kmit.ac.in';

-- Update Abhinaya The Drama Club credentials  
UPDATE club_admins 
SET password_hash = crypt('drama123', gen_salt('bf'))
WHERE email = 'dramaclub@kmit.ac.in';

-- Update Mudra Club credentials
UPDATE club_admins 
SET password_hash = crypt('mudra123', gen_salt('bf'))
WHERE email = 'roboticsclub@kmit.ac.in';

-- Update Public Relations credentials
UPDATE club_admins 
SET password_hash = crypt('pr123', gen_salt('bf'))
WHERE email = 'publicrelationclub@kmit.ac.in';

-- Update Recurse Club credentials
UPDATE club_admins 
SET password_hash = crypt('recurse123', gen_salt('bf'))
WHERE email = 'computerscienceclub@kmit.ac.in';

-- Update Trace of Lense credentials
UPDATE club_admins 
SET password_hash = crypt('photography123', gen_salt('bf'))
WHERE email = 'photographyclub@kmit.ac.in';

-- Add credentials for Organizing Commity (the club without admin credentials)
INSERT INTO club_admins (club_id, email, password_hash)
VALUES (
    '5bff16f6-e147-4ab6-b8ce-1d6cb1281602',
    'organizingcommity@kmit.ac.in',
    crypt('organizing123', gen_salt('bf'))
);