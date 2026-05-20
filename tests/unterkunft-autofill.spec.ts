import { test, expect } from "@playwright/test"

// Verify: wizardDaten auto-fill + Radius dropdown in Unterkunft search panel
const BASE = "https://ka-forstmanager.vercel.app"
// Auftrag mit wizardDaten.flaeche_forstamt = 'Bottendorf'
const AUFTRAG_ID = "cmnch041i00000al1f5cfck50"

test.describe("Unterkunft v2.1 — wizardDaten autofill + radius", () => {
  test.use({ storageState: "tests/.auth/live-user.json" })

  test("Ort-Feld autofilled aus wizardDaten + Radius default 30km", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/${AUFTRAG_ID}`)
    await page.waitForLoadState("networkidle")

    // Ort-Feld in der Unterkunft-Search-Panel
    // input mit placeholder "z.B. Eberswalde"
    const ortInput = page.locator('input[placeholder*="Eberswalde"]').first()
    await expect(ortInput).toBeVisible({ timeout: 15000 })
    const ortValue = await ortInput.inputValue()
    console.log("Ort-Feld value:", JSON.stringify(ortValue))
    expect(ortValue.length, "ort sollte nicht leer sein").toBeGreaterThan(0)
    expect(ortValue.toLowerCase()).toContain("bottendorf")

    // Radius-Dropdown
    const radiusSelect = page.locator('select').filter({ hasText: /10km|30km/ }).first()
    await expect(radiusSelect).toBeVisible()
    const radiusValue = await radiusSelect.inputValue()
    expect(radiusValue).toBe("30km")

    // Booking-URL enthält radius=30
    const bookingBtn = page.locator('a:has-text("Booking.com suchen")').first()
    const bookingHref = await bookingBtn.getAttribute("href")
    expect(bookingHref).toContain("radius=30")
    expect(bookingHref?.toLowerCase()).toContain("bottendorf")

    await page.screenshot({ path: "/tmp/unterkunft-ort.png", fullPage: false })
  })
})
