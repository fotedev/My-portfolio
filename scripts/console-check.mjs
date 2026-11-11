// Console sanity check: load public pages, collect console errors/warnings
// and CSP violation reports. Usage: node scripts/console-check.mjs [baseURL]
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage();

const messages = [];
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    messages.push(`[${msg.type()}] ${msg.text()}`);
  }
});
page.on("pageerror", (err) => {
  messages.push(`[pageerror] ${err.message}`);
});

for (const url of ["/en", "/ar", "/en/services", "/en/projects"]) {
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
}

if (messages.length === 0) {
  console.log("CLEAN — no console errors or warnings on", base);
} else {
  console.log(messages.join("\n"));
}

await browser.close();
