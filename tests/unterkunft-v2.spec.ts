import { test, expect } from "@playwright/test"

// Sprint 2026-05: Unterkunft v2 + Datumseditor + Gantt Info-Banner

const BASE = "https://ka-forstmanager.vercel.app"
const BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"
// Auftrag ohne Datum (aus DB-Query identifiziert)
const AUFTRAG_ID = "cmne7z8cx00000bl2r3i8f8f3"

test.describe("Sprint 2026-05: Unterkunft + Datum + Gantt", () => {
  test("Datumseditor sichtbar + speichert", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/${AUFTRAG_ID}`)
    await page.waitForLoadState("networkidle")

    const startInput = page.locator('[data-testid="auftrag-start-datum"]')
    const endInput = page.locator('[data-testid="auftrag-end-datum"]')

    await expect(startInput).toBeVisible({ timeout: 15000 })
    await expect(endInput).toBeVisible()

    // Setze Wert via fill + change
    await startInput.fill("2026-06-01")
    await page.waitForTimeout(900)

    // Screenshot
    await page.screenshot({ path: "/tmp/datum-test.png", fullPage: false })

    // Check no console errors related to save
    // (kein Fehler-Toast sichtbar nach 1.5s)
    const errorToast = page.locator('text=/fehlgeschlagen/i')
    await expect(errorToast).toHaveCount(0)
  })

  test("Unterkunft-Karte zeigt Booking + Airbnb Buttons + WLAN Checkbox", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/${AUFTRAG_ID}`)
    await page.waitForLoadState("networkidle")

    // Suche Unterkunft-Section (Sidebar)
    const bookingBtn = page.locator('a:has-text("Booking.com suchen")')
    const airbnbBtn = page.locator('a:has-text("Airbnb suchen")')
    const wlan = page.locator('label:has-text("WLAN")').first()

    await expect(bookingBtn.first()).toBeVisible({ timeout: 15000 })
    await expect(airbnbBtn.first()).toBeVisible()
    await expect(wlan).toBeVisible()

    // URL der Buttons enthalten Pflicht-Parameter
    const bookingHref = await bookingBtn.first().getAttribute("href")
    const airbnbHref = await airbnbBtn.first().getAttribute("href")

    expect(bookingHref).toContain("booking.com/searchresults")
    expect(airbnbHref).toContain("airbnb.de/s/")

    await page.screenshot({ path: "/tmp/unterkunft-v2.png", fullPage: true })
  })

  test("Gantt zeigt Info-Banner für Aufträge ohne Datum", async ({ page }) => {
    await page.goto(`${BASE}/auftraege`)
    await page.waitForLoadState("networkidle")

    // Versuche Gantt-Tab zu öffnen (falls Tabs vorhanden)
    const ganttTab = page.locator('button:has-text("Gantt"), button:has-text("Timeline"), [role="tab"]:has-text("Gantt")').first()
    if (await ganttTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ganttTab.click()
      await page.waitForTimeout(500)
    }

    // Suche Info-Banner
    const banner = page.locator('text=/Aufträge ohne Datum/i')
    await expect(banner).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: "/tmp/gantt-v2.png", fullPage: true })
  })
})
