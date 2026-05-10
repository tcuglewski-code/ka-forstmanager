import { test, expect } from "@playwright/test"

/**
 * WP Wizard Stealth Tests
 * Uses standard Playwright with extra headers/settings to bypass Cloudflare
 * Tests all 7 wizard URLs: form fill → Weiter click → next step verification
 */

const WP_BASE = "https://peru-otter-113714.hostingersite.com"

const WIZARDS = [
  { slug: "pflanzung-anfrage", name: "Pflanzung" },
  { slug: "pflanzenbeschaffung-anfrage", name: "Pflanzenbeschaffung" },
  { slug: "flaechenvorbereitung-anfrage", name: "Flächenvorbereitung" },
  { slug: "kulturschutz-anfrage", name: "Kulturschutz" },
  { slug: "pflege-anfrage", name: "Pflege" },
  { slug: "zaunbau-anfrage", name: "Zaunbau" },
  { slug: "saatguternte-anfrage", name: "Saatguternte" },
]

test.use({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  locale: "de-DE",
  extraHTTPHeaders: {
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Sec-CH-UA": '"Chromium";v="120", "Google Chrome";v="120"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
    "Upgrade-Insecure-Requests": "1",
  },
  javaScriptEnabled: true,
  bypassCSP: true,
})

test.describe("WP Wizard Stealth — Full Navigation", () => {
  for (const wizard of WIZARDS) {
    test(`${wizard.name}: Weiter navigiert zum nächsten Step`, async ({
      page,
    }) => {
      test.setTimeout(90000)

      // Navigate with realistic behavior
      const url = `${WP_BASE}/${wizard.slug}/`
      console.log(`\n🔍 Testing: ${url}`)

      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      })

      const status = response?.status() ?? 0
      console.log(`  HTTP Status: ${status}`)

      // Check for Cloudflare challenge
      const pageContent = await page.content()
      const isCfChallenge =
        pageContent.includes("cf-challenge") ||
        pageContent.includes("Checking your browser") ||
        pageContent.includes("cf-turnstile")

      if (isCfChallenge) {
        console.log(`  ⚠️ Cloudflare challenge detected — waiting 10s`)
        await page.waitForTimeout(10000)
        // Re-check
        const afterContent = await page.content()
        if (
          afterContent.includes("cf-challenge") ||
          afterContent.includes("Checking your browser")
        ) {
          await page.screenshot({
            path: `tests/screenshots/stealth-${wizard.slug}-cf-blocked.png`,
            fullPage: true,
          })
          console.log(`  ❌ Cloudflare block — could not bypass`)
          test.skip(true, "Cloudflare challenge not bypassed")
          return
        }
      }

      // Wait for wizard JS to load
      await page.waitForTimeout(3000)

      // Screenshot BEFORE interaction
      await page.screenshot({
        path: `tests/screenshots/stealth-${wizard.slug}-step0.png`,
        fullPage: true,
      })

      // Check wizard container
      const wizardContainer = page.locator("#ka-wizard")
      const hasWizard = (await wizardContainer.count()) > 0

      if (!hasWizard) {
        console.log(`  ❌ No #ka-wizard container found`)
        await page.screenshot({
          path: `tests/screenshots/stealth-${wizard.slug}-no-wizard.png`,
          fullPage: true,
        })
        expect(hasWizard, "Wizard container #ka-wizard not found").toBe(true)
        return
      }

      // Get initial step
      const activeStep = page.locator(".kaw-step.active, .kaw-step-active")
      const initialStepText = await activeStep
        .first()
        .textContent()
        .catch(() => "unknown")
      console.log(`  Step 0: "${initialStepText?.trim()}"`)

      // Fill first step fields
      await fillWizardStep(page, wizard.slug)

      // Find Weiter button
      const weiterSelectors = [
        'button:has-text("Weiter")',
        "#kaw-next",
        "#n0",
        "#n1",
        ".kaw-btn-next",
        ".ka-btn-primary",
        'button:has-text("Next")',
        '[data-action="next"]',
      ]

      let weiterBtn = null
      for (const sel of weiterSelectors) {
        const btn = page.locator(sel).first()
        if ((await btn.count()) > 0 && (await btn.isVisible())) {
          weiterBtn = btn
          console.log(`  Weiter-Button: ${sel}`)
          break
        }
      }

      if (!weiterBtn) {
        console.log(`  ❌ No visible Weiter button found`)
        await page.screenshot({
          path: `tests/screenshots/stealth-${wizard.slug}-no-weiter.png`,
          fullPage: true,
        })
        expect(weiterBtn, "No Weiter button found").not.toBeNull()
        return
      }

      // Click Weiter
      await weiterBtn.click()
      await page.waitForTimeout(1500)

      // Screenshot AFTER click
      await page.screenshot({
        path: `tests/screenshots/stealth-${wizard.slug}-step1.png`,
        fullPage: true,
      })

      // Check step change
      const newStepText = await page
        .locator(".kaw-step.active, .kaw-step-active")
        .first()
        .textContent()
        .catch(() => "unknown")
      console.log(`  Step 1: "${newStepText?.trim()}"`)

      // Check for errors
      const errors = page.locator(
        '.ka-error-msg:visible, .kaw-error:visible, [class*="error"]:visible:not(style)'
      )
      const errorCount = await errors.count()
      if (errorCount > 0) {
        const errorText = await errors.first().textContent()
        console.log(`  ⚠️ Error message: ${errorText?.trim()}`)
      }

      const stepChanged = initialStepText?.trim() !== newStepText?.trim()
      console.log(
        `  ${stepChanged ? "✅ PASS — step advanced" : "❌ FAIL — step did not change"}`
      )

      expect(
        stepChanged,
        `Step did not advance after Weiter click (stayed at "${initialStepText?.trim()}")`
      ).toBe(true)
    })
  }
})

