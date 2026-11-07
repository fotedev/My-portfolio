import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** AR contact page: RTL rendering, native Arabic form flow, axe clean. */
test.describe("contact AR", () => {
  test("renders the RTL form and submits a valid inquiry", async ({ page }) => {
    await page.goto("/ar/contact");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await page.getByRole("textbox", { name: "الاسم" }).fill(`اختبار آلي ${Date.now()}`);
    await page.getByRole("textbox", { name: "البريد الإلكتروني" }).fill(`e2e-ar-${Date.now()}@example.com`);
    await page.getByLabel("ما الذي تحتاجه؟").selectOption("web-apps");
    await page
      .getByRole("textbox", { name: "الرسالة" })
      .fill("رسالة اختبار آلي لبيان عمل النموذج بالعربية؛ يمكن أرشفتها بعد التحقق.");
    // Deterministic: wait for the Turnstile token callback (single-use token).
    await page.waitForSelector('form[data-turnstile-ready="true"]', { timeout: 15_000 });
    await page.getByRole("button", { name: "أرسل الاستفسار" }).click();

    await expect(page.getByText("تم الحفظ — سأعود إليك")).toBeVisible({ timeout: 20_000 });
  });

  test("axe: zero critical or serious violations on /ar/contact", async ({ page }) => {
    await page.goto("/ar/contact");
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });
});
