-- Update report type enum to include MOM
ALTER TYPE report_type RENAME TO report_type_old;
CREATE TYPE report_type AS ENUM ('mom', 'event', 'monthly', 'yearly');

-- Update the club_reports table
ALTER TABLE public.club_reports 
  ALTER COLUMN report_type TYPE report_type USING report_type::text::report_type;

DROP TYPE report_type_old;

-- Add new columns for common fields
ALTER TABLE public.club_reports
  ADD COLUMN report_date date,
  ADD COLUMN participants_roll_numbers text[],
  ADD COLUMN report_data jsonb,
  ALTER COLUMN file_url DROP NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_club_reports_date ON public.club_reports(report_date);
CREATE INDEX idx_club_reports_type ON public.club_reports(report_type);