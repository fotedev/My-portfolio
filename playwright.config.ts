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
    // CI-only shared-secret gate for submit-inquiry-ci (fail-closed function
    // side): the header rides every context request, including the
    // cross-origin submit fetch. Supplied via env, never a NEXT_PUBLIC_ var —
    // it must not ship in the client bundle. Local E2E runs need
    // E2E_INQUIRY_CI_TOKEN in the environment (set in .env.local).
    ...(process.env.E2E_INQUIRY_CI_TOKEN
      ? { extraHTTPHeaders: { "x-ci-token": process.env.E2E_INQUIRY_CI_TOKEN } }
      : {}),
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
