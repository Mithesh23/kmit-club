-- Schedule yearly student promotion to run on May 1st at 00:00 UTC
-- This promotes: 1st Year → 2nd Year → 3rd Year → 4th Year → Pass Out
SELECT cron.schedule(
  'yearly-student-promotion',
  '0 0 1 5 *',
  $$SELECT public.promote_students_yearly()$$
);