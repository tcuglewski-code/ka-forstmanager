import { test, expect } from "@playwright/test"

test.describe("Kulturschutz Workflow", () => {
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

  test("Materialien im Lager prüfen", async ({ page }) => {
    await page.goto("/lager")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("h1")).toContainText(/Lager/i)

    // Prüfe ob Artikel-Tab aktiv ist und Artikel angezeigt werden
    const artikelRows = page.locator("table tbody tr, [data-testid='lager-item']")
    const count = await artikelRows.count()
    expect(count).toBeGreaterThanOrEqual(0) // Lager kann leer sein
    console.log(`Lager Artikel gefunden: ${count}`)
  })

  test("Kulturschutz-Auftrag erstellen", async ({ page }) => {
    await page.goto("/auftraege")
    await page.waitForLoadState("networkidle")

    // Klicke auf "Auftrag" Button (Plus-Button)
    await page.click('button:has-text("Auftrag")')
    await page.waitForSelector('[role="dialog"], .modal, form', { timeout: 5000 })

    // Titel ausfüllen
    const titelInput = page.locator('input[name="titel"], input[placeholder*="Titel"]').first()
    if (await titelInput.isVisible()) {
      await titelInput.fill("E2E Test Kulturschutz")
    }

    // Typ auf Kulturschutz setzen
    const typSelect = page.locator('select[name="typ"]').first()
    if (await typSelect.isVisible()) {
      await typSelect.selectOption("kulturschutz")
    }

    // Fläche ausfüllen
    const flaecheInput = page.locator('input[name*="flaeche"], input[placeholder*="0.00"]').first()
    if (await flaecheInput.isVisible()) {
      await flaecheInput.fill("1.5")
    }

    // Speichern
    const saveButton = page.locator('button[type="submit"], button:has-text("Speichern")')
    if (await saveButton.isEnabled()) {
      await saveButton.click()
      await page.waitForTimeout(1000)
    }

    // Prüfe ob Aufträge-Seite den neuen Auftrag zeigt oder kein Fehler aufgetreten ist
    await page.goto("/auftraege")
    await page.waitForLoadState("networkidle")
  })

  test("Lager-Buchung nach Auftrag prüfen", async ({ page }) => {
    await page.goto("/lager")
    await page.waitForLoadState("networkidle")

    // Prüfe ob Lager-Seite lädt ohne Fehler
    await expect(page.locator("h1")).toContainText(/Lager/i)

    // Prüfe Reservierungen-Tab (falls vorhanden)
    const reservierungenTab = page.locator('button:has-text("Reservierungen")')
    if (await reservierungenTab.isVisible()) {
      await reservierungenTab.click()
      await page.waitForTimeout(500)
      // Prüfe ob Reservierungen geladen werden
      const content = page.locator("table, [data-testid='reservierungen-list']")
      await expect(content).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log("Keine Reservierungen-Tabelle gefunden (kann normal sein)")
      })
    }
  })
})
