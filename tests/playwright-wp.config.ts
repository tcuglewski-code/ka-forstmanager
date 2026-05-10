import { defineConfig, devices } from "@playwright/test"

// Config for testing WP wizard pages (no auth required)
export default defineConfig({
  testDir: ".",
  testMatch: "wp-wizard*.spec.ts",
  workers: 1,
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: "https://peru-otter-113714.hostingersite.com",
    screenshot: "on",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium-wp",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-wp",
      use: { ...devices["iPhone 12"] },
    },
  ],
})
