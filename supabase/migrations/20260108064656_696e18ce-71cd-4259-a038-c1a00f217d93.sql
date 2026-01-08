-- Add year-wise registration toggle columns to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS registration_1st_year BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS registration_2nd_year BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS registration_3rd_year BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS registration_4th_year BOOLEAN NOT NULL DEFAULT true;