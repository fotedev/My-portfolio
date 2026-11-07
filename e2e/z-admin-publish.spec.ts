import { expect, test, type Page } from "@playwright/test";

/**
 * M5 round trip (prompt-6 §7): login → create project → save draft →
 * preview shows the AR draft → public URL 404s while unpublished → publish →
 * /ar reflects the change (EN isolation asserted by content) → cleanup →
 * logout → admin routes redirect. Publish→visible latency is measured and
 * printed (3 samples land in docs/OPERATIONS.md).
 *
 * Deviation from issue #5's literal wording: the round trip edits a PROJECT
 * (draftable) instead of the hero settings — CI must never mutate the real
 * hero copy (settings have no draft state; a crashed run would leave the
 * live site edited). The settings screen is smoke-checked read-only.
 * Skipped when E2E_ADMIN_PASSWORD is not configured.
 */
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const adminEmail = "fote.siengineer@gmail.com";

const EN = {
  title: "CI E2E Draft Project",
  summary: "Automated M5 round-trip content.",
  problem: "The pipeline must prove drafts stay private until published.",
  solution: "Draft, preview, publish, measure, clean up.",
};
const AR = {
  title: "مشروع اختبار النشر",
  summary: "محتوى اختبار آلي للنشر.",
  problem: "يجب أن تثبت المسودة أنها خاصة قبل النشر.",
  solution: "مسودة، معاينة، نشر، قياس، تنظيف.",
};

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

/** Unpublish + delete every leftover CI test project (rerun-safe cleanup). */
async function cleanupTestProjects(page: Page) {
  for (let pass = 0; pass < 6; pass += 1) {
    await page.goto("/admin/projects");
    const rowLink = page.getByRole("link", { name: EN.title }).first();
    if ((await rowLink.count()) === 0) return;
    await rowLink.click();
    await page.waitForURL("**/admin/projects/**");
    const unpublish = page.getByRole("button", { name: "Unpublish", exact: true });
    if ((await unpublish.count()) === 1) {
      await unpublish.click();
      await page.waitForTimeout(1500);
      await page.goto("/admin/projects");
      await page.getByRole("link", { name: EN.title }).first().click();
      await page.waitForURL("**/admin/projects/**");
    }
    const del = page.getByRole("button", { name: "Delete draft", exact: true });
    if ((await del.count()) === 1) {
      page.once("dialog", (dialog) => {
        void dialog.accept();
      });
      await del.click();
      await page.waitForTimeout(1500);
    } else {
      return;
    }
  }
}

test.describe("admin publish round trip", () => {
  test.skip(!adminPassword, "E2E_ADMIN_PASSWORD not configured");

  test("draft → preview → publish → public reflects → cleanup", async ({ page }) => {
    const slug = `ci-e2e-${Date.now().toString(36)}`;
    const latencies: number[] = [];

    await login(page);
    await cleanupTestProjects(page); // rerun-safe: remove leftovers from earlier runs

    // Editor (EN tab default): create the draft.
    await page.goto("/admin/projects/new");
    await page.screenshot({ path: "test-results/screens/05-editor-new.png", fullPage: true });
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Title (EN)").fill(EN.title);
    await page.getByLabel("Summary (EN)").fill(EN.summary);
    await page.getByLabel("Problem (EN)").fill(EN.problem);
    await page.getByLabel("Solution (EN)").fill(EN.solution);

    await page.getByRole("tab", { name: /العربية/ }).click();
    await page.screenshot({ path: "test-results/screens/06-editor-ar-tab.png", fullPage: true });
    await page.getByLabel("Title (AR)").fill(AR.title);
    await page.getByLabel("Summary (AR)").fill(AR.summary);
    await page.getByLabel("Problem (AR)").fill(AR.problem);
    await page.getByLabel("Solution (AR)").fill(AR.solution);

    try {
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Draft saved" })).toBeVisible();
      await page.waitForURL("**/admin/projects");

      // Draft preview: watermark + AR draft content.
      await page.goto(`/admin/preview/projects/${slug}`);
      await expect(page.getByText("Not visible to visitors")).toBeVisible();
      await expect(page.getByRole("heading", { name: AR.title })).toBeVisible();
      await page.screenshot({ path: "test-results/screens/07-preview-draft.png", fullPage: true });

      // Unpublished slug is unreachable publicly (anon RLS).
      const draftResponse = await page.goto(`/en/projects/${slug}`);
      expect(draftResponse?.status()).toBe(404);

      // Publish from the editor.
      await page.goto("/admin/projects");
      await page.getByRole("link", { name: EN.title }).click();
      await page.waitForURL("**/admin/projects/**");
      await page.getByRole("button", { name: "Publish" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Published" })).toBeVisible();

      // Publish→visible: poll the AR public page until it renders the draft.
      const t0 = Date.now();
      let arStatus = 0;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const response = await page.goto(`/ar/projects/${slug}`);
        arStatus = response?.status() ?? 0;
        if (arStatus === 200 && (await page.getByRole("heading", { name: AR.title }).count()) > 0) {
          break;
        }
        await page.waitForTimeout(1000);
      }
      const latency = (Date.now() - t0) / 1000;
      latencies.push(latency);
      console.log(`[M5 latency] publish→visible: ${latency.toFixed(1)}s`);
      expect(arStatus).toBe(200);
      await expect(page.getByRole("heading", { name: AR.title })).toBeVisible();

      // EN page reflects the same publish (locale isolation of content).
      await page.goto(`/en/projects/${slug}`);
      await expect(page.getByRole("heading", { name: EN.title })).toBeVisible();
      await page.screenshot({ path: "test-results/screens/08-published-ar.png", fullPage: true });

      // Settings screen smoke (read-only — CI never mutates the live hero).
      await page.goto("/admin/settings");
      await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
      await expect(page.getByLabel("Contact email")).toBeVisible();
      await page.screenshot({ path: "test-results/screens/09-settings.png", fullPage: true });
    } finally {
      await cleanupTestProjects(page);
    }

    // Logout: admin routes redirect to login afterwards.
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/admin/login");
    await page.goto("/admin/projects");
    await page.waitForURL("**/admin/login");

    console.log(`[M5 latency] samples: ${JSON.stringify(latencies)}`);
  });
});
