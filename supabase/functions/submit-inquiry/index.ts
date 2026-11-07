// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: submit-inquiry (prompt-5 §4)
//
// Pipeline: validate (Zod) → honeypot (200-but-drop) → Turnstile siteverify
// (fail-closed) → persistent rate limit (M1 RPC, fail-closed) → service-role
// insert (idempotent on submission_token) → separate notify (Resend, log-only
// on failure) → JSON result. Direct-email fallback on the client never
// depends on any of this.
//
// WIRE CONTRACT: the schema below mirrors src/lib/validations/contact.ts —
// keep both in sync (checked by E2E probes).

import { z } from "npm:zod@4";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { evaluateRateLimits, type LimitSpec } from "./rate-limit.ts";

// Cloudflare's published always-pass TEST secret (docs: /turnstile/testing).
// When this is configured, action/hostname assertions are relaxed — the real
// widget secret (M6) enables them.
const TEST_TURNSTILE_SECRET = "1x0000000000000000000000000000000AA";

const MAX_BODY_BYTES = 16 * 1024;

const serviceKeys = ["web-apps", "ai-doc-tools", "workflow-automation", "other"] as const;
const budgetRanges = ["<1k", "1k-3k", "3k-10k", "10k-plus", "unsure"] as const;
const timelines = ["asap", "1-month", "quarter", "flexible"] as const;

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().min(1).max(254).pipe(z.email()),
  serviceInterest: z.enum(serviceKeys),
  message: z.string().trim().min(20).max(2000),
  budgetRange: z.enum(budgetRanges).optional(),
  timeline: z.enum(timelines).optional(),
  submissionToken: z.string().uuid(),
  // Stealth wire key for the honeypot (prompt-5 §3) — must stay empty.
  company_website: z.literal(""),
  turnstileToken: z.string().min(1).max(2048),
});

type InquiryInput = z.infer<typeof inquirySchema>;

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

