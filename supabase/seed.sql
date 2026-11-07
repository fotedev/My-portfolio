-- seed.sql — verified data ONLY (source: docs/CONTENT-EVIDENCE.md, verified 2026-11-06)
-- Nothing here may be invented. TO VERIFY fields stay NULL and are omitted by the UI (Rule R7).
-- All content rows are seeded as draft/is_published-controlled; publishing happens at GATE 2 review.
-- Idempotent-ish: safe to re-run (ON CONFLICT / WHERE NOT EXISTS guards).

-- ============================================================================
-- 1. site_settings (singleton) — public contact + verbatim socials
-- ============================================================================
insert into public.site_settings (id, contact_email, availability_status, cv_url, socials)
values (
  1,
  'fote.engineer@gmail.com',          -- evidence: profile README "Connect" (mailto)
  'available',
  null,                                -- no verified CV exists — do not invent (Rule R7)
  '[
    {"platform": "github",   "url": "https://github.com/fotedev"},
    {"platform": "linkedin", "url": "https://www.linkedin.com/in/fotedev"},
    {"platform": "x",        "url": "https://x.com/FoteTeam"},
    {"platform": "telegram", "url": "https://t.me/ACYRO0016K"},
    {"platform": "youtube",  "url": "https://www.youtube.com/channel/UCmfp_B-hOFq4UW5g1T4LCvQ"},
    {"platform": "facebook", "url": "https://www.facebook.com/profile.php?id=61558539080140"},
    {"platform": "instagram","url": "https://www.instagram.com/devtech.team/"}
  ]'::jsonb
  -- NOTE: YouTube URL has the ?sub_confirmation=1 badge parameter stripped (evidence log).
)
on conflict (id) do update
  set contact_email = excluded.contact_email,
      availability_status = excluded.availability_status,
      cv_url = excluded.cv_url,
      socials = excluded.socials,
      updated_at = now();

-- hero_name: Arabic personal name NOT verified — Latin "Ahmed Aboalayoun" in both locales
-- until Ahmed supplies the Arabic (CONTENT-MODEL §11.1, GATE 2 open item).
-- hero_role / availability_text: SEED DRAFTS — replace at GATE 2 review.
-- hero_offer: locked initial copy (docs/PRODUCT.md §3).
insert into public.site_settings_translations
  (site_settings_id, locale, hero_name, hero_role, hero_offer, availability_text)
values
  (1, 'en',
   'Ahmed Aboalayoun',
   'Full-Stack AI Engineer',
   'Web applications and AI tools built around your business.',
   'Available for freelance projects'),
  (1, 'ar',
   'Ahmed Aboalayoun',
   'مهندس ذكاء اصطناعي متكامل',
   'تطبيقات ويب وأدوات ذكاء اصطناعي مبنية حول عملك.',
   'متاح لمشاريع العمل الحر')
on conflict (site_settings_id, locale) do update
  set hero_name = excluded.hero_name,
      hero_role = excluded.hero_role,
      hero_offer = excluded.hero_offer,
      availability_text = excluded.availability_text,
      updated_at = now();

-- ============================================================================
-- 2. services — exactly 3 (keys immutable; order fixed per docs/PRODUCT.md §6)
--    All copy: SEED DRAFTS — replace at GATE 2 review.
-- ============================================================================
insert into public.services (id, key, icon, sort_order, is_active)
values
  (gen_random_uuid(), 'web-apps',           null, 1, true),
  (gen_random_uuid(), 'ai-doc-tools',       null, 2, true),
  (gen_random_uuid(), 'workflow-automation',null, 3, true)
on conflict (key) do nothing;

