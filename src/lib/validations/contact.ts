import { z } from "zod";

/**
 * Contact form schema (prompt-5 §4) — committed + unit-tested in M2, wired to
 * the UI and the `submit-inquiry` Edge Function in M4.
 *
 * WIRE CONTRACT: the Edge Function in supabase/functions/submit-inquiry/index.ts
 * mirrors this schema field-for-field (npm:zod there). Keep both in sync.
 */
export const serviceKeys = ["web-apps", "ai-doc-tools", "workflow-automation", "other"] as const;
export const budgetRanges = ["<1k", "1k-3k", "3k-10k", "10k-plus", "unsure"] as const;
export const timelines = ["asap", "1-month", "quarter", "flexible"] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .pipe(z.email("Enter a valid email address")),
  serviceInterest: z.enum(serviceKeys),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message must be at most 2000 characters"),
  budgetRange: z.enum(budgetRanges).optional(),
  timeline: z.enum(timelines).optional(),
  /** Client-generated idempotency token (double-submit dedupe). */
  submissionToken: z.string().uuid("Invalid submission token"),
  /**
   * Hidden honeypot field. The WIRE KEY is `company_website` on purpose
   * (prompt-5 §3): a field literally named "honeypot" announces the trap to
   * bots. Filled ⇒ bot — the Edge Function returns 200 and drops silently.
   */
  company_website: z.literal("", { message: "Honeypot must be empty" }),
  /** Turnstile token from the widget (cf-turnstile-response). */
  turnstileToken: z.string().min(1, "Turnstile token is required").max(2048),
});

export type ContactInput = z.infer<typeof contactSchema>;