async function fillWizardStep(
  page: import("@playwright/test").Page,
  slug: string
) {
  // Try common first-step patterns
  // 1. Besitzertyp cards (privat/kommunal/kirche etc.)
  const besitzerCards = page.locator(
    '[data-bt="privat"], .ka-card, .ka-radio-card, .kaw-card'
  )
  if ((await besitzerCards.count()) > 0) {
    await besitzerCards.first().click()
    console.log(`  Filled: Selected first Besitzertyp card`)
    await page.waitForTimeout(500)
  }

  // 2. Radio buttons
  const radios = page.locator(
    'input[type="radio"]:not(:checked)'
  )
  if ((await radios.count()) > 0) {
    await radios.first().click()
    console.log(`  Filled: Selected first radio button`)
    await page.waitForTimeout(300)
  }

  // 3. Required text inputs
  const textInputs = page.locator(
    'input[type="text"][required]:visible, input[type="text"].required:visible'
  )
  const inputCount = await textInputs.count()
  for (let i = 0; i < inputCount; i++) {
    const input = textInputs.nth(i)
    const placeholder = await input.getAttribute("placeholder")
    await input.fill(placeholder || "Testdaten")
    console.log(`  Filled: text input ${i} with "${placeholder || "Testdaten"}"`)
  }

  // 4. Required number inputs
  const numInputs = page.locator(
    'input[type="number"][required]:visible, input[type="number"].required:visible'
  )
  const numCount = await numInputs.count()
  for (let i = 0; i < numCount; i++) {
    await numInputs.nth(i).fill("5")
    console.log(`  Filled: number input ${i}`)
  }

  // 5. Select dropdowns
  const selects = page.locator("select[required]:visible, select.required:visible")
  const selCount = await selects.count()
  for (let i = 0; i < selCount; i++) {
    const options = selects.nth(i).locator("option:not([value=''])")
    if ((await options.count()) > 0) {
      const val = await options.first().getAttribute("value")
      if (val) {
        await selects.nth(i).selectOption(val)
        console.log(`  Filled: select ${i} with "${val}"`)
      }
    }
  }

  await page.waitForTimeout(500)
}
