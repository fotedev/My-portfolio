"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/contact/turnstile-widget";
import { CopyEmailButton } from "@/components/copy-email-button";
import { btnPrimary, btnSecondary } from "@/components/ui/cta";
import { budgetRanges, contactSchema, serviceKeys, timelines } from "@/lib/validations/contact";

type FormValues = {
  name: string;
  email: string;
  serviceInterest: string;
  message: string;
  budgetRange: string;
  timeline: string;
  company_website: string;
};

type Status = "idle" | "pending" | "success" | "invalid" | "verification_failed" | "rate_limited" | "error";

const EMPTY: FormValues = {
  name: "",
  email: "",
  serviceInterest: "",
  message: "",
  budgetRange: "",
  timeline: "",
  company_website: "",
};

function endpoint(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/functions/v1/submit-inquiry`;
}

/**
 * Contact form (prompt-5 §5). Client-side Zod gates the request (localized
 * error text comes from messages, not Zod's English strings); the Edge
 * Function re-validates server-side. The direct-email fallback is part of
 * every state — the page never hard-fails closed.
 */
export function ContactForm({ email }: { email: string }) {
  const t = useTranslations("contact");
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [token, setToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const successRef = useRef<HTMLDivElement>(null);

  const submissionToken = useMemo(() => crypto.randomUUID(), []);

  const set = useCallback((field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const serviceLabels: Record<string, string> = {
    "web-apps": t("serviceWebApps"),
    "ai-doc-tools": t("serviceRag"),
    "workflow-automation": t("serviceAutomation"),
    other: t("serviceOther"),
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") {
      return;
    }

    const parsed = contactSchema.safeParse({
      name: values.name,
      email: values.email,
      serviceInterest: values.serviceInterest === "" ? "invalid" : values.serviceInterest,
      message: values.message,
      ...(values.budgetRange ? { budgetRange: values.budgetRange } : {}),
      ...(values.timeline ? { timeline: values.timeline } : {}),
      submissionToken,
      company_website: values.company_website,
      turnstileToken: token ?? "",
    });

    if (!parsed.success) {
      // Honeypot filled = bot: stay silent (no request, no state change).
      if (parsed.error.issues.some((issue) => issue.path[0] === "company_website")) {
        return;
      }
      const errors: Record<string, boolean> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          errors[field] = true;
        }
      }
      setFieldErrors(errors);
      setStatus("invalid");
      return;
    }

    setStatus("pending");
    try {
      const res = await fetch(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        setStatus("success");
        requestAnimationFrame(() => successRef.current?.focus());
      } else if (res.status === 403) {
        setStatus("verification_failed");
      } else if (res.status === 429) {
        setStatus("rate_limited");
      } else {
        setStatus("error");
      }
    } catch {
      // Function unreachable (degraded mode): the email card below still works.
      setStatus("error");
    } finally {
      setToken(null);
      setResetSignal((signal) => signal + 1); // tokens are single-use
    }
  }

  const inputClass = (field: string) =>
    `min-h-11 w-full rounded-md border bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground ${
      fieldErrors[field] ? "border-danger" : "border-border-interactive"
    }`;

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="rounded-xl border border-success/40 bg-success-bg p-6"
      >
        <h2 className="type-h3 text-foreground">{t("formSuccessTitle")}</h2>
        <p className="mt-2 type-body-sm">{t("formSuccessBody")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={`mailto:${email}`} className={btnPrimary}>
            {t("mailto")}
          </a>
          <CopyEmailButton
            email={email}
            label={t("copyEmail")}
            copiedLabel={t("copied")}
            hintLabel={t("copyHint")}
            className="inline-flex min-h-11 items-center font-mono text-sm text-accent underline-offset-4 hover:underline"
          />
        </div>
      </div>
    );
  }

  const statusMessage =
    status === "invalid"
      ? t("formErrorSummary")
      : status === "verification_failed"
        ? t("formErrorVerification")
        : status === "rate_limited"
          ? t("formErrorRateLimited")
          : status === "error"
            ? t("formErrorGeneric")
            : null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      data-turnstile-ready={token ? "true" : "false"}
      className="rounded-xl border border-border-subtle bg-surface p-6"
    >
      {statusMessage && (
        <p role="alert" className="mb-6 rounded-md bg-danger-bg px-4 py-3 text-danger-text type-body-sm">
          {statusMessage}
        </p>
      )}

      {/* Honeypot — hidden from humans, irresistible to bots (wire key is stealth) */}
      <div aria-hidden="true" className="absolute size-px overflow-hidden opacity-0">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company_website}
          onChange={(e) => set("company_website")(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="type-body-sm font-medium text-muted-foreground">
            {t("formName")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            required
            aria-required="true"
            autoComplete="name"
            maxLength={80}
            value={values.name}
            onChange={(e) => set("name")(e.target.value)}
            aria-invalid={fieldErrors.name ? "true" : undefined}
            aria-describedby={fieldErrors.name ? "cf-name-error" : undefined}
            className={`mt-1.5 ${inputClass("name")}`}
          />
          {fieldErrors.name && (
            <p id="cf-name-error" className="mt-1.5 text-danger-text type-body-sm">
              {t("formNameError")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cf-email" className="type-body-sm font-medium text-muted-foreground">
            {t("emailLabel")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            dir="ltr"
            maxLength={254}
            value={values.email}
            onChange={(e) => set("email")(e.target.value)}
            aria-invalid={fieldErrors.email ? "true" : undefined}
            aria-describedby={fieldErrors.email ? "cf-email-error" : undefined}
            className={`mt-1.5 ${inputClass("email")}`}
          />
          {fieldErrors.email && (
            <p id="cf-email-error" className="mt-1.5 text-danger-text type-body-sm">
              {t("formEmailError")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cf-service" className="type-body-sm font-medium text-muted-foreground">
            {t("formService")} <span aria-hidden="true">*</span>
          </label>
          <select
            id="cf-service"
            name="serviceInterest"
            required
            aria-required="true"
            value={values.serviceInterest}
            onChange={(e) => set("serviceInterest")(e.target.value)}
            aria-invalid={fieldErrors.serviceInterest ? "true" : undefined}
            aria-describedby={fieldErrors.serviceInterest ? "cf-service-error" : undefined}
            className={`mt-1.5 ${inputClass("serviceInterest")}`}
          >
            <option value="" disabled>
              {t("formServicePlaceholder")}
            </option>
            {serviceKeys.map((key) => (
              <option key={key} value={key}>
                {serviceLabels[key]}
              </option>
            ))}
          </select>
          {fieldErrors.serviceInterest && (
            <p id="cf-service-error" className="mt-1.5 text-danger-text type-body-sm">
              {t("formServiceError")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cf-budget" className="type-body-sm font-medium text-muted-foreground">
              {t("formBudget")} <span className="text-muted-foreground">({t("formOptional")})</span>
            </label>
            <select
              id="cf-budget"
              name="budgetRange"
              value={values.budgetRange}
              onChange={(e) => set("budgetRange")(e.target.value)}
              className={`mt-1.5 ${inputClass("budgetRange")}`}
            >
              <option value=""></option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {t(`formBudget_${range.replace(/[^a-z0-9]/gi, "_")}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cf-timeline" className="type-body-sm font-medium text-muted-foreground">
              {t("formTimeline")} <span className="text-muted-foreground">({t("formOptional")})</span>
            </label>
            <select
              id="cf-timeline"
              name="timeline"
              value={values.timeline}
              onChange={(e) => set("timeline")(e.target.value)}
              className={`mt-1.5 ${inputClass("timeline")}`}
            >
              <option value=""></option>
              {timelines.map((option) => (
                <option key={option} value={option}>
                  {t(`formTimeline_${option.replace(/[^a-z0-9]/gi, "_")}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="cf-message" className="type-body-sm font-medium text-muted-foreground">
          {t("formMessage")} <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          aria-required="true"
          rows={5}
          minLength={20}
          maxLength={2000}
          value={values.message}
          onChange={(e) => set("message")(e.target.value)}
          aria-invalid={fieldErrors.message ? "true" : undefined}
          aria-describedby={fieldErrors.message ? "cf-message-error" : undefined}
          className={`mt-1.5 min-h-32 ${inputClass("message")}`}
        />
        {fieldErrors.message && (
          <p id="cf-message-error" className="mt-1.5 text-danger-text type-body-sm">
            {t("formMessageError")}
          </p>
        )}
      </div>

      <div className="mt-6">
        <TurnstileWidget onToken={setToken} onExpire={() => setToken(null)} resetSignal={resetSignal} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={status === "pending"} aria-busy={status === "pending"} className={btnPrimary}>
          {status === "pending" ? t("formSubmitting") : t("formSubmit")}
        </button>
        <p className="type-caption text-muted-foreground">{t("formPrivacyNote")}</p>
      </div>

      {/* Degraded mode: the direct email card is ALWAYS available. */}
      <div className="mt-6 border-t border-border-subtle pt-4">
        <p className="type-body-sm text-muted-foreground">{t("formFallbackNote")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <CopyEmailButton
            email={email}
            label={t("copyEmail")}
            copiedLabel={t("copied")}
            hintLabel={t("copyHint")}
            className="inline-flex min-h-11 items-center font-mono text-sm text-accent underline-offset-4 hover:underline"
          />
          <a href={`mailto:${email}`} className={btnSecondary}>
            {t("mailto")}
          </a>
        </div>
      </div>
    </form>
  );
}
