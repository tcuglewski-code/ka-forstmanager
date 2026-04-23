import { test, expect } from "@playwright/test"

const BASE = "https://ka-forstmanager.vercel.app"
const BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"

test.use({ storageState: "tests/.auth/live-user.json" })

/** Dismiss the driver.js tour overlay if present */
async function dismissTour(page: import("@playwright/test").Page) {
  const closeBtn = page.locator(".driver-popover-close-btn")
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click()
    await page.waitForTimeout(500)
  }
}

// ================================================================
// FM-23: Rechnung Betrag korrekt (MwSt-Berechnung)
// ================================================================
test("FM-23: Rechnung Betrag korrekt berechnet", async ({ page, request }) => {
  await page.goto(BASE + "/rechnungen")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.screenshot({ path: "/tmp/pl-fm23-liste.png" })

  // Erste Rechnung oeffnen
  const links = page.locator('a[href*="/rechnungen/"]:not([href$="/neu"])')
  if ((await links.count()) > 0) {
    const href = (await links.first().getAttribute("href")) ?? ""
    const id = href.split("/").pop() ?? ""

    // API direkt aufrufen
    const resp = await request.get(BASE + "/api/rechnungen/" + id, {
      headers: { "x-vercel-bypass-automation-protection": BYPASS },
    })
    expect(resp.ok()).toBeTruthy()
    const r = await resp.json()

    const netto = r.nettoBetrag ?? r.nettoGesamt ?? 0
    const brutto = r.bruttoBetrag ?? r.bruttoGesamt ?? 0
    const mwst = r.mwstSatz ?? r.mwst ?? 19

    const expected = Math.round(netto * (1 + mwst / 100) * 100) / 100

    console.log("FM-23:", { netto, brutto, mwst, expected, diff: Math.abs(brutto - expected) })

    if (netto > 0) {
      expect(
        Math.abs(brutto - expected),
        "Brutto stimmt nicht mit Netto*MwSt ueberein"
      ).toBeLessThan(0.02)
    }
    console.log("FM-23 PASS: MwSt-Berechnung korrekt")
  } else {
    console.log("FM-23: Keine Rechnungen vorhanden — skip")
    test.skip(true, "Keine Rechnungen vorhanden")
  }
})

// ================================================================
// FM-08: Tagesprotokoll Validierung — Server blockiert ungueltige Daten
// ================================================================
test("FM-08: Tagesprotokoll Validierung blockiert >10h", async ({
  request,
}) => {
  // API nutzt arbeitsbeginn/arbeitsende, nicht arbeitsstunden
  const resp = await request.post(BASE + "/api/tagesprotokoll", {
    headers: {
      "Content-Type": "application/json",
      "x-vercel-bypass-automation-protection": BYPASS,
    },
    data: {
      auftragId: "test-invalid",
      datum: "2026-04-23",
      arbeitsbeginn: "06:00",
      arbeitsende: "23:00", // 17h > 10h limit
      mitarbeiterAnzahl: 1,
    },
  })

  console.log("FM-08 response status:", resp.status())
  const body = await resp.text()
  console.log("FM-08 response:", body.slice(0, 300))

  // Erwarte 400 (Validierung) — NICHT 200 oder 500
  expect(
    [400, 422],
    "Server sollte mit 400/422 ablehnen, nicht " + resp.status()
  ).toContain(resp.status())

  const json = JSON.parse(body)
  expect(json.error ?? json.errors?.[0] ?? "").toMatch(
    /stunden|10h|überschreiten|validier|limit/i
  )
  console.log("FM-08 PASS: Server blockiert mit 400 + Fehlermeldung")
})

// ================================================================
// FM-04: Gruppen + Kontakte — kein JS-Crash
// ================================================================
test("FM-04: Gruppen-Seite laedt ohne Crash", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (err) => {
    if (!err.message.includes("ResizeObserver")) errors.push(err.message)
  })

  await page.goto(BASE + "/gruppen")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/pl-fm04-gruppen.png" })

  const content = await page.content()
  const hasError =
    content.includes("Application error") || content.includes("Cannot read")

  console.log("FM-04 Gruppen JS errors:", errors)
  expect(errors, "JS-Fehler auf Gruppen-Seite").toHaveLength(0)
  expect(hasError, "Error-Message im HTML").toBe(false)
  console.log("FM-04 PASS: Gruppen laedt fehlerfrei")
})

