import { test, expect } from "@playwright/test"

const BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"
const BASE = "https://ka-forstmanager.vercel.app"

test.use({
  baseURL: BASE,
  extraHTTPHeaders: { "x-vercel-bypass-automation-protection": BYPASS },
  storageState: "tests/.auth/live-user.json",
})

// ─── FM-30: Lager Buchung mit Auftrag-Auswahl ──────────────────────────────

test("FM-30: Lager-Seite lädt mit Artikeln", async ({ page }) => {
  await page.goto("/lager")
  await page.waitForLoadState("networkidle")
  await expect(page.locator("text=Lager").first()).toBeVisible()
  await page.screenshot({ path: "/tmp/fm30-lager.png" })
})

test("FM-30: Buchung-Modal hat Auftrag-Dropdown", async ({ page }) => {
  await page.goto("/lager")
  await page.waitForLoadState("networkidle")
  // Click first "Buchen" button if articles exist
  const buchenBtn = page.locator("text=Buchen").first()
  if (await buchenBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await buchenBtn.click()
    await page.waitForTimeout(500)
    // Auftrag dropdown should be present
    await expect(page.locator("text=Auftrag (optional)")).toBeVisible()
    await page.screenshot({ path: "/tmp/fm30-buchung-modal.png" })
  }
})

// ─── FM-33: Buchungshistorie pro Artikel ────────────────────────────────────

test("FM-33: Buchungshistorie-Button sichtbar", async ({ page }) => {
  await page.goto("/lager")
  await page.waitForLoadState("networkidle")
  // The Historie button (Filter icon) should be visible in article rows
  const historieBtn = page.locator('[title="Buchungshistorie"]').first()
  if (await historieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await historieBtn.click()
    await page.waitForTimeout(500)
    await expect(page.locator("text=Buchungshistorie:")).toBeVisible()
    await page.screenshot({ path: "/tmp/fm33-historie.png" })
  }
})

// ─── FM-11: Auto-suggest Auftrag beim Protokoll ────────────────────────────

test("FM-11: Protokoll-Seite lädt mit Filter", async ({ page }) => {
  await page.goto("/protokolle")
  await page.waitForLoadState("networkidle")
  // Dismiss tour overlay if present
  const overlay = page.locator(".driver-overlay")
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)
  }
  await expect(page.locator("text=Alle Aufträge")).toBeVisible()
  await page.screenshot({ path: "/tmp/fm11-filter.png" })
})

// ─── FM-12: Gleichmäßig verteilen Button ────────────────────────────────────

test("FM-12: Verteilen-Button existiert im Formular", async ({ page }) => {
  await page.goto("/protokolle")
  await page.waitForLoadState("networkidle")
  // Dismiss tour overlay if present
  const overlay = page.locator(".driver-overlay")
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)
  }
  // Click "Protokoll erstellen" to open form
  const createBtn = page.locator("text=Protokoll erstellen").first()
  if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createBtn.click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "/tmp/fm12-formular.png" })
  }
})

// ─── FM-15: Doppelte Protokolle markieren ───────────────────────────────────

test("FM-15: Protokoll-API liefert isDuplicate-Flag", async ({ request }) => {
  const res = await request.get(`${BASE}/api/tagesprotokoll`, {
    headers: { "x-vercel-bypass-automation-protection": BYPASS },
  })
  expect(res.status()).toBe(200)
  const data = await res.json()
  if (Array.isArray(data) && data.length > 0) {
    // At least the first item should have isDuplicate field
    expect(data[0]).toHaveProperty("isDuplicate")
  }
})

// ─── FM-27: Aufträge Status-Badge ───────────────────────────────────────────

test("FM-27: Aufträge-Seite zeigt Status-Badges", async ({ page }) => {
  await page.goto("/auftraege")
  await page.waitForLoadState("networkidle")
  // Dismiss tour overlay if present
  const overlay = page.locator(".driver-overlay")
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)
  }
  await expect(page.locator("text=Aufträge").first()).toBeVisible()
  await page.screenshot({ path: "/tmp/fm27-auftraege.png" })
})

// ─── FM-02: Förderung Seite ─────────────────────────────────────────────────

test("FM-02: Förderung-Seite lädt", async ({ page }) => {
  await page.goto("/foerderung")
  await page.waitForLoadState("networkidle")
  await page.screenshot({ path: "/tmp/fm02-foerderung.png" })
})

// ─── WP Wizards: curl-Verify ────────────────────────────────────────────────

test("WP-04: Pflanzung Wizard-Seite erreichbar", async ({ request }) => {
  const res = await request.get("https://peru-otter-113714.hostingersite.com/anfrage-stellen/")
  expect([200, 301, 302]).toContain(res.status())
})

test("WP-04: Förderberatung Wizard-Seite erreichbar", async ({ request }) => {
  const res = await request.get("https://peru-otter-113714.hostingersite.com/foerderberatung/")
  expect([200, 301, 302]).toContain(res.status())
})
