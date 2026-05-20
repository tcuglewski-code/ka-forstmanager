import { test, expect } from "@playwright/test"

// Sprint 2026-05: Unterkunft v2 + Forstarbeiter-Filter + GPS-basierte Suche
// + Booking.com Location-Fix

const BASE = "https://ka-forstmanager.vercel.app"
// Auftrag mit lat/lng (aus DB-Query identifiziert)
const AUFTRAG_MIT_GPS = "cmnizutvz00000al13o1o7wdh" // lat: 51.026892, lng: 8.809518
const AUFTRAG_OHNE_DATUM = "cmne7z8cx00000bl2r3i8f8f3"

test.describe("Sprint 2026-05: Unterkunft + Datum + Gantt", () => {
  test("Datumseditor sichtbar + speichert", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/${AUFTRAG_OHNE_DATUM}`)
    await page.waitForLoadState("networkidle")

    const startInput = page.locator('[data-testid="auftrag-start-datum"]')
    const endInput = page.locator('[data-testid="auftrag-end-datum"]')

    await expect(startInput).toBeVisible({ timeout: 15000 })
    await expect(endInput).toBeVisible()

    await startInput.fill("2026-06-01")
    await page.waitForTimeout(900)

    await page.screenshot({ path: "/tmp/datum-test.png", fullPage: false })

    const errorToast = page.locator('text=/fehlgeschlagen/i')
    await expect(errorToast).toHaveCount(0)
  })

  test("Unterkunft-Karte: Forstarbeiter-Filter (Waschmaschine statt Küche)", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/${AUFTRAG_MIT_GPS}`)
    await page.waitForLoadState("networkidle")

    const bookingBtn = page.locator('a:has-text("Booking.com suchen")')
    const airbnbBtn = page.locator('a:has-text("Airbnb suchen")')

    await expect(bookingBtn.first()).toBeVisible({ timeout: 15000 })
    await expect(airbnbBtn.first()).toBeVisible()

    // Waschmaschine ist sichtbar (Forstarbeiter-Filter)
    const waschmaschine = page.locator('label:has-text("Waschmaschine")').first()
    await expect(waschmaschine).toBeVisible()

    // Trailer-Stellplatz ersetzt Küche
    const trailer = page.locator('label:has-text("Trailer")').first()
    await expect(trailer).toBeVisible()

    // Früher Check-in ersetzt Frühstück
    const checkin = page.locator('label:has-text("Früher Check-in")').first()
    await expect(checkin).toBeVisible()

    // Küche und Frühstück sind NICHT mehr im Filter-Bereich sichtbar
    // (Filter-Panel hat keinen "Küche" Checkbox-Label)
    const filterPanel = page.locator('text="Ausstattung (Filter)"').locator("..")
    if (await filterPanel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(filterPanel.locator('label:has-text("Küche")')).toHaveCount(0)
      await expect(filterPanel.locator('label:has-text("Frühstück")')).toHaveCount(0)
    }
  })

  test("Booking.com Link enthält GPS-Koordinaten wenn lat/lng vorhanden", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/${AUFTRAG_MIT_GPS}`)
    await page.waitForLoadState("networkidle")

    const bookingBtn = page.locator('a:has-text("Booking.com suchen")').first()
    await expect(bookingBtn).toBeVisible({ timeout: 15000 })

    const bookingHref = await bookingBtn.getAttribute("href")
    expect(bookingHref).toContain("booking.com/searchresults")
    // GPS-basierte Suche (latitude/longitude), nicht ss=Ortsname
    expect(bookingHref).toContain("latitude=51.026892")
    expect(bookingHref).toContain("longitude=8.809518")
    expect(bookingHref).toContain("radius=")

    // Airbnb-Link nutzt GPS-Bounding-Box
    const airbnbHref = await page.locator('a:has-text("Airbnb suchen")').first().getAttribute("href")
    expect(airbnbHref).toContain("airbnb.de/s/")
    expect(airbnbHref).toContain("sw_lat=")
    expect(airbnbHref).toContain("ne_lng=")

    await page.screenshot({ path: "/tmp/unterkunft-final.png", fullPage: true })
  })

  test("Gantt zeigt Info-Banner für Aufträge ohne Datum", async ({ page }) => {
    await page.goto(`${BASE}/auftraege`)
    await page.waitForLoadState("networkidle")

    const ganttTab = page.locator('button:has-text("Gantt"), button:has-text("Timeline"), [role="tab"]:has-text("Gantt")').first()
    if (await ganttTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ganttTab.click()
      await page.waitForTimeout(500)
    }

    const banner = page.locator('text=/Aufträge ohne Datum/i')
    await expect(banner).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: "/tmp/gantt-v2.png", fullPage: true })
  })
})
