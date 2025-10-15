-- Add new columns to club_registrations table for additional student information
ALTER TABLE public.club_registrations
ADD COLUMN roll_number text,
ADD COLUMN year text,
ADD COLUMN branch text,
ADD COLUMN why_join text,
ADD COLUMN past_experience text;