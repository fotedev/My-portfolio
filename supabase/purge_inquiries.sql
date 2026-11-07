-- purge_inquiries.sql — 24-month inquiry retention (docs/OPERATIONS.md §8, prompt-5 §8)
-- Deletes inquiries older than 24 months plus their rate-limit counter keys
-- (net:<ip_hash> / email:<lowered email>) so stale windows don't linger.
--
-- Run monthly (OPERATIONS §5 item 8) via the Supabase SQL editor or the
-- Management API query endpoint, as the owner. Expected row count: 0 for years.
-- Record the deleted count in the monthly checklist line (RUN_LOG).

begin;

create temp table purge_keys on commit drop as
  select distinct 'net:' || ip_hash as key
  from public.inquiries
  where created_at < now() - interval '24 months'
  union
  select distinct 'email:' || lower(email) as key
  from public.inquiries
  where created_at < now() - interval '24 months';

delete from public.inquiries
where created_at < now() - interval '24 months';

delete from public.rate_limit_counters
where key in (select key from purge_keys);

-- Inspect the two delete counts in the client output, then commit happens
-- automatically at the end of the transaction.
commit;
