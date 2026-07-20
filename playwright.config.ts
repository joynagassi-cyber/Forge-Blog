import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.CI ? 3000 : 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [process.env.CI ? "github" : "list"],
    ["html", { outputFolder: "e2e-report" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: "pnpm build && pnpm start",
        port: PORT,
        reuseExistingServer: false,
      }
    : {
        command: "pnpm dev",
        port: PORT,
        reuseExistingServer: true,
      },
});