/** Allowed browser origins (no wildcards in production, prompt-5 §4.6). */
function corsFor(origin: string | null): Record<string, string> | null {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (!origin || !allowed.includes(origin)) {
    return null;
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Client IP from the gateway's forwarded header (documented limitation:
 * absent headers collapse into one shared "unknown" bucket). */
function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";
  if (!secret) {
    // Fail-closed: no secret configured means no verification is possible.
    console.error("TURNSTILE_SECRET_KEY missing — failing closed");
    return false;
  }
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    if (!res.ok) {
      console.error(`siteverify HTTP ${res.status}`);
      return false;
    }
    const result = (await res.json()) as { success: boolean; action?: string; hostname?: string };
    if (!result.success) {
      return false;
    }
    if (secret !== TEST_TURNSTILE_SECRET) {
      // Canonical checks (turnstile-spin): action + frontend hostname allowlist.
      if (result.action !== "contact") {
        console.error("siteverify action mismatch");
        return false;
      }
      const allowedHostnames = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
        .split(",")
        .map((o) => {
          try {
            return new URL(o.trim()).hostname;
          } catch {
            return "";
          }
        })
        .filter(Boolean);
      if (!result.hostname || !allowedHostnames.includes(result.hostname)) {
        console.error("siteverify hostname mismatch");
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("siteverify failed:", err);
    return false;
  }
}

interface RateLimitRow {
  check_and_increment_rate_limit: boolean;
}

async function checkRateLimit(
  db: SupabaseClient,
  key: string,
  windowSeconds: number,
  max: number,
): Promise<boolean | undefined> {
  const { data, error } = await db.rpc("check_and_increment_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) {
    console.error(`rate limit RPC error for ${key}:`, error.message);
    return undefined; // fail-closed downstream
  }
  // The M1 RPC returns a scalar boolean. supabase-js surfaces it as `data:
  // boolean` (array shapes only occur for SETOF functions — accepted here for
  // defensiveness). Anything else → undefined → fail-closed downstream.
  if (typeof data === "boolean") {
    return data;
  }
  if (Array.isArray(data)) {
    const rows = data as unknown as RateLimitRow[];
    return rows[0]?.check_and_increment_rate_limit;
  }
  console.error(`rate limit RPC returned unexpected shape for ${key}`);
  return undefined;
}

function intEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function limitSpecs(netHash: string, email: string): LimitSpec[] {
  return [
    { key: `net:${netHash}`, windowSeconds: intEnv("RL_NET_WINDOW", 600), max: intEnv("RL_NET_MAX", 3) },
    {
      key: `email:${email.toLowerCase()}`,
      windowSeconds: intEnv("RL_EMAIL_WINDOW", 86400),
      max: intEnv("RL_EMAIL_MAX", 5),
    },
    { key: "global:daily", windowSeconds: intEnv("RL_GLOBAL_WINDOW", 86400), max: intEnv("RL_GLOBAL_MAX", 50) },
  ];
}

/** Separate, fail-tolerant notification (prompt-5 §4.4). Never blocks or
 * fails the response; never reported to the visitor. */
function notifyViaResend(inquiryId: string, inquiry: InquiryInput): void {
  const apiKey = Deno.env.get("EMAIL_PROVIDER_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!apiKey || !from) {
    console.log(`notify skipped (degraded mode): inquiry ${inquiryId} stored unread`);
    return;
  }
  const send = (async () => {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          from,
          to: [Deno.env.get("OWNER_EMAIL") ?? "fote.engineer@gmail.com"],
          reply_to: inquiry.email,
          subject: `New inquiry (${inquiry.serviceInterest}) — ref ${inquiryId.slice(0, 8)}`,
          text: [
            `Name: ${inquiry.name}`,
            `Email: ${inquiry.email}`,
            `Service: ${inquiry.serviceInterest}`,
            `Budget: ${inquiry.budgetRange ?? "n/a"}`,
            `Timeline: ${inquiry.timeline ?? "n/a"}`,
            "",
            inquiry.message,
            "",
            `Ref: ${inquiryId}`,
          ].join("\n"),
        }),
      });
      if (!res.ok) {
        console.error(`notify HTTP ${res.status} for inquiry ${inquiryId}`);
      }
    } catch (err) {
      console.error(`notify failed for inquiry ${inquiryId}:`, err);
    }
  })();
  // Background the send where the runtime supports it; otherwise it runs
  // unawaited (failure is logged, never surfaced).
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(send);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsFor(origin);
  const denyCors = json({ ok: false, reason: "forbidden" }, 403);

  if (req.method === "OPTIONS") {
    if (!cors) return denyCors;
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return json({ ok: false, reason: "method_not_allowed" }, 405, cors ?? {});
  }
  if (!cors) {
    return denyCors; // same-origin only
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, reason: "unsupported_media_type" }, 415, cors);
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  const raw = await req.text();
  if (declaredLength > MAX_BODY_BYTES || raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, reason: "payload_too_large" }, 413, cors);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, reason: "invalid_json" }, 400, cors);
  }

  const parsed = inquirySchema.safeParse(payload);

  // Honeypot FIRST — before any strictness leaks a hint to the bot: a filled
  // trap gets the same 200 a real submission would get, with a net-counter
  // increment so floods burn their own budget. The global cap is deliberately
  // NOT burned (that would DoS real visitors).
  const honeypotFilled =
    typeof (payload as Record<string, unknown>).company_website === "string" &&
    (payload as Record<string, unknown>).company_website !== "";
  if (honeypotFilled) {
    const ip = clientIp(req);
    const ipHash = await sha256Hex(`${Deno.env.get("IP_HASH_SALT") ?? ""}:${ip}`);
    const db = serviceClient();
    await checkRateLimit(db, `net:${ipHash}`, intEnv("RL_NET_WINDOW", 600), intEnv("RL_NET_MAX", 3));
    return json({ ok: true }, 200, cors);
  }

  if (!parsed.success) {
    return json({ ok: false, reason: "invalid" }, 400, cors);
  }
  const inquiry = parsed.data;
  const ip = clientIp(req);
  const ipHash = await sha256Hex(`${Deno.env.get("IP_HASH_SALT") ?? ""}:${ip}`);
  const db = serviceClient();

  // 2) Turnstile — fail-closed (403), timeouts count as failure.
  if (!(await verifyTurnstile(inquiry.turnstileToken, ip))) {
    return json({ ok: false, reason: "verification_failed" }, 403, cors);
  }

  // 3) Persistent rate limits — net hash, lowered email, global daily cap.
  const specs = limitSpecs(ipHash, inquiry.email);
  const results: Array<boolean | undefined> = [];
  for (const spec of specs) {
    results.push(await checkRateLimit(db, spec.key, spec.windowSeconds, spec.max));
  }
  const decision = evaluateRateLimits(specs, results);
  if (!decision.allowed) {
    return json(
      { ok: false, reason: "rate_limited" },
      429,
      { ...cors, "Retry-After": String(decision.retryAfterSeconds ?? 600) },
    );
  }

  // 5) Service-role insert (no anon INSERT policy exists — by design).
  const { data, error } = await db
    .from("inquiries")
    .insert({
      name: inquiry.name,
      email: inquiry.email.toLowerCase(),
      service_interest: inquiry.serviceInterest === "other" ? null : inquiry.serviceInterest,
      message: inquiry.message,
      budget: inquiry.budgetRange ?? null,
      timeline: inquiry.timeline ?? null,
      ip_hash: ipHash,
      submission_token: inquiry.submissionToken,
    })
    .select("id")
    .single();

  if (error) {
    // Idempotency: a replayed submission_token means it is already stored.
    if (error.code === "23505") {
      return json({ ok: true, duplicate: true }, 200, cors);
    }
    console.error("insert failed:", error.message);
    return json({ ok: false, reason: "storage_error" }, 500, cors);
  }

  // 4) Notify separately — failures are logged, never surfaced.
  const inquiryId = (data as { id: string }).id;
  notifyViaResend(inquiryId, inquiry);

  return json({ ok: true, id: inquiryId }, 200, cors);
});
