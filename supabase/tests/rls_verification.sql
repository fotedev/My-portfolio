-- rls_verification.sql — SQL proof that the RLS model works (CONTENT-MODEL §8.4).
-- Run against the remote DB (psql or MCP execute_sql). Read-only + rolled back:
-- fixtures are created inside ONE transaction and discarded, leaving no trace.
--
-- Output: one result set with a row per check (check_no, name, pass, detail).
-- Any pass = false row means: fix the migration and re-run the WHOLE suite.
--
-- Sessions simulated via SET LOCAL ROLE + JWT claim settings:
--   anon          → public visitor
--   authenticated → signed-in user (admin or non-admin via request.jwt claims)
--   service_role  → Edge Function (bypasses RLS)

begin;

create temp table rls_results (
  check_no integer,
  name     text,
  pass     boolean,
  detail   text
);
-- the temp table is owned by the connecting role; allow all simulated roles to record results
grant select, insert, update on rls_results to anon, authenticated, service_role;

-- ============================================================================
-- Fixtures (service role bypasses RLS)
-- ============================================================================
set local role service_role;

-- admin allowlist fixture
insert into public.admin_users (user_id, note)
values ('11111111-1111-1111-1111-111111111111', 'rls-verification fixture')
on conflict (user_id) do nothing;

-- published project (gate-safe flow: draft base → translations → publish)
insert into public.projects (id, slug, status)
values ('22222222-2222-2222-2222-222222222222', 'rls-test-published', 'draft')
on conflict (slug) do nothing;
insert into public.project_translations (project_id, locale, title, summary, problem, solution)
values
  ('22222222-2222-2222-2222-222222222222', 'en', 'RLS Test Published', 's', 'p', 'sol'),
  ('22222222-2222-2222-2222-222222222222', 'ar', 'RLS Test Published', 's', 'p', 'sol')
on conflict (project_id, locale) do nothing;
update public.projects set status = 'published' where id = '22222222-2222-2222-2222-222222222222';

-- draft project (EN translation only — must never leak)
insert into public.projects (id, slug, status)
values ('33333333-3333-3333-3333-333333333333', 'rls-test-draft', 'draft')
on conflict (slug) do nothing;
insert into public.project_translations (project_id, locale, title, summary, problem, solution)
values ('33333333-3333-3333-3333-333333333333', 'en', 'RLS Test Draft', 's', 'p', 'sol')
on conflict (project_id, locale) do nothing;

-- site settings fixture row (if seed not yet applied, create minimal one)
insert into public.site_settings (id, contact_email)
values (1, 'fote.engineer@gmail.com')
on conflict (id) do nothing;

-- one inquiry fixture (service-role insert is the ONLY allowed insert path)
insert into public.inquiries (name, email, message, ip_hash)
values ('RLS Test', 'rls-test@example.com', 'fixture inquiry for verification', repeat('a', 64));

-- service role CAN insert inquiries (the M4 Edge Function path)
do $$
begin
  insert into rls_results (check_no, name, pass, detail)
  values (1, 'service_role can insert into inquiries', true, 'insert succeeded');
exception when others then
  insert into rls_results (check_no, name, pass, detail)
  values (1, 'service_role can insert into inquiries', false, SQLERRM);
end $$;

-- rate-limit function: 3 allowed then blocked (limits: window 600s, max 3)
do $$
declare
  r1 boolean; r2 boolean; r3 boolean; r4 boolean; r_other boolean; r_reset boolean;
begin
  -- calls 1–3 of 3 allowed: the perform is #1, r1 is #2, r2 is #3
  perform public.check_and_increment_rate_limit('test:net:fixture', 600, 3);
  r1 := public.check_and_increment_rate_limit('test:net:fixture', 600, 3); -- call 2 → allowed
  r2 := public.check_and_increment_rate_limit('test:net:fixture', 600, 3); -- call 3 → allowed (at limit)
  r3 := public.check_and_increment_rate_limit('test:net:fixture', 600, 3); -- call 4 → blocked
  r4 := public.check_and_increment_rate_limit('test:net:fixture', 600, 3); -- call 5 → blocked
  r_other := public.check_and_increment_rate_limit('test:other:fixture', 600, 3); -- independent key
  delete from public.rate_limit_counters where key = 'test:net:fixture';  -- simulate window reset
  r_reset := public.check_and_increment_rate_limit('test:net:fixture', 600, 3);
  if r1 and r2 and (not r3) and (not r4) and r_other and r_reset then
    insert into rls_results (check_no, name, pass, detail)
    values (2, 'rate limit allows up to limit then blocks; keys independent; window reset works',
            true, format('seq=%s,%s,%s,over=%s other=%s reset=%s', r1, r2, r3, r4, r_other, r_reset));
  else
    insert into rls_results (check_no, name, pass, detail)
    values (2, 'rate limit allows up to limit then blocks; keys independent; window reset works',
            false, format('seq=%s,%s,%s,over=%s other=%s reset=%s', r1, r2, r3, r4, r_other, r_reset));
  end if;
