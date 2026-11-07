-- 0001_initial_schema.sql — fotedev.me portfolio backend
-- Implements docs/CONTENT-MODEL.md (the contract). English only.
-- RLS is enabled on EVERY table. Anonymous users get read-only access to
-- published content and nothing else. The single admin is allowlisted in
-- admin_users (ADR-0007) via the public.is_admin() security-definer helper.
-- Service role (used only by the M4 Edge Function) bypasses RLS.

-- ============================================================================
-- 0. Enums
-- ============================================================================
create type public.content_status    as enum ('draft', 'published');
create type public.availability      as enum ('available', 'unavailable');
create type public.contribution_status as enum ('merged', 'open', 'acknowledged');
create type public.contribution_kind as enum ('pr', 'issue');
create type public.inquiry_status    as enum ('unread', 'read', 'replied', 'archived');
create type public.media_kind        as enum ('image', 'document', 'other');

-- ============================================================================
-- 1. Shared helpers
-- ============================================================================

-- Maintains updated_at on every table that has the column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- 2. Admin allowlist (ADR-0007) — created BEFORE is_admin() (SQL bodies are
--    validated at creation time and reference this table)
-- ============================================================================
create table public.admin_users (
  user_id  uuid primary key,
  added_at timestamptz not null default now(),
  note     text
);
alter table public.admin_users enable row level security;
-- No policies on purpose: only the security-definer is_admin() and the
-- service role may read it. Revokes below are defense in depth.
revoke all on public.admin_users from anon;
revoke all on public.admin_users from authenticated;

-- Single-admin allowlist check (ADR-0007). SECURITY DEFINER so it can read
-- admin_users even though admin_users itself has no RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 3. Site settings (singleton) + translations
-- ============================================================================
create table public.site_settings (
  id                  smallint primary key default 1 check (id = 1),
  contact_email       text not null,
  availability_status availability not null default 'available',
  cv_url              text,
  socials             jsonb not null default '[]' check (jsonb_typeof(socials) = 'array'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create table public.site_settings_translations (
  site_settings_id  smallint not null references public.site_settings(id) on delete cascade,
  locale            text not null check (locale in ('en', 'ar')),
  hero_name         text not null,
  hero_role         text not null,
  hero_offer        text not null,
  availability_text text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (site_settings_id, locale)
);

-- ============================================================================
-- 4. Media assets (alt text DB-enforced — Rule R4)
-- ============================================================================
create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null,
  storage_path text not null,
  media_kind   media_kind not null default 'image',
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0),
  alt_en       text not null,
  alt_ar       text not null,
  is_private   boolean not null default false,
  uploaded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (bucket, storage_path)
);

-- ============================================================================
-- 5. Projects (case studies) + translations
-- ============================================================================
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status          content_status not null default 'draft',
  published_at    timestamptz,
  is_featured     boolean not null default false,
  sort_order      integer not null default 0,
  en_only         boolean not null default false,
  tech_stack      text[] not null default '{}',
  repo_url        text,
  live_url        text,
  cover_image_url text,
  cover_asset_id  uuid references public.media_assets(id) on delete set null,
  gallery         jsonb check (gallery is null or jsonb_typeof(gallery) = 'array'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (cover_image_url is null or cover_asset_id is not null)
);
create index projects_status_idx    on public.projects (status);
create index projects_sort_order_idx on public.projects (sort_order);

create table public.project_translations (
  project_id uuid not null references public.projects(id) on delete cascade,
  locale     text not null check (locale in ('en', 'ar')),
  title      text not null,
  summary    text not null,
  problem    text not null,
  solution   text not null,
  results    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, locale)
);

