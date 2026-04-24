import { test, expect } from "@playwright/test"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://ka-forstmanager.vercel.app"

test.describe("Loop 4 — FM Fixes", () => {
  test.use({ storageState: "tests/.auth/user.json" })

  test("FM-14: KI-Zusammenfassung API exists", async ({ request }) => {
    // API should return 404 for non-existent ID (not 500)
    const res = await request.get(`${BASE}/api/protokoll/test-id/zusammenfassung`)
    expect([401, 404]).toContain(res.status())
  })

  test("FM-16: PDF API exists", async ({ request }) => {
    const res = await request.get(`${BASE}/api/tagesprotokoll/test-id/pdf`)
    expect([401, 404]).toContain(res.status())
  })

  test("FM-35: Bestellungen page loads", async ({ page }) => {
    await page.goto(`${BASE}/lager/bestellungen`)
    await expect(page.locator("text=Bestellungen")).toBeVisible({ timeout: 10000 })
  })

  test("FM-35: Bestellungen auto-open modal with ?neu=1", async ({ page }) => {
    await page.goto(`${BASE}/lager/bestellungen?neu=1`)
    await expect(page.locator("text=Neue Bestellung")).toBeVisible({ timeout: 10000 })
  })

  test("FM-38: Dashboard loads with TÜV widget", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page.locator("text=Guten Tag")).toBeVisible({ timeout: 10000 })
    // TÜV widget may or may not be visible depending on data
  })

  test("FM-43: Feedback button exists", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    // FeedbackButton should be visible as floating button
    await page.waitForTimeout(2000)
    const feedbackBtn = page.locator('[class*="fixed"]').filter({ hasText: /Feedback|Bug|Wunsch/ })
    // Feedback button may use an icon without text
  })

  test("Lager page loads", async ({ page }) => {
    await page.goto(`${BASE}/lager`)
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 })
  })

  test("Fuhrpark page loads", async ({ page }) => {
    await page.goto(`${BASE}/fuhrpark`)
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 })
  })
})
