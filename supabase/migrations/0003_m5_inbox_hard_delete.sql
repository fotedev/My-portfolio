-- 0003_m5_inbox_hard_delete.sql — M5 (prompt-6 §3, inbox)
-- Delete-on-request flow: the owner hard-deletes a single inquiry after
-- explicit typed-name confirmation in the admin inbox. Until now inquiries
-- only had SELECT/UPDATE policies (M4); the delete path is admin-only and
-- never exposed to anon or non-admin authenticated users.

alter table public.inquiries enable row level security;

create policy "inquiries_admin_delete" on public.inquiries
  for delete to authenticated
  using (public.is_admin());

insert into public.schema_migrations (version, name)
values ('0003', 'm5_inbox_hard_delete')
on conflict (version) do nothing;