-- ============================================================================
-- 6. Services (exactly 3; key immutable — inquiries FK) + translations
-- ============================================================================
create table public.services (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon       text,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_sort_order_idx on public.services (sort_order);

create table public.service_translations (
  service_id   uuid not null references public.services(id) on delete cascade,
  locale       text not null check (locale in ('en', 'ar')),
  title        text not null,
  summary      text not null,
  deliverables text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (service_id, locale)
);

-- ============================================================================
-- 7. Credentials + translations
-- ============================================================================
create table public.credentials (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null default 'certificate' check (kind in ('certificate', 'award', 'program')),
  recipient_name   text not null,
  issued_at        date,          -- TO VERIFY: not printed on the PDF — stays null until verified
  credential_id    text,          -- TO VERIFY: none printed on the PDF
  verification_url text,          -- TO VERIFY: QR target unresolved
  proof_url        text not null, -- external program page (dub.ai/omp), never presented as printed verification
  asset_media_id   uuid references public.media_assets(id) on delete set null,
  asset_url        text,
  sort_order       integer not null default 0,
  status           content_status not null default 'draft',
  published_at     timestamptz,
  en_only          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.credential_translations (
  credential_id  uuid not null references public.credentials(id) on delete cascade,
  locale         text not null check (locale in ('en', 'ar')),
  title          text not null,
  issuer_display text not null,  -- logo credits wording, never an "issued by" legal sentence
  summary        text not null,  -- fresh-written localized copy, never auto-translated PDF text
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (credential_id, locale)
);

-- ============================================================================
-- 8. Contributions (OSS + security) + translations
--    status semantic lock: merged | open | acknowledged — never "fixed".
--    Superseded PRs appear only via related_number, never as their own row.
-- ============================================================================
create table public.contributions (
  id                uuid primary key default gen_random_uuid(),
  repo              text not null,
  number            integer not null,
  kind              contribution_kind not null,
  status            contribution_status not null,
  your_role         text not null,
  related_number    integer,
  event_date        date,           -- merge date / vendor-ack date; null while open
  verification_date date not null,
  proof_url         text not null,
  sort_order        integer not null default 0,
  is_published      boolean not null default false, -- publish gate (status column carries the claim status)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (repo, number)
);
create index contributions_status_idx           on public.contributions (status);
create index contributions_verification_date_idx on public.contributions (verification_date);

create table public.contribution_translations (
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  locale          text not null check (locale in ('en', 'ar')),
  title           text not null,  -- verbatim GitHub title
  summary         text not null,  -- localized one-liner; merged row carries the salvage lineage
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (contribution_id, locale)
);

-- ============================================================================
-- 9. Slug redirects (Rule R6 — 301 map after published-slug changes)
-- ============================================================================
create table public.slug_redirects (
  from_slug  text primary key check (from_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  to_slug    text not null check (to_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 10. Posts (DEFERRED — schema only, zero seed, zero UI, no anon policies)
-- ============================================================================
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status       content_status not null default 'draft',
  published_at timestamptz,
  en_only      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.posts_translations (
  post_id    uuid not null references public.posts(id) on delete cascade,
  locale     text not null check (locale in ('en', 'ar')),
  title      text not null,
  excerpt    text,
  body       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, locale)
);

-- ============================================================================
-- 11. Inquiries (service-role writes only; anon has NO policies)
-- ============================================================================
create table public.inquiries (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 200),
  email            text not null
                     check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and char_length(email) <= 254),
  service_interest text references public.services(key) on delete set null,
  message          text not null check (char_length(message) between 1 and 5000),
  budget           text check (budget is null or char_length(budget) <= 200),
  timeline         text check (timeline is null or char_length(timeline) <= 200),
  ip_hash          text not null check (char_length(ip_hash) = 64), -- salted SHA-256; raw IPs never stored
  submission_token text unique,   -- client idempotency token (M4 dedupe)
  status           inquiry_status not null default 'unread',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index inquiries_created_at_idx on public.inquiries (created_at desc);
create index inquiries_status_idx     on public.inquiries (status);
-- Defense in depth: no SQL-level insert for anon either (RLS already denies).
revoke insert on public.inquiries from anon;

-- ============================================================================
-- 12. Rate-limit counters (persistent fixed windows; service role only)
-- ============================================================================
create table public.rate_limit_counters (
  key          text not null,   -- 'net:<ip_hash>' | 'email:<lowercased email>' | 'global:daily'
  window_start timestamptz not null,
  count        integer not null default 0 check (count between 0 and 100000),
  primary key (key, window_start)
);
revoke all on public.rate_limit_counters from anon;
revoke all on public.rate_limit_counters from authenticated;

-- Atomic fixed-window limiter. SECURITY DEFINER, locked search_path.
-- Returns true = allowed (counter incremented), false = rejected (fail closed — Rule R12).
create or replace function public.check_and_increment_rate_limit(
  p_key            text,
  p_window_seconds integer,
  p_max            integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count        integer;
begin
  -- Bad input fails closed.
  if p_key is null or p_window_seconds is null or p_max is null
     or p_window_seconds <= 0 or p_max <= 0 or char_length(p_key) = 0 or char_length(p_key) > 300 then
    return false;
  end if;

  -- Deterministic fixed-window boundary (all concurrent callers compute the same value).
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  -- Opportunistic purge of stale windows keeps the table tiny (cheap at this volume).
  delete from public.rate_limit_counters where window_start < now() - make_interval(days => 2);

  -- Single atomic statement: insert-or-increment. RETURNING gives the post-write count.
  insert into public.rate_limit_counters as rlc (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start) do update set count = rlc.count + 1
  returning count into v_count;

  return v_count <= p_max;
exception
  when others then
    -- Counter corruption or unexpected failure => reject, never allow (Rule R12).
    return false;
end;
$$;

revoke execute on function public.check_and_increment_rate_limit(text, integer, integer) from public;
revoke execute on function public.check_and_increment_rate_limit(text, integer, integer) from anon;
revoke execute on function public.check_and_increment_rate_limit(text, integer, integer) from authenticated;
grant  execute on function public.check_and_increment_rate_limit(text, integer, integer) to service_role;

-- ============================================================================
-- 13. Housekeeping: schema_migrations
-- ============================================================================
create table public.schema_migrations (
  version    text primary key,
  name       text not null,
  applied_at timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;
create policy "schema_migrations_admin_read" on public.schema_migrations
  for select to authenticated using (public.is_admin());
insert into public.schema_migrations (version, name) values ('0001', 'initial_schema')
on conflict (version) do nothing;

-- ============================================================================
-- 14. Triggers: updated_at everywhere
-- ============================================================================
create trigger trg_site_settings_updated_at            before update on public.site_settings             for each row execute function public.set_updated_at();
create trigger trg_site_settings_tr_updated_at         before update on public.site_settings_translations for each row execute function public.set_updated_at();
create trigger trg_media_assets_updated_at             before update on public.media_assets              for each row execute function public.set_updated_at();
create trigger trg_projects_updated_at                 before update on public.projects                  for each row execute function public.set_updated_at();
create trigger trg_project_translations_updated_at     before update on public.project_translations      for each row execute function public.set_updated_at();
create trigger trg_services_updated_at                 before update on public.services                  for each row execute function public.set_updated_at();
create trigger trg_service_translations_updated_at     before update on public.service_translations      for each row execute function public.set_updated_at();
create trigger trg_credentials_updated_at              before update on public.credentials               for each row execute function public.set_updated_at();
create trigger trg_credential_translations_updated_at  before update on public.credential_translations   for each row execute function public.set_updated_at();
create trigger trg_contributions_updated_at            before update on public.contributions             for each row execute function public.set_updated_at();
create trigger trg_contribution_translations_updated_at before update on public.contribution_translations for each row execute function public.set_updated_at();
create trigger trg_posts_updated_at                    before update on public.posts                     for each row execute function public.set_updated_at();
create trigger trg_posts_tr_updated_at                 before update on public.posts_translations        for each row execute function public.set_updated_at();
create trigger trg_inquiries_updated_at                before update on public.inquiries                 for each row execute function public.set_updated_at();

-- ============================================================================
-- 15. Triggers: published_at set once on first publish, never reset (Rule R9)
-- ============================================================================
create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at := coalesce(new.published_at, now());
    elsif old.published_at is null then
      new.published_at := now();
    else
      new.published_at := old.published_at; -- survives unpublish/republish
    end if;
  else
    if tg_op = 'UPDATE' then
      new.published_at := old.published_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_projects_published_at    before insert or update on public.projects    for each row execute function public.set_published_at();
create trigger trg_credentials_published_at before insert or update on public.credentials for each row execute function public.set_published_at();
create trigger trg_posts_published_at       before insert or update on public.posts       for each row execute function public.set_published_at();

-- ============================================================================
-- 16. Publish gate (Rule R3): publishing requires an AR translation OR en_only
-- ============================================================================
create or replace function public.enforce_publish_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_has_ar boolean;
  -- translation-table names are not uniformly "<base>_translations":
  -- projects → project_translations, credentials → credential_translations, posts → posts_translations
  v_translations_table text := case tg_table_name
    when 'projects'    then 'project_translations'
    when 'credentials' then 'credential_translations'
    when 'posts'       then 'posts_translations'
    else tg_table_name || '_translations'
  end;
  v_fk_column          text := regexp_replace(tg_table_name, 's$', '') || '_id';
begin
  if new.status <> 'published' then
    return new;
  end if;
  if new.en_only then
    return new;
  end if;
  execute format(
    'select exists (select 1 from public.%I t where t.%I = $1 and t.locale = ''ar'')',
    v_translations_table, v_fk_column
  ) into v_has_ar using new.id;
  if not v_has_ar then
    raise exception 'R3 publish gate: cannot publish % without an AR translation (insert translations first, then publish via UPDATE; or set en_only = true)', tg_table_name;
  end if;
  return new;
end;
$$;

create trigger trg_projects_publish_gate    before insert or update on public.projects    for each row execute function public.enforce_publish_gate();
create trigger trg_credentials_publish_gate before insert or update on public.credentials for each row execute function public.enforce_publish_gate();
create trigger trg_posts_publish_gate       before insert or update on public.posts       for each row execute function public.enforce_publish_gate();

-- ============================================================================
-- 17. Row Level Security — enabled on every table
-- ============================================================================
alter table public.site_settings                 enable row level security;
alter table public.site_settings_translations    enable row level security;
alter table public.media_assets                  enable row level security;
alter table public.projects                      enable row level security;
alter table public.project_translations          enable row level security;
alter table public.services                      enable row level security;
alter table public.service_translations          enable row level security;
alter table public.credentials                   enable row level security;
alter table public.credential_translations       enable row level security;
alter table public.contributions                 enable row level security;
alter table public.contribution_translations     enable row level security;
alter table public.slug_redirects                enable row level security;
alter table public.posts                         enable row level security;
alter table public.posts_translations            enable row level security;
alter table public.inquiries                     enable row level security;
alter table public.rate_limit_counters           enable row level security;

-- ---- site_settings: anon reads the singleton; admin full ----
create policy "settings_anon_read" on public.site_settings
  for select to anon using (true);
create policy "settings_admin_all" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings_tr_anon_read" on public.site_settings_translations
  for select to anon using (true);
create policy "settings_tr_admin_all" on public.site_settings_translations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- projects: anon reads published only; translations inherit base status ----
create policy "projects_anon_read" on public.projects
  for select to anon using (status = 'published');
create policy "projects_admin_all" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "project_tr_anon_read" on public.project_translations
  for select to anon using (
    exists (select 1 from public.projects p where p.id = project_translations.project_id and p.status = 'published')
  );
create policy "project_tr_admin_all" on public.project_translations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- services: anon reads active only (publish gate = is_active) ----
create policy "services_anon_read" on public.services
  for select to anon using (is_active = true);
create policy "services_admin_all" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "service_tr_anon_read" on public.service_translations
  for select to anon using (
    exists (select 1 from public.services s where s.id = service_translations.service_id and s.is_active = true)
  );
create policy "service_tr_admin_all" on public.service_translations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- credentials: anon reads published only ----
create policy "credentials_anon_read" on public.credentials
  for select to anon using (status = 'published');
create policy "credentials_admin_all" on public.credentials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "credential_tr_anon_read" on public.credential_translations
  for select to anon using (
    -- qualified: credentials also has a text column named credential_id — never rely on unqualified scope
    exists (select 1 from public.credentials c where c.id = credential_translations.credential_id and c.status = 'published')
  );
create policy "credential_tr_admin_all" on public.credential_translations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- contributions: anon reads is_published rows only ----
create policy "contributions_anon_read" on public.contributions
  for select to anon using (is_published = true);
create policy "contributions_admin_all" on public.contributions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "contribution_tr_anon_read" on public.contribution_translations
  for select to anon using (
    exists (select 1 from public.contributions c where c.id = contribution_translations.contribution_id and c.is_published = true)
  );
create policy "contribution_tr_admin_all" on public.contribution_translations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- media_assets: anon reads public rows only ----
create policy "media_anon_read" on public.media_assets
  for select to anon using (is_private = false);
create policy "media_admin_all" on public.media_assets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- slug_redirects: anon reads (server-side 301 resolution); admin full ----
create policy "redirects_anon_read" on public.slug_redirects
  for select to anon using (true);
create policy "redirects_admin_all" on public.slug_redirects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- posts (deferred): NO anon policies; admin full ----
create policy "posts_admin_all" on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "posts_tr_admin_all" on public.posts_translations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- inquiries: NO anon policies (insert + select denied); admin select/update ----
create policy "inquiries_admin_select" on public.inquiries
  for select to authenticated using (public.is_admin());
create policy "inquiries_admin_update" on public.inquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- rate_limit_counters, admin_users: NO policies (service role + definer only) ----

-- ============================================================================
-- 18. Storage: public-assets bucket + policies
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-assets', 'public-assets', true, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'application/pdf']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read of objects in the bucket.
create policy "public_assets_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'public-assets');

-- Admin-only writes in the bucket.
create policy "public_assets_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'public-assets' and public.is_admin())
  with check (bucket_id = 'public-assets' and public.is_admin());

-- NOTE: bucket-level file_size_limit (10 MB) + MIME whitelist above are the
-- coarse gates. Content-based validation (magic bytes) for uploads and
-- serving headers (X-Content-Type-Options: nosniff; PDFs as attachment)
-- are enforced at the upload path (M4/M5) and checked in the dashboard.
-- Executables/HTML are never served inline.
