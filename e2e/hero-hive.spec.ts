import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * The hero lattice (ADR-0010): a decorative WebGL layer behind the hero.
 *
 * The layer must never be load-bearing. It is aria-hidden, it cannot receive
 * pointer events, and if WebGL is unavailable the hero renders exactly as it
 * did before. These assertions hold the whole feature to that rule.
 */

const GL_DRIVER_WARNING = /GL Driver Message|GPU stall|WebGL-0x/i;

/** Whether this browser can give us a WebGL context at all. */
async function hasWebGL(page: import("@playwright/test").Page): Promise<boolean> {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  });
}

test.describe("hero lattice", () => {
  test("renders behind the hero, hidden from assistive technology", async ({ page }) => {
    await page.goto("/en");

    const layer = page.locator(".hero-hive");
    await expect(layer).toHaveCount(1);
    await expect(layer).toHaveAttribute("aria-hidden", "true");

    // The layer can never intercept a click meant for the hero content.
    const pointerEvents = await layer.evaluate(
      (element) => getComputedStyle(element).pointerEvents,
    );
    expect(pointerEvents).toBe("none");
  });

  test("does not block the hero content", async ({ page }) => {
    await page.goto("/en");

    // The primary CTA must be clickable through the canvas layer.
    await page.getByRole("link", { name: "Discuss your project" }).click();
    await expect(page).toHaveURL(/\/en\/contact/);
  });

  test("mounts a WebGL canvas without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      // Headless Chromium emits GL driver diagnostics on some machines; they
      // are not application errors.
      if (GL_DRIVER_WARNING.test(message.text())) return;
      errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/en");
    await page.waitForTimeout(2500);

    // Where WebGL is unavailable the documented fallback is to remove the
    // canvas entirely (ADR-0010 section 5), so its absence is a pass, not a
    // failure. What must never happen is an error either way.
    if (await hasWebGL(page)) {
      await expect(page.locator(".hero-hive__canvas")).toHaveCount(1);
    }
    expect(errors).toEqual([]);
  });

  test("renders a static frame under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    await page.waitForTimeout(1500);

    if (!(await hasWebGL(page))) return;

    const canvas = page.locator(".hero-hive__canvas");
    await expect(canvas).toHaveCount(1);

    // The renderer publishes its frame count on the canvas. Under reduced
    // motion it must stop at the single static frame it drew on mount.
    //
    // Comparing rendered pixels instead would be unreliable - GPU
    // rasterisation is not bit-identical between frames, so two captures of
    // the same static scene can still differ.
    const frames = async (): Promise<number> => {
      const raw = await canvas.getAttribute("data-hive-frames");
      return Number.parseInt(raw ?? "0", 10) || 0;
    };

    const first = await frames();
    await page.waitForTimeout(1200);
    const second = await frames();

    expect(first).toBeGreaterThan(0);
    expect(second).toBe(first);
  });

  test("animates when motion is allowed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");
    await page.waitForTimeout(1500);

    if (!(await hasWebGL(page))) return;

    const canvas = page.locator(".hero-hive__canvas");
    const frames = async (): Promise<number> => {
      const raw = await canvas.getAttribute("data-hive-frames");
      return Number.parseInt(raw ?? "0", 10) || 0;
    };

    const first = await frames();
    await page.waitForTimeout(1200);
    const second = await frames();

    expect(second).toBeGreaterThan(first);
  });

  test("introduces no accessibility violations of its own", async ({ page }) => {
    // The page has pre-existing violations unrelated to this feature (the
    // warning status pill's contrast and the copy-email button's label-in-name
    // mismatch - both present with the layer disabled too). This asserts the
    // layer itself adds nothing: no violation may target the canvas.
    for (const locale of ["/en", "/ar"]) {
      await page.goto(locale);
      await page.waitForTimeout(1200);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const fromTheLayer = results.violations.flatMap((violation) =>
        violation.nodes
          .filter((node) => node.target.join(" ").includes(".hero-hive"))
          .map((node) => `${violation.id}: ${node.target.join(" ")}`),
      );

      expect(fromTheLayer, `${locale}`).toEqual([]);
    }
  });
});
