-- 0002_m3_publish_content.sql — M3 (2026-11-07)
-- Publish the three featured case studies (masar-x, ghost, khalat), flip the OMP
-- credential to published, and adopt the owner-approved service titles.
--
-- ORDERING MATTERS: enforce_publish_gate() refuses status='published' on a
-- project without an AR translation. New projects therefore insert as 'draft',
-- receive their translations, and are published via UPDATE at the end
-- (the gate's own instruction). Idempotent: safe to re-run.
-- Mirrors supabase/seed.sql §2/§4/§6 exactly.

-- 1) projects — upsert rows as draft (never touches status on conflict) -------
insert into public.projects (slug, status, is_featured, sort_order, tech_stack, repo_url, live_url)
values
  ('masar-x', 'draft', true, 1,
   array['Next.js', 'TypeScript', 'Supabase', 'pgvector', 'Electron', 'Expo'],
   'https://github.com/fotedev/Masar-x-next', 'https://masarx.vercel.app'),
  ('ghost', 'draft', true, 2,
   array['PowerShell', 'Python'],
   'https://github.com/fotedev/ghost', null),
  ('khalat', 'draft', true, 3,
   '{}',
   null, null)
on conflict (slug) do update
  set tech_stack = excluded.tech_stack,
      repo_url   = excluded.repo_url,
      live_url   = excluded.live_url,
      updated_at = now();

-- 2) translations (both locales, upsert) --------------------------------------
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

-- 3) publish (gate satisfied: both locales exist) ------------------------------
update public.projects
set status = 'published', updated_at = now()
where slug in ('masar-x', 'ghost', 'khalat');

-- 4) credential ----------------------------------------------------------------
update public.credentials
set status = 'published', updated_at = now()
where proof_url = 'https://dub.ai/omp';

-- 5) services — owner-approved titles (2026-11-07); workflow-automation copy
--    rewritten to match the agentic/MCP/CI positioning -------------------------
update public.service_translations st
set title = 'High-performance web platforms (Next.js, TypeScript & Supabase)', updated_at = now()
from public.services s
where st.service_id = s.id and s.key = 'web-apps' and st.locale = 'en';

update public.service_translations st
set title = 'Full-stack AI & production RAG systems', updated_at = now()
from public.services s
where st.service_id = s.id and s.key = 'ai-doc-tools' and st.locale = 'en';

update public.service_translations st
set title = 'أنظمة RAG إنتاجية وحلول ذكاء اصطناعي متكاملة', updated_at = now()
from public.services s
where st.service_id = s.id and s.key = 'ai-doc-tools' and st.locale = 'ar';

update public.service_translations st
set title = 'Agentic workflows, MCP tooling & deterministic CI pipelines',
    summary = 'Automations and agent tooling that connect the systems you already use: MCP servers, scheduled jobs, data sync between systems, and deterministic CI pipelines that make every change testable and reversible.',
    deliverables = array[
      'A short workflow audit of what is manual today',
      'MCP tooling or the integration, built and monitored',
      'A deterministic CI pipeline with lint, types, tests and build as gates',
      'Failure alerts, runbook, documentation and handover'
    ],
    updated_at = now()
from public.services s
where st.service_id = s.id and s.key = 'workflow-automation' and st.locale = 'en';

update public.service_translations st
set title = 'سير عمل وكيلي وأدوات MCP وخطوط CI حتمية',
    summary = 'أتمتة وأدوات وكلاء تربط الأنظمة التي تستخدمها فعلًا: خوادم MCP، مهام مجدولة، مزامنة بيانات بين الأنظمة، وخطوط CI حتمية تجعل كل تغيير قابلًا للاختبار والتراجع.',
    deliverables = array[
      'فحص مختصر لسير العمل اليدوي اليوم',
      'أدوات MCP أو التكامل: بناء ومتابعة',
      'خط CI حتمي يجعل فحص الكود والأنواع والاختبارات والبناء بوابات إلزامية',
      'تنبيهات الفشل ودليل التشغيل والتوثيق والتسليم'
    ],
    updated_at = now()
from public.services s
where st.service_id = s.id and s.key = 'workflow-automation' and st.locale = 'ar';
