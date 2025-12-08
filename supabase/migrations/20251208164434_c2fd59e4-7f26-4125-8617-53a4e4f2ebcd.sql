-- Add ticket_url column to kmit_events for ticket booking feature (NAVRAAS events)
ALTER TABLE public.kmit_events 
ADD COLUMN ticket_url text DEFAULT NULL;