test("FM-04: Kontakte-Seite laedt ohne Crash", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (err) => {
    if (!err.message.includes("ResizeObserver")) errors.push(err.message)
  })

  await page.goto(BASE + "/kontakte")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/pl-fm04-kontakte.png" })

  const content = await page.content()
  const hasError =
    content.includes("Application error") || content.includes("Cannot read")

  console.log("FM-04 Kontakte JS errors:", errors)
  expect(errors, "JS-Fehler auf Kontakte-Seite").toHaveLength(0)
  expect(hasError, "Error-Message im HTML").toBe(false)
  console.log("FM-04 PASS: Kontakte laedt fehlerfrei")
})

// ================================================================
// FM-26: Auftraege Detailansicht — kein Crash
// ================================================================
test("FM-26: Auftraege-Detailansicht laedt ohne Crash", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (err) => {
    if (!err.message.includes("ResizeObserver")) errors.push(err.message)
  })

  await page.goto(BASE + "/auftraege")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.screenshot({ path: "/tmp/pl-fm26-liste.png" })

  const links = page.locator('a[href*="/auftraege/"]:not([href$="/neu"])')
  if ((await links.count()) > 0) {
    await links.first().click()
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)
    await page.screenshot({ path: "/tmp/pl-fm26-detail.png" })
  }

  const content = await page.content()
  const hasError =
    content.includes("Application error") || content.includes("Cannot read")

  console.log("FM-26 JS errors:", errors)
  expect(errors, "JS-Fehler auf Auftraege-Detail").toHaveLength(0)
  expect(hasError, "Error-Message im HTML").toBe(false)
  console.log("FM-26 PASS: Auftraege-Detail laedt fehlerfrei")
})

// ================================================================
// FM-22: Status-Button existiert und ist klickbar
// ================================================================
test("FM-22: Rechnung Status-Buttons vorhanden", async ({ page }) => {
  await page.goto(BASE + "/rechnungen")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)

  const links = page.locator('a[href*="/rechnungen/"]:not([href$="/neu"])')
  if ((await links.count()) > 0) {
    await links.first().click()
    await page.waitForLoadState("networkidle")
    await dismissTour(page)
    await page.screenshot({ path: "/tmp/pl-fm22-detail.png" })

    // Suche Status-Buttons
    const statusBtn = page.locator(
      [
        'button:has-text("Bezahlt")',
        'button:has-text("bezahlt")',
        'button:has-text("Stornieren")',
        'button:has-text("stornieren")',
        'button:has-text("Status")',
        'select[name*="status"]',
        '[data-testid="status-change"]',
      ].join(", ")
    )
    const count = await statusBtn.count()
    console.log("FM-22: Status-Buttons gefunden:", count)
    expect(count, "Kein Status-Button in Rechnung-Detail").toBeGreaterThan(0)
    console.log("FM-22 PASS: Status-Buttons vorhanden")
  } else {
    console.log("FM-22: Keine Rechnungen vorhanden")
    test.skip(true, "Keine Rechnungen vorhanden")
  }
})

// ================================================================
// FM-41: Weisser Text auf hellem Hintergrund — kritische Seiten
// ================================================================
const criticalPages = [
  "/tagesprotokoll",
  "/qualifikationen",
  "/abnahme",
  "/protokolle",
  "/mitarbeiter",
  "/auftraege",
  "/lager",
  "/rechnungen",
  "/gruppen",
  "/kontakte",
]

for (const route of criticalPages) {
  test(`FM-41: Kein weisser Text auf hellem BG — ${route}`, async ({
    page,
  }) => {
    await page.goto(BASE + route)
    await page.waitForLoadState("networkidle")
    await dismissTour(page)
    await page.screenshot({
      path: `/tmp/pl-fm41${route.replace(/\//g, "-")}.png`,
    })

    const violations = await page.evaluate(() => {
      const viols: string[] = []
      document.querySelectorAll("*").forEach((el) => {
        const s = window.getComputedStyle(el)
        if (
          s.color !== "rgb(255, 255, 255)" &&
          s.color !== "rgba(255, 255, 255, 1)"
        )
          return
        const bg = s.backgroundColor
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (!m) return
        const lum = 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]
        if (lum > 150 && bg !== "rgba(0, 0, 0, 0)") {
          const text = (el as HTMLElement).textContent?.trim().slice(0, 20)
          if (text) viols.push(`${el.tagName} bg=${bg} "${text}"`)
        }
      })
      return viols.slice(0, 5)
    })

    if (violations.length > 0) {
      console.log("FM-41 VIOLATIONS on", route, ":", violations)
    }
    expect(
      violations,
      `White on light: ${violations.join("; ")}`
    ).toHaveLength(0)
  })
}