insert into public.service_translations (service_id, locale, title, summary, deliverables)
select s.id, v.locale, v.title, v.summary, v.deliverables
from (values
  ('web-apps', 'en',
   'High-performance web platforms (Next.js, TypeScript & Supabase)',
   'A production web application or dashboard — not a prototype: real data, user accounts with roles, and the views and reports your team uses daily. Deployed, documented, and handed over to you.',
   array[
     'A short written spec you approve',
     'Data model, auth, roles and permissions',
     'The application or dashboard UI, bilingual-ready (EN/AR)',
     'Production deployment with documentation and handover'
   ]),
  ('web-apps', 'ar',
   'تطبيقات ويب ولوحات تحكم',
   'نظام ويب أو لوحة تحكم جاهز للعمل منذ اليوم الأول: بيانات حقيقية، حسابات مستخدمين بصلاحيات، شاشات وتقارير يستخدمها فريقك يوميًا — منشور وموثّق ومُسلَّم إليك.',
   array[
     'مواصفات مكتوبة مختصرة توافق عليها',
     'نموذج البيانات والمصادقة والأدوار والصلاحيات',
     'واجهة التطبيق أو اللوحة، جاهزة للغتين (عربي/إنجليزي)',
     'نشر على الإنتاج مع التوثيق والتسليم'
   ]),
  ('ai-doc-tools', 'en',
   'Full-stack AI & production RAG systems',
   'A tool that turns your documents into answers: semantic search and Q&A over your own files — PDFs, contracts, knowledge bases — with source citations and access control, instead of manual digging.',
   array[
     'A document ingestion pipeline for your formats',
     'A semantic (vector) index over your content',
     'A search/Q&A interface with citations',
     'Access control plus an evaluation pass on your real documents'
   ]),
  ('ai-doc-tools', 'ar',
   'أنظمة RAG إنتاجية وحلول ذكاء اصطناعي متكاملة',
   'أداة تحوّل مستنداتك إلى إجابات: بحث دلالي وأسئلة وأجوبة على ملفاتك الخاصة — ملفات PDF وعقود وقواعد معرفة — مع الاستشهاد بالمصادر وصلاحيات الوصول، بدل البحث اليدوي في الملفات.',
   array[
     'خط معالجة لاستيعاب مستنداتك بصيغها',
     'فهرسة دلالية (متجهية) لمحتواك',
     'واجهة بحث وأسئلة وأجوبة مع الاستشهاد بالمصادر',
     'صلاحيات وصول واختبار جودة على مستنداتك الحقيقية'
   ]),
  ('workflow-automation', 'en',
   'Agentic workflows, MCP tooling & deterministic CI pipelines',
   'Automations and agent tooling that connect the systems you already use: MCP servers, scheduled jobs, data sync between systems, and deterministic CI pipelines that make every change testable and reversible.',
   array[
     'A short workflow audit of what is manual today',
     'MCP tooling or the integration, built and monitored',
     'A deterministic CI pipeline with lint, types, tests and build as gates',
     'Failure alerts, runbook, documentation and handover'
   ]),
  ('workflow-automation', 'ar',
   'سير عمل وكيلي وأدوات MCP وخطوط CI حتمية',
   'أتمتة وأدوات وكلاء تربط الأنظمة التي تستخدمها فعلًا: خوادم MCP، مهام مجدولة، مزامنة بيانات بين الأنظمة، وخطوط CI حتمية تجعل كل تغيير قابلًا للاختبار والتراجع.',
   array[
     'فحص مختصر لسير العمل اليدوي اليوم',
     'أدوات MCP أو التكامل: بناء ومتابعة',
     'خط CI حتمي يجعل فحص الكود والأنواع والاختبارات والبناء بوابات إلزامية',
     'تنبيهات الفشل ودليل التشغيل والتوثيق والتسليم'
   ])
) as v(key, locale, title, summary, deliverables)
join public.services s on s.key = v.key
on conflict (service_id, locale) do update
  set title = excluded.title,
      summary = excluded.summary,
      deliverables = excluded.deliverables,
      updated_at = now();

-- ============================================================================
-- 3. media_assets — certificate PDF (row seeded; the physical upload happens
--    in M1 Stage 4; asset_url is wired to credentials after upload)
-- ============================================================================
insert into public.media_assets (bucket, storage_path, media_kind, mime_type, size_bytes, alt_en, alt_ar, is_private)
values (
  'public-assets',
  'certificates/omp-certificate.pdf',
  'document',
  'application/pdf',
  285463, -- exact local file size in bytes (stat, 2026-11-06)
  'One Million Prompters certificate of completion',
  'شهادة إتمام مبادرة مليون خيّر لأوامر الذكاء الاصطناعي',
  false
)
on conflict (bucket, storage_path) do update
  set mime_type = excluded.mime_type,
      size_bytes = excluded.size_bytes,
      alt_en = excluded.alt_en,
      alt_ar = excluded.alt_ar,
      updated_at = now();

