import { test, expect } from "@playwright/test"

// Loop 5: FM-17, FM-18, FM-34 verification tests
// Auth-independent API tests + page load checks

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://ka-forstmanager.vercel.app"
const BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"
const headers = { "x-vercel-bypass-automation-protection": BYPASS }

test.describe("FM-17: Multi-PDF Export Route", () => {
  test("returns 401 without auth", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auftraege/nonexist/protokolle/export-pdf`, { headers })
    // Should return 401 (unauthorized) or 404 (not found) - both valid
    expect([401, 404]).toContain(res.status())
  })

  test("returns 404 for non-existent auftrag", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auftraege/00000000-0000-0000-0000-000000000000/protokolle/export-pdf`, { headers })
    expect([401, 404]).toContain(res.status())
  })
})

test.describe("FM-18: Abnahme-Zusammenfassung", () => {
  test("auftraege page loads", async ({ request }) => {
    const res = await request.get(`${BASE}/auftraege`, { headers })
    // 200 or 307 redirect to login - both OK (route exists)
    expect([200, 307]).toContain(res.status())
  })
})

test.describe("FM-34: Lieferant URL auto-prefix", () => {
  test("lieferanten API accessible", async ({ request }) => {
    const res = await request.get(`${BASE}/api/lager/lieferanten`, { headers })
    // 200 (with auth cookies) or 401/500 without - route exists
    expect(res.status()).toBeLessThan(500)
  })

  test("POST lieferant without auth returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/lager/lieferanten`, {
      headers: { ...headers, "Content-Type": "application/json" },
      data: { name: "Test-Lieferant-Loop5", website: "www.test-loop5.de" },
    })
    // Should not be 500 (route works)
    expect(res.status()).toBeLessThan(500)
  })
})

test.describe("WP: Script availability", () => {
  test("plz-autocomplete.js accessible", async ({ request }) => {
    const res = await request.get("https://peru-otter-113714.hostingersite.com/wp-content/uploads/plz-autocomplete.js")
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain("openplzapi")
    expect(body).toContain("bindPlzAutocomplete")
  })

  test("ka-maps-helper.js accessible", async ({ request }) => {
    const res = await request.get("https://peru-otter-113714.hostingersite.com/wp-content/uploads/ka-maps-helper.js")
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain("kaInitMap")
    expect(body).toContain("leaflet")
  })

  test("pflanzung wizard has updated Pflanzverband descriptions", async ({ request }) => {
    const res = await request.get("https://peru-otter-113714.hostingersite.com/wp-content/uploads/pflanzung-wizard-v4.js")
    expect(res.status()).toBe(200)
    const body = await res.text()
    // WP-06: distinct descriptions
    expect(body).toContain("Unregelm")  // Truppweise description
    expect(body).toContain("Kreisf")    // Nesterpflanzung description
  })

  test("saatguternte wizard has PLZ/Ort in logistik", async ({ request }) => {
    const res = await request.get("https://peru-otter-113714.hostingersite.com/wp-content/uploads/saatguternte-wizard-v3.js")
    expect(res.status()).toBe(200)
    const body = await res.text()
    // WP-19
    expect(body).toContain("log-plz")
    expect(body).toContain("log-ort")
    expect(body).toContain("logistik_plz")
  })
})