exception when others then
  insert into rls_results (check_no, name, pass, detail)
  values (2, 'rate limit function behavior', false, SQLERRM);
end $$;

-- bad input fails closed (Rule R12)
do $$
declare r boolean;
begin
  r := public.check_and_increment_rate_limit(null, 600, 3)
    or public.check_and_increment_rate_limit('test:bad', 0, 3)
    or public.check_and_increment_rate_limit('test:bad', 600, -1);
  insert into rls_results (check_no, name, pass, detail)
  values (3, 'rate limit function fails closed on bad input', not coalesce(r, true), format('result=%s', r));
exception when others then
  insert into rls_results (check_no, name, pass, detail)
  values (3, 'rate limit function fails closed on bad input', false, SQLERRM);
end $$;

-- ============================================================================
-- ANON session — public visitor
-- ============================================================================
set local role anon;

do $$
declare n integer;
begin
  select count(*) into n from public.projects where slug = 'rls-test-published';
  insert into rls_results (check_no, name, pass, detail)
  values (4, 'anon SELECT published project → 1 row', n = 1, format('rows=%s', n));
end $$;

do $$
declare n integer;
begin
  select count(*) into n from public.projects where slug = 'rls-test-draft';
  insert into rls_results (check_no, name, pass, detail)
  values (5, 'anon SELECT draft project → 0 rows', n = 0, format('rows=%s', n));
end $$;

do $$
declare n integer;
begin
  select count(*) into n from public.project_translations
  where project_id = '33333333-3333-3333-3333-333333333333'; -- draft's translations
  insert into rls_results (check_no, name, pass, detail)
  values (6, 'anon SELECT draft translations → 0 rows (inherit base status)', n = 0, format('rows=%s', n));
end $$;

do $$
declare n integer;
begin
  select count(*) into n from public.inquiries;
  insert into rls_results (check_no, name, pass, detail)
  values (7, 'anon SELECT inquiries → denied/empty', n = 0, format('rows=%s', n));
end $$;

-- anon INSERT into inquiries must be DENIED (locked decision)
do $$
begin
  begin
    insert into public.inquiries (name, email, message, ip_hash)
    values ('anon', 'anon@example.com', 'should not be possible', repeat('b', 64));
    insert into rls_results (check_no, name, pass, detail)
    values (8, 'anon INSERT into inquiries denied', false, 'insert unexpectedly succeeded');
  exception when insufficient_privilege or check_violation or others then
    insert into rls_results (check_no, name, pass, detail)
    values (8, 'anon INSERT into inquiries denied', true, 'rejected: ' || SQLERRM);
  end;
end $$;

-- counters are SQL-level revoked from anon (defense in depth) → expect permission denied OR empty
do $$
declare n integer := -1;
begin
  begin
    select count(*) into n from public.rate_limit_counters;
  exception when insufficient_privilege then
    n := -1; -- denied at SQL level
  end;
  insert into rls_results (check_no, name, pass, detail)
  values (9, 'anon SELECT rate_limit_counters → denied/empty', n = 0 or n = -1, format('rows=%s', n));
end $$;

-- admin_users is SQL-level revoked from anon (defense in depth) → same dual expectation
do $$
declare n integer := -1;
begin
  begin
    select count(*) into n from public.admin_users;
  exception when insufficient_privilege then
    n := -1; -- denied at SQL level
  end;
  insert into rls_results (check_no, name, pass, detail)
  values (10, 'anon SELECT admin_users → denied/empty', n = 0 or n = -1, format('rows=%s', n));
end $$;

do $$
declare r boolean;
begin
  begin
    r := public.check_and_increment_rate_limit('test:anon:probe', 600, 3);
    insert into rls_results (check_no, name, pass, detail)
    values (11, 'anon CANNOT execute rate-limit function', not coalesce(r, true), format('result=%s (must be null/denied)', r));
  exception when insufficient_privilege or others then
    insert into rls_results (check_no, name, pass, detail)
    values (11, 'anon CANNOT execute rate-limit function', true, 'rejected: ' || SQLERRM);
  end;
