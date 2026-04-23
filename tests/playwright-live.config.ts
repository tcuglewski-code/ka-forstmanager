import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "https://ka-forstmanager.vercel.app",
    extraHTTPHeaders: {
      "x-vercel-bypass-automation-protection":
        "rpFNEmGS7CB0FunapN20rLGDCG0foMzx",
    },
    screenshot: "on",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "setup-live",
      testMatch: "live-auth.setup.ts",
    },
    {
      name: "live-chromium",
      use: { browserName: "chromium" },
      dependencies: ["setup-live"],
    },
  ],
})
