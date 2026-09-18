-- Run this once in the Supabase SQL Editor after removing Google Calendar sync.
-- It deletes only Calendar connection tokens, event mappings, and unused task
-- mapping columns. It does not delete tasks, users, or garden progress.

begin;

drop table if exists public.google_calendar_mappings;
drop table if exists public.google_calendar_connections;

alter table public.tasks drop column if exists google_event_id;
alter table public.tasks drop column if exists google_calendar_id;

commit;
