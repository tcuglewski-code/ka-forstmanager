import { test, expect } from "@playwright/test"

const BASE = "https://ka-forstmanager.vercel.app"

test.use({ storageState: "tests/.auth/live-user.json" })

/** Dismiss the driver.js tour overlay if present */
async function dismissTour(page: import("@playwright/test").Page) {
  const closeBtn = page.locator(".driver-popover-close-btn")
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click()
    await page.waitForTimeout(500)
  }
}

// ============================================================
// FM-22: Rechnung Status-Aenderung
// ============================================================
test("FM-22: Rechnung Status offen->bezahlt aendern", async ({ page }) => {
  await page.goto(BASE + "/rechnungen")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.screenshot({ path: "/tmp/fm22-rechnungen-liste.png" })

  // Erste Rechnung anklicken
  const links = page.locator('a[href*="/rechnungen/"]')
  if ((await links.count()) > 0) {
    await links.first().click()
    await page.waitForLoadState("networkidle")
  }

  await page.screenshot({ path: "/tmp/fm22-rechnung-detail.png" })

  // Pruefe: Gibt es Status-Aendern-Button?
  const statusButton = page.locator(
    [
      'button:has-text("Bezahlt")',
      'button:has-text("bezahlt")',
      'button:has-text("Status")',
      'select[name*="status"]',
      '[data-testid="status-change"]',
    ].join(", ")
  )
  const hasStatusButton = (await statusButton.count()) > 0

  if (!hasStatusButton) {
    throw new Error(
      "FM-22 FAIL: Kein Status-Aendern-Button gefunden. Backend fix allein reicht nicht — UI fehlt."
    )
  }

  await statusButton.first().click()
  await page.screenshot({ path: "/tmp/fm22-status-changed.png" })
  console.log("FM-22: Status-Button gefunden und geklickt")
})

// ============================================================
// FM-41: Weisser Text auf hellem Hintergrund — ALLE Seiten
// ============================================================
const pagesToCheck = [
  "/tagesprotokoll",
  "/protokolle",
  "/qualifikationen",
  "/abnahme",
  "/mitarbeiter",
  "/auftraege",
  "/lager",
  "/rechnungen",
  "/gruppen",
  "/kontakte",
  "/saisons",
  "/baumschulen",
]

for (const route of pagesToCheck) {
  test(`FM-41: Kein weisser Text auf hellem BG auf ${route}`, async ({
    page,
  }) => {
    await page.goto(BASE + route)
    await page.waitForLoadState("networkidle")
    await dismissTour(page)
    await page.screenshot({
      path: `/tmp/fm41${route.replace(/\//g, "-")}.png`,
    })

    const violations = await page.evaluate(() => {
      const violations: string[] = []
      const elements = document.querySelectorAll("*")
      for (const el of elements) {
        const style = window.getComputedStyle(el)
        const color = style.color
        const bg = style.backgroundColor

        if (
          color === "rgb(255, 255, 255)" ||
          color === "rgba(255, 255, 255, 1)"
        ) {
          const bgMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
          if (bgMatch) {
            const r = Number(bgMatch[1])
            const g = Number(bgMatch[2])
            const b = Number(bgMatch[3])
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b
            if (luminance > 150 && bg !== "rgba(0, 0, 0, 0)") {
              const text = (el as HTMLElement).textContent?.trim().slice(0, 30)
              if (text) {
                violations.push(
                  `${el.tagName}:${el.className?.toString().slice(0, 30)} bg=rgb(${r},${g},${b}) text=${text}`
                )
              }
            }
          }
        }
      }
      return violations.slice(0, 10)
    })

    if (violations.length > 0) {
      console.log(`FM-41 VIOLATIONS on ${route}:`, violations)
    }

    expect(
      violations,
      `White text on light bg on ${route}: ${violations.join(", ")}`
    ).toHaveLength(0)
  })
}

// ============================================================
// FM-04: Gruppen + Kontakte — kein Crash
// ============================================================
test("FM-04: Gruppen-Seite laedt ohne Crash", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(err.message))

  await page.goto(BASE + "/gruppen")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.screenshot({ path: "/tmp/fm04-gruppen.png" })

  expect(
    errors.filter((e) => !e.includes("ResizeObserver")),
    "JS Errors on Gruppen"
  ).toHaveLength(0)
})

test("FM-04: Kontakte-Seite laedt ohne Crash", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(err.message))

  await page.goto(BASE + "/kontakte")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.screenshot({ path: "/tmp/fm04-kontakte.png" })

  expect(
    errors.filter((e) => !e.includes("ResizeObserver")),
    "JS Errors on Kontakte"
  ).toHaveLength(0)
})

// ============================================================
// FM-26: Auftraege Detail — kein Crash
// ============================================================
test("FM-26: Auftraege-Liste und Detail laden ohne Crash", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(err.message))

  await page.goto(BASE + "/auftraege")
  await page.waitForLoadState("networkidle")
  await dismissTour(page)
  await page.screenshot({ path: "/tmp/fm26-liste.png" })

  // Exclude "neu" link — find actual detail links
  const links = page.locator('a[href*="/auftraege/"]:not([href$="/neu"])')
  if ((await links.count()) > 0) {
    await links.first().click()
    await page.waitForLoadState("networkidle")
    await page.screenshot({ path: "/tmp/fm26-detail.png" })
  }

  expect(
    errors.filter((e) => !e.includes("ResizeObserver")),
    "JS Errors on Auftraege"
  ).toHaveLength(0)
})
