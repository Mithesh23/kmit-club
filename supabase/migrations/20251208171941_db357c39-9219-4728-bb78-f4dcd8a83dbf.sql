-- Add new social media columns to clubs table
ALTER TABLE public.clubs
ADD COLUMN whatsapp_url text,
ADD COLUMN website_url text;