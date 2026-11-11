// Detail captures: hero and OSS ledger at 1440px, both themes.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const outdir = process.argv[3] ?? ".zwork/shots-detail";
mkdirSync(outdir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const targets = [
  { name: "hero-dark", url: "/en", theme: "dark", selector: "section" },
  { name: "oss-dark", url: "/en", theme: "dark", selector: '[aria-labelledby="home-oss"]' },
  { name: "hero-ar-dark", url: "/ar", theme: "dark", selector: "section" },
  { name: "services-light", url: "/en", theme: "light", selector: '[aria-labelledby="home-services"]' },
  { name: "how-dark", url: "/en", theme: "dark", selector: '[aria-labelledby="home-how"]' },
  { name: "footer-dark", url: "/en", theme: "dark", selector: "footer" },
  { name: "footer-ar-dark", url: "/ar", theme: "dark", selector: "footer" },
  { name: "contact-page-light", url: "/en/contact", theme: "light", selector: ".container-reading" },
  { name: "contact-light", url: "/en", theme: "light", selector: '[aria-labelledby="home-contact"]' },
];

for (const target of targets) {
  await page.goto(base + target.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate((t) => localStorage.setItem("fotedev-theme", t), target.theme);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500); // fonts + hydration settle (Turnstile never idles)
  const el = page.locator(target.selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await el.screenshot({ path: `${outdir}/${target.name}.png` });
  console.log("captured", target.name);
}

await browser.close();