-- ============================================================================
-- 4. credentials — One Million Prompters (facts verbatim from the PDF)
--    issued_at / credential_id / verification_url: TO VERIFY — stay NULL (Rule R7).
--    issuer_display: logo credits wording — never an "issued by" legal sentence.
--    AR issuer/summary: fresh wording (Arabic DCAI text not verbatim in the PDF extract).
-- ============================================================================
insert into public.credentials (kind, recipient_name, issued_at, credential_id, verification_url,
                                proof_url, asset_media_id, sort_order, status)
select
  'certificate',
  'Ahmed Aboalyoun',        -- exactly as printed on the PDF (Latin script)
  null, null, null,          -- TO VERIFY ×3
  'https://dub.ai/omp',      -- program page (provided by Ahmed; NOT printed on the PDF)
  (select id from public.media_assets where bucket = 'public-assets' and storage_path = 'certificates/omp-certificate.pdf'),
  1,
  'published'                -- published at GATE 2 sign-off (2026-11-07); TO VERIFY fields stay NULL
where not exists (select 1 from public.credentials c where c.proof_url = 'https://dub.ai/omp');

insert into public.credential_translations (credential_id, locale, title, issuer_display, summary)
select c.id, v.locale, v.title, v.issuer_display, v.summary
from (values
  ('en',
   '1 MILLION PROMPTERS — Certificate of Completion',
   'Dubai Future Foundation · Dubai Centre for Artificial Intelligence',
   'Completion of the One Million Prompters initiative — a prompt-engineering training program. The certificate credits Dubai Future Foundation and the Dubai Centre for Artificial Intelligence. Program page: dub.ai/omp.'),
  ('ar',
   'شهادة إتمام — مبادرة مليون خيّر لأوامر الذكاء الاصطناعي (1 Million Prompters)',
   'مؤسسة دبي للمستقبل · مركز دبي للذكاء الاصطناعي',
   'إتمام مبادرة «مليون خيّر لأوامر الذكاء الاصطناعي» (1 Million Prompters) — برنامج تدريبي في هندسة الأوامر. تحمل الشهادة شعارَي مؤسسة دبي للمستقبل ومركز دبي للذكاء الاصطناعي. صفحة البرنامج: dub.ai/omp.')
) as v(locale, title, issuer_display, summary)
join public.credentials c on c.proof_url = 'https://dub.ai/omp'
on conflict (credential_id, locale) do update
  set title = excluded.title,
      issuer_display = excluded.issuer_display,
      summary = excluded.summary,
      updated_at = now();

-- ============================================================================
-- 5. contributions — 4 rows, statuses verified live (re-checked 2026-11-06)
--    #114809 title read verbatim from the live PR on 2026-11-06.
-- ============================================================================
insert into public.contributions (repo, number, kind, status, your_role, related_number,
                                  event_date, verification_date, proof_url, sort_order, is_published)
values
  ('NousResearch/hermes-agent', 114809, 'pr', 'merged', 'salvage-credited-author', 109834,
   '2026-09-18', '2026-11-06', 'https://github.com/NousResearch/hermes-agent/pull/114809', 1, true),
  ('NousResearch/hermes-agent', 106626, 'pr', 'open', 'author', null,
   null, '2026-11-06', 'https://github.com/NousResearch/hermes-agent/pull/106626', 2, true),
  ('NousResearch/hermes-agent', 122144, 'pr', 'open', 'author', null,
   null, '2026-11-06', 'https://github.com/NousResearch/hermes-agent/pull/122144', 3, true),
  ('MiniMax-AI/minimax-code', 141, 'issue', 'acknowledged', 'reporter-responsible-disclosure', null,
   '2026-09-21', '2026-11-06', 'https://github.com/MiniMax-AI/minimax-code/issues/141', 4, true)
