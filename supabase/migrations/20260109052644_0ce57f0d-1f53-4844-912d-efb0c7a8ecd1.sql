-- First, remove duplicate certificates keeping only the first issued one
DELETE FROM public.certificates
WHERE id NOT IN (
  SELECT DISTINCT ON (event_id, roll_number) id
  FROM public.certificates
  ORDER BY event_id, roll_number, issued_at ASC
);

-- Now add unique constraint to prevent future duplicates
ALTER TABLE public.certificates
ADD CONSTRAINT certificates_event_roll_unique UNIQUE (event_id, roll_number);