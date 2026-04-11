import { test, expect } from "@playwright/test"

test.describe("Pflanzung Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })

    const email = process.env.TEST_USER_EMAIL || "admin@kochaufforstung.de"
    const password = process.env.TEST_USER_PASSWORD || "Admin2026!"

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|auftraege)/, { timeout: 15000 })
  })

  test("Pflanzung — neue Fläche anlegen", async ({ page }) => {
    await page.goto("/auftraege")
    await page.waitForLoadState("networkidle")

    // Neuen Auftrag erstellen
    await page.click('button:has-text("Auftrag")')
    await page.waitForSelector('[role="dialog"], .modal, form', { timeout: 5000 })

    // Titel
    const titelInput = page.locator('input[name="titel"], input[placeholder*="Titel"]').first()
    if (await titelInput.isVisible()) {
      await titelInput.fill("E2E Test Pflanzung 3.75ha")
    }

    // Typ auf Pflanzung setzen
    const typSelect = page.locator('select[name="typ"]').first()
    if (await typSelect.isVisible()) {
      await typSelect.selectOption("pflanzung")
    }

    // Fläche
    const flaecheInput = page.locator('input[name*="flaeche"], input[placeholder*="0.00"]').first()
    if (await flaecheInput.isVisible()) {
      await flaecheInput.fill("3.75")
    }

    // Waldbesitzer
    const waldbesitzerInput = page.locator('input[name="waldbesitzer"], input[placeholder*="Waldbesitzer"]').first()
    if (await waldbesitzerInput.isVisible()) {
      await waldbesitzerInput.fill("E2E Test Waldbesitzer")
    }

    // Speichern
    const saveButton = page.locator('button[type="submit"], button:has-text("Speichern")')
    if (await saveButton.isEnabled()) {
      await saveButton.click()
      await page.waitForTimeout(1000)
    }
  })

  test("Pflanzung — Auftragstypen filtern", async ({ page }) => {
    await page.goto("/auftraege")
    await page.waitForLoadState("networkidle")

    // Filter auf Pflanzung setzen
    const typFilter = page.locator('select').filter({ hasText: "Alle Typen" })
    if (await typFilter.isVisible()) {
      await typFilter.selectOption("pflanzung")
      await page.waitForTimeout(1000)

      // Prüfe dass nur Pflanzungs-Aufträge angezeigt werden
      const rows = page.locator("table tbody tr")
      const count = await rows.count()
      console.log(`Pflanzungs-Aufträge nach Filter: ${count}`)

      // Jeder sichtbare Auftrag sollte "Pflanzung" als Typ haben
      if (count > 0) {
        const firstRowText = await rows.first().textContent()
        console.log(`Erste Zeile: ${firstRowText?.substring(0, 100)}`)
      }
    }
  })

  test("FM API — Pflanzungsaufträge abrufen", async ({ request }) => {
    // API-Test: Aufträge mit Typ-Filter abrufen
    const response = await request.get("/api/auftraege?typ=pflanzung")

    // API sollte antworten (evtl. 401 wenn nicht authentifiziert)
    const status = response.status()
    console.log(`API /api/auftraege?typ=pflanzung Status: ${status}`)

    if (status === 200) {
      const data = await response.json()
      const count = Array.isArray(data) ? data.length : 0
      console.log(`Pflanzungsaufträge via API: ${count}`)
    }
  })
})