on conflict (repo, number) do update
  set status = excluded.status,
      your_role = excluded.your_role,
      related_number = excluded.related_number,
      event_date = excluded.event_date,
      verification_date = excluded.verification_date,
      proof_url = excluded.proof_url,
      sort_order = excluded.sort_order,
      is_published = excluded.is_published,
      updated_at = now();
-- NOTE: #109834 is closed-unmerged and appears ONLY as related_number above —
-- never as its own row, never labeled "merged" (semantic lock, CONTENT-MODEL §6).

insert into public.contribution_translations (contribution_id, locale, title, summary)
select k.id, v.locale, v.title, v.summary
from (values
  ('NousResearch/hermes-agent', 114809, 'en',
   'fix(config): malformed custom_providers no longer empties the providers view; config set refuses type mismatches; nested aliases keep key_env (#114605, #114471, salvage #45730, #109834)',
   'Config-CLI hardening merged into hermes-agent main (2026-09-18). Includes the salvaged fix from PR #109834 (@fotedev) — credited in the PR body as "source hunk, earliest filer" — with an attributed commit; authorship preserved.'),
  ('NousResearch/hermes-agent', 114809, 'ar',
   'fix(config): malformed custom_providers no longer empties the providers view; config set refuses type mismatches; nested aliases keep key_env (#114605, #114471, salvage #45730, #109834)',
   'تحصين واجهة إعداد الأوامر مدموج في hermes-agent (18 سبتمبر 2026). يتضمن الإصلاح المنقذ من الطلب #109834 (@fotedev) — مُشاد به في نص الطلب بأنه «صاحب المصدر الأول» — مع حفظ النسبة للعمل عبر commit باسمه.'),
  ('NousResearch/hermes-agent', 106626, 'en',
   'fix(gateway): prefer session model override in /usage billing route',
   'Open pull request (last updated 2026-10-17). Status: open — not merged.'),
  ('NousResearch/hermes-agent', 106626, 'ar',
   'fix(gateway): prefer session model override in /usage billing route',
   'طلب دمج مفتوح (آخر تحديث 17 أكتوبر 2026). الحالة: مفتوح — غير مدموج.'),
  ('NousResearch/hermes-agent', 122144, 'en',
   'fix(windows): respawn gateway on the venv interpreter when captured argv leads with the base interpreter',
   'Open pull request (last updated 2026-10-17). Status: open — not merged.'),
  ('NousResearch/hermes-agent', 122144, 'ar',
   'fix(windows): respawn gateway on the venv interpreter when captured argv leads with the base interpreter',
   'طلب دمج مفتوح (آخر تحديث 17 أكتوبر 2026). الحالة: مفتوح — غير مدموج.'),
  ('MiniMax-AI/minimax-code', 141, 'en',
   'Insecure plaintext storage of Telegram bot tokens and Windows NTFS permission fallbacks in @mavis/local-runtime',
   'Responsible security disclosure. Acknowledged by the vendor on 2026-09-21 ("Acknowledged on both counts… Forwarded to security review"). Issue closed 2026-10-19 as not_planned — no fix PR referenced; never labeled "fixed".'),
  ('MiniMax-AI/minimax-code', 141, 'ar',
   'Insecure plaintext storage of Telegram bot tokens and Windows NTFS permission fallbacks in @mavis/local-runtime',
   'إفصاح أمني مسؤول. أقرّ به المورّد في 21 سبتمبر 2026 («Acknowledged on both counts… Forwarded to security review»). أُغلق البلاغ في 19 أكتوبر 2026 كـ not_planned — دون PR لإصلاح مُشار إليه؛ لا يُوصف أبدًا بأنه «مُصلح».')
) as v(repo, number, locale, title, summary)
join public.contributions k on k.repo = v.repo and k.number = v.number
on conflict (contribution_id, locale) do update
  set title = excluded.title,
      summary = excluded.summary,
      updated_at = now();

