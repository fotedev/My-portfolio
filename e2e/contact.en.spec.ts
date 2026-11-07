import { expect, test } from "@playwright/test";

/**
 * EN happy path + rate-limit + degraded mode (prompt-5 §7). Serial within the
 * file; the 429 test relies on the net cap (3/10min per runner IP) and runs
 * LAST so earlier tests are not starved.
 */
test.describe("contact EN", () => {
  // Clipboard needs explicit permission in headless Chromium.
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  const uniqueEmail = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  let submittedName = "";

  test("shows inline validation errors without firing a request", async ({ page }) => {
    let requestFired = false;
    await page.route("**/functions/v1/submit-inquiry", (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto("/en/contact");
    await page.getByRole("textbox", { name: "Name" }).fill("A");
    await page.getByRole("textbox", { name: "Email" }).fill("not-an-email");
    await page.getByLabel("What do you need?").selectOption("web-apps");
    await page.getByRole("textbox", { name: "Message" }).fill("too short");
    await page.getByRole("button", { name: "Send inquiry" }).click();

    // Scope past Next's route announcer (also role="alert").
    await expect(page.getByText("Please fix the highlighted fields")).toBeVisible();
    await expect(page.getByText("Please enter your name")).toBeVisible();
    expect(requestFired).toBe(false);
  });

  test("submits a valid inquiry and shows the stored-success state", async ({ page }) => {
    submittedName = `CI E2E ${Date.now()}`;
    await page.goto("/en/contact");
    await page.getByRole("textbox", { name: "Name" }).fill(submittedName);
    await page.getByRole("textbox", { name: "Email" }).fill(uniqueEmail);
    await page.getByLabel("What do you need?").selectOption("ai-doc-tools");
    await page
      .getByRole("textbox", { name: "Message" })
      .fill("This is an automated CI end-to-end test inquiry; it can be archived.");
    // Turnstile test sitekey auto-passes; wait for the token callback.
    // Deterministic: wait for the Turnstile token callback (single-use token).
    await page.waitForSelector('form[data-turnstile-ready="true"]', { timeout: 15_000 });
    await page.getByRole("button", { name: "Send inquiry" }).click();

    await expect(page.getByText("Stored — I'll get back to you")).toBeVisible({ timeout: 20_000 });
    // Direct-email fallback present in the success state too.
    await expect(page.getByRole("link", { name: "Write an email" }).first()).toBeVisible();
  });

  test("honeypot stays invisible to humans and blocks the request silently", async ({ page }) => {
    let requestFired = false;
    await page.route("**/functions/v1/submit-inquiry", (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto("/en/contact");
    // The honeypot is visually hidden (opacity-0 + 1px wrapper); Playwright
    // counts that as visible, so assert the aria-hidden wrapper instead.
    const honeypot = page.locator("#company_website");
    await expect(honeypot).toHaveCount(1);
    await honeypot.fill("http://spam.example");
    await page.getByRole("textbox", { name: "Name" }).fill("Bot Bot");
    await page.getByRole("textbox", { name: "Email" }).fill("bot@example.com");
    await page.getByLabel("What do you need?").selectOption("other");
    await page.getByRole("textbox", { name: "Message" }).fill("A spam message that should never reach storage.");
    await page.getByRole("button", { name: "Send inquiry" }).click();

    await page.waitForTimeout(1000);
    expect(requestFired).toBe(false);
    await expect(page.getByText("Stored — I'll get back to you")).toHaveCount(0);
  });

  test("degraded mode: unreachable function still leaves the email card interactive", async ({
    page,
  }) => {
    await page.route("**/functions/v1/submit-inquiry", (route) => route.abort());
    await page.goto("/en/contact");
    await page.getByRole("textbox", { name: "Name" }).fill("Degraded Test");
    await page.getByRole("textbox", { name: "Email" }).fill("degraded@example.com");
    await page.getByLabel("What do you need?").selectOption("web-apps");
    await page.getByRole("textbox", { name: "Message" }).fill("Testing that the fallback survives a dead endpoint.");
    // Deterministic: wait for the Turnstile token callback (single-use token).
    await page.waitForSelector('form[data-turnstile-ready="true"]', { timeout: 15_000 });
    await page.getByRole("button", { name: "Send inquiry" }).click();

    await expect(page.getByText("was not stored")).toBeVisible({ timeout: 20_000 });
    // The page never hard-fails closed:
    const copyButton = page.getByRole("button", { name: "Copy email address" }).first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    await expect(page.getByText("Copied").first()).toBeVisible();
  });

  test("rapid submissions hit the persistent rate limit (429)", async ({ page }) => {
    test.setTimeout(180_000);
    // Self-sufficient: earlier specs (AR happy path, EN happy path) already
    // consumed an unknown number of slots of the net window (3/10min per
    // runner IP), so we submit until the 429 appears — it must appear within
    // 3 more attempts because the cap is 3 per window.
    let rateLimited = false;
    for (let attempt = 1; attempt <= 3 && !rateLimited; attempt++) {
      await page.goto("/en/contact");
      await page.getByRole("textbox", { name: "Name" }).fill(`RateLimit ${attempt}`);
      await page.getByRole("textbox", { name: "Email" }).fill(`ratelimit-${Date.now()}-${attempt}@example.com`);
      await page.getByLabel("What do you need?").selectOption("other");
      await page
        .getByRole("textbox", { name: "Message" })
        .fill("Rate limit probe submission from the CI end-to-end suite.");
      // Deterministic: wait for the Turnstile token callback (single-use token).
    await page.waitForSelector('form[data-turnstile-ready="true"]', { timeout: 15_000 });
      await page.getByRole("button", { name: "Send inquiry" }).click();
      rateLimited = await page
        .getByText("Too many attempts right now")
        .waitFor({ timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
    }
    expect(rateLimited).toBe(true);
    // Fallback visible on the failure path as well.
    await expect(page.getByRole("button", { name: "Copy email address" }).first()).toBeVisible();
  });

  test("axe: zero critical or serious violations on /en/contact", async ({ page }) => {
    const { AxeBuilder } = await import("@axe-core/playwright");
    await page.goto("/en/contact");
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });
});
