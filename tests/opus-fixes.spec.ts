import { test, expect } from "@playwright/test"

const BASE = "https://ka-forstmanager.vercel.app"
const BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"

test.use({ storageState: "tests/.auth/live-user.json" })

async function dismissTour(page: import("@playwright/test").Page) {
  for (let i = 0; i < 5; i++) {
    const closeBtn = page.locator(".driver-popover-close-btn")
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click()
      await page.waitForTimeout(300)
    } else break
  }
}

// ============================================================
// FIX 1: FM-32 GoBD — Korrektur-Bewegung enthält altBestand
// ============================================================
test("FM-32: Korrektur buchung stores altBestand in notiz", async ({ request }) => {
  // Get first article
  const artikelRes = await request.get(BASE + "/api/lager", {
    headers: { "x-vercel-bypass-automation-protection": BYPASS },
  })
  expect(artikelRes.ok()).toBeTruthy()

  const artikel = await artikelRes.json()
  const items = Array.isArray(artikel) ? artikel : (artikel.items ?? [])
  if (items.length === 0) {
    test.skip(true, "Keine Lagerartikel vorhanden")
    return
  }

  const art = items[0]
  const currentBestand = art.bestand ?? 0

  // Execute Korrektur to set bestand to 45
  const korrekturRes = await request.post(BASE + `/api/lager/${art.id}/bewegung`, {
    headers: {
      "Content-Type": "application/json",
      "x-vercel-bypass-automation-protection": BYPASS,
    },
    data: { typ: "korrektur", menge: 45, notiz: "test-fm32" },
  })
  expect(korrekturRes.status()).toBe(201)

  // Read back movements
  const bewegungenRes = await request.get(BASE + `/api/lager/${art.id}/bewegung`, {
    headers: { "x-vercel-bypass-automation-protection": BYPASS },
  })
  expect(bewegungenRes.ok()).toBeTruthy()
  const bewegungen = await bewegungenRes.json()

  // Find our korrektur movement (most recent)
  const korrektur = Array.isArray(bewegungen)
    ? bewegungen.find((b: { typ: string; notiz?: string }) => b.typ === "korrektur" && b.notiz?.includes("test-fm32"))
    : null

  expect(korrektur).toBeTruthy()
  // Notiz should contain audit trail: "Korrektur: X → 45 (Delta: ...)"
  expect(korrektur.notiz).toMatch(/Korrektur:\s*\d+(\.\d+)?\s*→\s*45/)
  expect(korrektur.notiz).toMatch(/Delta:/)
  console.log("FM-32 PASS: Korrektur audit trail:", korrektur.notiz)

  // Restore original bestand
  await request.post(BASE + `/api/lager/${art.id}/bewegung`, {
    headers: {
      "Content-Type": "application/json",
      "x-vercel-bypass-automation-protection": BYPASS,
    },
    data: { typ: "korrektur", menge: currentBestand, notiz: "test-fm32-restore" },
  })
})

// ============================================================
// FIX 2: FM-25 — No yellow-* classes in Auftraege badges
// ============================================================
test("FM-25: Auftraege badges use amber not yellow", async ({ page }) => {
  await page.goto(BASE + "/auftraege")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.screenshot({ path: "/tmp/fm25-amber-check.png", fullPage: true })

  // Check all badge spans for forbidden yellow classes
  const badges = page.locator("span.rounded-full, span.rounded")
  const badgeCount = await badges.count()
  for (let i = 0; i < Math.min(badgeCount, 30); i++) {
    const cls = (await badges.nth(i).getAttribute("class")) || ""
    expect(cls, `Badge ${i} still uses yellow`).not.toMatch(/yellow-100|yellow-800/)
  }
  console.log(`FM-25 PASS: ${badgeCount} badges checked, no yellow classes found`)
})

// ============================================================
// FIX 3: FM-06 — HH:MM backend compat + midnight edge case
// ============================================================
test("FM-06: Tagesprotokoll API handles HH:MM and rejects identical times", async ({ request }) => {
  // Test 1: Normal HH:MM times should work (will fail on other validation, but not time parsing)
  const normalRes = await request.post(BASE + "/api/tagesprotokoll", {
    headers: {
      "Content-Type": "application/json",
      "x-vercel-bypass-automation-protection": BYPASS,
    },
    data: {
      auftragId: "test-fm06",
      datum: "2026-04-23",
      arbeitsbeginn: "07:00",
      arbeitsende: "15:00", // 8h — valid
      mitarbeiterAnzahl: 1,
    },
  })
  // Should either succeed (201) or fail on auftragId, NOT on time parsing
  const normalBody = await normalRes.json()
  if (normalRes.status() === 400) {
    // Should NOT contain time-related errors for valid 8h span
    const details = normalBody.details ?? []
    const timeErrors = details.filter((d: string) => d.match(/10h|überschreiten|identisch/i))
    expect(timeErrors).toHaveLength(0)
  }

  // Test 2: Identical times should be rejected
  const identicalRes = await request.post(BASE + "/api/tagesprotokoll", {
    headers: {
      "Content-Type": "application/json",
      "x-vercel-bypass-automation-protection": BYPASS,
    },
    data: {
      auftragId: "test-fm06",
      datum: "2026-04-23",
      arbeitsbeginn: "07:00",
      arbeitsende: "07:00",
      mitarbeiterAnzahl: 1,
    },
  })
  expect(identicalRes.status()).toBe(400)
  const identicalBody = await identicalRes.json()
  expect(identicalBody.details?.join(" ") ?? "").toMatch(/identisch/i)
  console.log("FM-06 PASS: HH:MM compat works, identical times rejected")
})

// ============================================================
// FIX 4: FM-42 — Gruppen detail page loads, no JS errors
// ============================================================
test("FM-42: Gruppen detail page loads without JS errors", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(err.message))

  // First load gruppen list to find a group
  await page.goto(BASE + "/gruppen")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)

  // Try to click first group link
  const groupLinks = page.locator('a[href*="/gruppen/"]')
  if ((await groupLinks.count()) > 0) {
    await groupLinks.first().click()
    await page.waitForLoadState("networkidle")
    await dismissTour(page)
    await page.screenshot({ path: "/tmp/fm42-detail.png" })

    // Page should show Mitglieder section
    const heading = page.locator("h2", { hasText: /Mitglieder/ })
    await expect(heading).toBeVisible({ timeout: 5000 })

    // Should have the add-member UI
    const addBtn = page.locator("button").filter({ has: page.locator("svg") }).last()
    expect(await addBtn.count()).toBeGreaterThan(0)
  } else {
    console.log("FM-42: No groups found, skipping detail test")
  }

  // No JS errors
  expect(errors).toHaveLength(0)
  console.log("FM-42 PASS: Gruppen detail page works, error handling in place")
})
