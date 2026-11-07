import { defineConfig, devices } from "@playwright/test";

/**
 * E2E for the contact slice (prompt-5 §7). Chromium only; workers are pinned
 * to 1 because the specs share the remote Edge Function's rate-limit windows
 * (net cap 3/10min per runner IP) — parallel writes would flake the 429 test.
 * `pnpm build` must run before the webServer starts.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/en",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
