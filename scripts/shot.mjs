// Temporary visual QA helper: full-page screenshots of public routes.
// Usage: node scripts/shot.mjs [baseURL] [outdir]
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const outdir = process.argv[3] ?? ".zwork/shots";
mkdirSync(outdir, { recursive: true });

/** Persist a theme override so a reload renders in the wanted theme. */
async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("fotedev-theme", t);
  }, theme);
}

const shots = [
  { name: "en-dark", url: "/en", theme: "dark" },
  { name: "en-light", url: "/en", theme: "light" },
  { name: "ar-dark", url: "/ar", theme: "dark" },
  { name: "services-light", url: "/en/services", theme: "light" },
  { name: "projects-dark", url: "/en/projects", theme: "dark" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

for (const shot of shots) {
  await page.goto(base + shot.url, { waitUntil: "networkidle" });
  await setTheme(page, shot.theme);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600); // settle reveals
  await page.screenshot({ path: `${outdir}/${shot.name}.png`, fullPage: true });
  console.log("captured", shot.name);
}

// Mobile pass on the home page, both locales.
for (const [name, url] of [["en-dark-mobile", "/en"], ["ar-dark-mobile", "/ar"]]) {
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(base + url, { waitUntil: "networkidle" });
  await mob.waitForTimeout(600);
  await mob.screenshot({ path: `${outdir}/${name}.png`, fullPage: true });
  await mob.close();
  console.log("captured", name);
}

await browser.close();
