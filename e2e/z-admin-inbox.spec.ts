import { expect, test } from "@playwright/test";

/**
 * Admin inbox round-trip (prompt-5 §7) — runs LAST (z- prefix) so the contact
 * specs have already created their rows. Skipped when E2E_ADMIN_PASSWORD is
 * not configured (locally it lives in .env.local; in CI it is a secret).
 */
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const adminEmail = "fote.siengineer@gmail.com";
/** Rows created by this suite — archived here so the real inbox stays clean. */
const CI_ROW_PATTERN = /CI E2E|RateLimit|Degraded Test|اختبار آلي/;

test.describe("admin inbox", () => {
  test.skip(!adminPassword, "E2E_ADMIN_PASSWORD not configured");

  test("login → inbox shows the CI test rows → archive them", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin");

    await page.goto("/admin/inquiries");
    await expect(page.getByRole("heading", { name: "Inquiries" })).toBeVisible();

    const ciCard = page.locator("article").filter({ hasText: CI_ROW_PATTERN }).first();
    await expect(ciCard).toBeVisible({ timeout: 10_000 });

    // Archive every CI-created row (loop: list refreshes via router.refresh()).
    for (let i = 0; i < 12; i++) {
      const card = page.locator("article").filter({ hasText: CI_ROW_PATTERN }).first();
      if ((await card.count()) === 0) break;
      // Skip already-archived rows (their status pill says archived).
      const badge = card.locator("span").first();
      if ((await badge.textContent()) === "archived") {
        // Move past this card by filtering it out via a narrower match.
        const notArchived = page
          .locator("article")
          .filter({ hasText: CI_ROW_PATTERN })
          .filter({ has: page.getByRole("button", { name: "Archive" }) })
          .first();
        if ((await notArchived.count()) === 0) break;
        await notArchived.getByRole("button", { name: "Archive" }).click();
      } else {
        await card.getByRole("button", { name: "Archive" }).click();
      }
      await page.waitForTimeout(800);
    }

    // Every remaining CI row (if any listed) must now show the archived pill.
    const remaining = page.locator("article").filter({ hasText: CI_ROW_PATTERN });
    const count = await remaining.count();
    for (let i = 0; i < count; i++) {
      await expect(remaining.nth(i).locator("span").first()).toHaveText("archived");
    }
  });
});
