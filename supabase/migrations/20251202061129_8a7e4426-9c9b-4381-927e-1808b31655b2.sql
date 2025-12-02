-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create demo student account
-- Username: 24BD5A6711, Password: Kmitclubs123
INSERT INTO public.student_accounts (roll_number, password_hash)
VALUES ('24BD5A6711', crypt('Kmitclubs123', gen_salt('bf')))
ON CONFLICT (roll_number) DO NOTHING;