-- ============================================================================
-- 6. projects — case studies approved at GATE 2 sign-off (2026-11-07):
--    masar-x, ghost, khalat (published + featured). khalat has no public
--    source (private repo → "Private Production Repo" badge; owner-attested
--    content only, no invented stack). ghost carries the responsible-use note
--    from its own docs (README/SECURITY.md). No unverifiable claims.
-- ============================================================================
-- NOTE on ordering: enforce_publish_gate() refuses status='published' without an
-- AR translation, so rows insert as 'draft' and are published via UPDATE after
-- the translations below (the gate's own instruction).
insert into public.projects (slug, status, is_featured, sort_order, tech_stack, repo_url, live_url)
values
  (
  'masar-x', 'draft', true, 1,
  array['Next.js', 'TypeScript', 'Supabase', 'pgvector', 'Electron', 'Expo'],
  'https://github.com/fotedev/Masar-x-next',
  'https://masarx.vercel.app'
  ),
  (
  'ghost', 'draft', true, 2,
  array['PowerShell', 'Python'],
  'https://github.com/fotedev/ghost',
  null
  ),
  (
  'khalat', 'draft', true, 3,
  '{}',
  null, -- repo is private → UI renders the "Private Production Repo" badge
  null
  )
on conflict (slug) do update
  set tech_stack = excluded.tech_stack,
      repo_url = excluded.repo_url,
      live_url = excluded.live_url,
      updated_at = now();

insert into public.project_translations (project_id, locale, title, summary, problem, solution, results)
select p.id, v.locale, v.title, v.summary, v.problem, v.solution, v.results
from (values
  ('masar-x', 'en',
   'Masar X',
   'Bilingual AI study platform: semantic PDF search and vector document indexing across web, desktop, and mobile clients on a single Supabase backend.',
   'Students need to search and study from large PDF collections quickly, on whatever device they have, without their materials and progress living in separate silos.',
   'A pnpm monorepo sharing one Supabase backend (RLS, Edge Functions) across a Next.js web app, an Electron desktop app, and an Expo mobile app, with semantic search over ingested PDFs and vector document indexing.',
   null),
  ('masar-x', 'ar',
   'Masar X',
   'منصة دراسية ذكية ثنائية اللغة: بحث دلالي في ملفات PDF وفهرسة متجهية للمستندات عبر تطبيقات الويب وسطح المكتب والجوال، على خلفية Supabase واحدة.',
   'يحتاج الطلاب إلى البحث والمذاكرة من مجموعات PDF كبيرة بسرعة، وعلى أي جهاز يتوفرون عليه، دون أن تظل موادهم وتقدمهم موزعة على أنظمة منفصلة.',
   'مستودع Monorepo بإدارة pnpm يتشارك خلفية Supabase واحدة (RLS ودوال Edge) بين تطبيق ويب Next.js وتطبيق سطح مكتب Electron وتطبيق جوال Expo، مع بحث دلالي على ملفات PDF المستوعبة وفهرسة متجهية للمستندات.',
   null),
  ('ghost', 'en',
   'ghost',
   'Open-source CLI (28 stars) that resets device and machine identifiers for AI coding IDEs, with guided flows, audit logs and restore scripts on Windows and Linux. Positioned as developer privacy hygiene; the project''s own docs tell users to comply with each vendor''s terms of service.',
   'AI coding IDEs fingerprint hardware and machine identifiers. Developers re-imaging a machine, selling hardware, or separating work environments have no clean, documented way to reset those identities, so they fall back to scattered manual registry and config edits.',
   'GHOST (Guided Hardware & OS Scrubbing Toolkit) is a PowerShell and Python CLI with guided per-IDE reset flows covering Cursor, Windsurf, Trae, Qoder and other AI IDEs, plus audit logs and restore scripts. Pester, ShellCheck and unittest suites run in CI. It is positioned as developer privacy hygiene: the README and SECURITY.md state that users are responsible for complying with each vendor''s terms.',
   '28 GitHub stars (verified 2026-11-07). Pester, ShellCheck and unittest suites run on every push via CI. Apache-2.0 licensed.'),
  ('ghost', 'ar',
   'ghost',
   'أداة سطر أوامر مفتوحة المصدر (28 نجمة) تعيد ضبط معرّفات الجهاز والنظام لبيئات التطوير المدعومة بالذكاء الاصطناعي، بمسارات موجّهة وسجلات تدقيق وسكربتات استرجاع على ويندوز ولينكس. تُقدَّم كنظافة خصوصية للمطوّر؛ وتنص وثائق المشروع نفسها على أن المستخدم مسؤول عن الالتزام بشروط كل مورّد.',
   'بيئات تطوير الذكاء الاصطناعي تبصم على الجهاز ومعرّفات النظام. المطوّر الذي يعيد تجهيز جهازه أو يبيعه أو يفصل بين بيئات عمله لا يملك طريقة نظيفة وموثّقة لتصفير تلك الهويات، فيلجأ إلى تعديلات يدوية متفرقة في السجل والإعدادات.',
   'GHOST (Guided Hardware & OS Scrubbing Toolkit) واجهة سطر أوامر بلغتي PowerShell وPython بمسارات إعادة ضبط موجّهة لكل بيئة على حدة، تغطي Cursor وWindsurf وTrae وQoder وغيرها، مع سجلات تدقيق وسكربتات استرجاع. تعمل مجموعات اختبار Pester وShellCheck وunittest في CI. تُقدَّم الأداة كنظافة خصوصية للمطوّر: ينص الملفان README وSECURITY.md على أن المستخدم مسؤول عن الالتزام بشروط كل مورّد.',
   '28 نجمة على GitHub (تحقّق 2026-11-07). تعمل مجموعات اختبار Pester وShellCheck وunittest مع كل دفع عبر CI. مرخّصة بموجب Apache-2.0.'),
  ('khalat', 'en',
   'Khalat',
   'Production commerce and ordering web application, built and operated under a deterministic AI software-factory pipeline: locked specifications, milestone gates and CI-enforced quality checks. The source is private, so every statement on this page is owner-attested rather than publicly verifiable.',
   'A live ordering business needed software it could audit: decisions traceable, schema changes reviewed, releases gated, instead of a prototype that breaks quietly in production.',
   'The build runs as a governed factory. Each milestone starts from an approved spec, ships as a vertical slice through CI (lint, types, tests, build) and ends in a measured run log. Nothing merges without passing the gates; nothing publishes without an explicit owner decision.',
   'Running in production. Every milestone shipped through the factory''s gates: approved spec, CI-enforced quality checks, measured run log (owner-attested; the repository is private).'),
  ('khalat', 'ar',
   'Khalat',
   'تطبيق ويب إنتاجي للتجارة والطلبات، بُني ويُشغَّل عبر خطّ مصنع برمجيات حتمي بالذكاء الاصطناعي: مواصفات مقفلة، وبوابات مراحل، وفحوص جودة يفرضها CI. المصدر خاص، لذا كل ما يُذكر هنا تصريحات موثّقة من المالك لا يمكن التحقق منها علنًا.',
   'كان عمل طلبات حيّ يحتاج برمجيات قابلة للتدقيق: قرارات قابلة للتتبع، وتغييرات مخطط تُراجَع، وإصدارات عبر بوابات، بدل نموذج أولي ينهار بصمت في الإنتاج.',
   'يُنفَّذ البناء كمصنع خاضع للحوكمة. تبدأ كل مرحلة من مواصفة معتمدة، وتُسلَّم كشريحة عمودية تمرّ عبر CI (فحص الكود، الأنواع، الاختبارات، البناء)، وتنتهي بسجل تشغيل مقاس. لا يُدمج شيء دون اجتياز البوابات، ولا يُنشر شيء دون قرار صريح من المالك.',
   'يعمل في الإنتاج. كل مرحلة عبرت بوابات المصنع: مواصفة معتمدة، وفحوص جودة عبر CI، وسجل تشغيل مقاس (موثّق من المالك؛ المستودع خاص).')
) as v(slug, locale, title, summary, problem, solution, results)
join public.projects p on p.slug = v.slug
on conflict (project_id, locale) do update
  set title = excluded.title,
      summary = excluded.summary,
      problem = excluded.problem,
      solution = excluded.solution,
      results = excluded.results,
      updated_at = now();

-- Publish after translations exist (publish-gate ordering; see note above)
update public.projects
set status = 'published', updated_at = now()
where slug in ('masar-x', 'ghost', 'khalat');

-- ============================================================================
-- 7. posts / inquiries — intentionally EMPTY (zero seed, Rule: deferred/no UI)
-- ============================================================================
