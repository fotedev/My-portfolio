import { defineConfig, devices } from "@playwright/test";

/**
 * E2E for the contact slice (prompt-5 §7). Chromium only; workers are pinned
 * to 1 because the specs share the remote Edge Function's rate-limit windows
 * (net cap 3/10min per runner IP) — parallel writes would flake the 429 test.
 * `pnpm build` must run before the webServer starts.
 *
 * M6 spike: set PLAYWRIGHT_BASE_URL (e.g. the Netlify trial URL) to target a
 * remote deployment instead — the local webServer is then skipped entirely.
 */
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: "pnpm start",
          url: "http://localhost:3000/en",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
