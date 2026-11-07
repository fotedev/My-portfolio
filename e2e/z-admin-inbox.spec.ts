import { expect, test } from "@playwright/test";

/**
 * Admin inbox round trip (prompt-6 §3) — runs LAST (z- prefix) so the contact
 * specs have already created their rows. Exercises: status filter, mark-read
 * transition, bulk archive, and the delete-on-request purge (typed reference,
 * RLS policy `inquiries_admin_delete` from migration 0003). Skipped when
 * E2E_ADMIN_PASSWORD is not configured.
 */
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const adminEmail = "fote.siengineer@gmail.com";
/** Rows created by this suite — cleaned up here so the real inbox stays tidy. */
const CI_ROW_PATTERN = /CI E2E|RateLimit|Degraded Test|اختبار آلي/;

test.describe("admin inbox", () => {
  test.skip(!adminPassword, "E2E_ADMIN_PASSWORD not configured");

  test("login → filter → transitions → bulk archive → typed purge", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin");

    await page.goto("/admin/inquiries");
    await expect(page.getByRole("heading", { name: "Inquiries" })).toBeVisible();
    await page.screenshot({ path: "test-results/screens/10-inbox.png", fullPage: true });

    await expect(page.getByRole("row").filter({ hasText: CI_ROW_PATTERN }).first()).toBeVisible({
      timeout: 10_000,
    });

    // Status filter narrows to unread.
    await page.getByRole("button", { name: /^unread/ }).click();

    // Expand a CI row's detail and transition it (unread → read).
    const unreadRow = page.getByRole("row").filter({ hasText: CI_ROW_PATTERN }).first();
    if (await unreadRow.isVisible()) {
      await unreadRow.locator("button").first().click();
      const detail = page.getByRole("region", { name: /Inquiry from/ }).first();
      await expect(detail).toBeVisible();
      const markRead = detail.getByRole("button", { name: "Mark read" });
      if ((await markRead.count()) > 0) {
        await markRead.click();
        await expect(page.getByRole("status").first()).toBeHidden({ timeout: 10_000 });
      }
    }

    // Back to all — unread filter may be empty after the transition.
    await page.getByRole("button", { name: /^all/ }).click();

    // Bulk archive: select up to two CI rows and archive them together.
    const checkboxes = page
      .getByRole("row")
      .filter({ hasText: CI_ROW_PATTERN })
      .getByRole("checkbox");
    const selectable = Math.min(await checkboxes.count(), 2);
    for (let i = 0; i < selectable; i += 1) {
      await checkboxes.nth(i).check();
    }
    if (selectable > 0) {
      await page.getByRole("button", { name: /Archive selected/ }).click();
      await expect(page.getByRole("status").filter({ hasText: "Archived" })).toBeVisible();
    }

    // Delete-on-request purge: typed 8-char reference confirm.
    const purgeRow = page.getByRole("row").filter({ hasText: CI_ROW_PATTERN }).first();
    if ((await purgeRow.count()) > 0) {
      await purgeRow.getByRole("button", { name: "Purge" }).click();
      const dialog = page.getByRole("alertdialog");
      const dialogText = (await dialog.textContent()) ?? "";
      const ref = /ref\s+([a-f0-9]{8})/.exec(dialogText)?.[1];
      expect(ref, "purge dialog shows the 8-char reference").toBeTruthy();
      await dialog.getByLabel(new RegExp(`Type ${ref}`, "i")).fill(ref!);
      await dialog.getByRole("button", { name: "Delete permanently" }).click();
      await expect(page.getByRole("status").filter({ hasText: "deleted" })).toBeVisible();
    }
  });
});