end $$;

-- anon slug_redirects read (used server-side for 301s) — policy exists; empty is fine
do $$
declare n integer;
begin
  select count(*) into n from public.slug_redirects;
  insert into rls_results (check_no, name, pass, detail)
  values (12, 'anon SELECT slug_redirects → allowed (empty ok)', n >= 0, format('rows=%s', n));
end $$;

-- ============================================================================
-- AUTHENTICATED, NON-ADMIN — default deny
-- ============================================================================
set local role authenticated;
set local request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';
set local request.jwt.claims = '{"role":"authenticated","sub":"99999999-9999-9999-9999-999999999999"}';

do $$
declare n integer; a boolean;
begin
  select count(*) into n from public.projects where slug = 'rls-test-draft';
  select public.is_admin() into a;
  insert into rls_results (check_no, name, pass, detail)
  values (13, 'authenticated non-admin: draft hidden + is_admin() false', n = 0 and a = false,
          format('rows=%s is_admin=%s', n, a));
end $$;

do $$
declare ok boolean;
begin
  begin
    insert into public.inquiries (name, email, message, ip_hash)
    values ('auth', 'auth@example.com', 'should be denied for non-admin', repeat('c', 64));
    insert into rls_results (check_no, name, pass, detail)
    values (14, 'authenticated non-admin INSERT inquiry denied', false, 'insert unexpectedly succeeded');
  exception when insufficient_privilege or others then
    insert into rls_results (check_no, name, pass, detail)
    values (14, 'authenticated non-admin INSERT inquiry denied', true, 'rejected: ' || SQLERRM);
  end;
end $$;

-- ============================================================================
-- AUTHENTICATED, ADMIN (allowlisted) — full content access, still no inquiry inserts
-- ============================================================================
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claims = '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}';

do $$
declare n integer; a boolean;
begin
  select count(*) into n from public.projects where slug = 'rls-test-draft';
  select public.is_admin() into a;
  insert into rls_results (check_no, name, pass, detail)
  values (15, 'allowlisted admin: draft visible + is_admin() true', n = 1 and a = true,
          format('rows=%s is_admin=%s', n, a));
end $$;

do $$
declare n integer;
begin
  select count(*) into n from public.inquiries;
  insert into rls_results (check_no, name, pass, detail)
  values (16, 'admin SELECT inquiries → sees fixture', n = 1, format('rows=%s', n));
end $$;

do $$
declare ok boolean;
begin
  begin
    insert into public.inquiries (name, email, message, ip_hash)
    values ('admin', 'admin@example.com', 'admin inserts are also denied by design', repeat('d', 64));
    insert into rls_results (check_no, name, pass, detail)
    values (17, 'admin INSERT inquiry denied (service-role-only path)', false, 'insert unexpectedly succeeded');
  exception when insufficient_privilege or others then
    insert into rls_results (check_no, name, pass, detail)
    values (17, 'admin INSERT inquiry denied (service-role-only path)', true, 'rejected: ' || SQLERRM);
  end;
end $$;

do $$
declare n integer;
begin
  update public.inquiries set status = 'read' where email = 'rls-test@example.com';
  get diagnostics n = row_count;
  insert into rls_results (check_no, name, pass, detail)
  values (18, 'admin UPDATE inquiry status transition works', n = 1, format('rows=%s', n));
end $$;

-- ============================================================================
-- Publish gate (Rule R3) — as admin
-- ============================================================================
do $$
declare ok boolean;
begin
  begin
    insert into public.projects (slug, status, en_only) values ('rls-test-gate', 'published', false);
    insert into rls_results (check_no, name, pass, detail)
    values (19, 'publish gate: publishing without AR translation or en_only rejected', false,
            'insert unexpectedly succeeded');
  exception when others then
    insert into rls_results (check_no, name, pass, detail)
    values (19, 'publish gate: publishing without AR translation or en_only rejected', true,
            'rejected: ' || SQLERRM);
  end;
end $$;

do $$
declare n integer;
begin
  insert into public.projects (slug, status, en_only) values ('rls-test-gate-en', 'published', true);
  select count(*) into n from public.projects where slug = 'rls-test-gate-en';
  insert into rls_results (check_no, name, pass, detail)
  values (20, 'publish gate: en_only = true bypasses the AR requirement', n = 1, format('rows=%s', n));
end $$;

-- ============================================================================
-- Result set (returned before ROLLBACK discards fixtures)
-- ============================================================================
select check_no, name, pass, detail from rls_results order by check_no;

rollback;
