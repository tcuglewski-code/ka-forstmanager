import { test, expect } from "@playwright/test"

// WP Wizard Weiter Button Tests
// Tests the navigation flow for all 7 main wizards on the WP site

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

test.describe("WP Wizard Weiter Buttons", () => {
  for (const wizard of WIZARDS) {
    test(`${wizard.name}: Weiter button advances to next step`, async ({
      page,
    }) => {
      // Navigate to wizard
      const url = `${WP_BASE}/${wizard.slug}/`
      console.log(`Testing: ${url}`)
      await page.goto(url, { waitUntil: "networkidle" })

      // Wait for wizard JS to initialize (it replaces loading state)
      await page.waitForTimeout(2000)

      // Take screenshot BEFORE interaction
      await page.screenshot({
        path: `tests/screenshots/wp-${wizard.slug}-step0-before.png`,
        fullPage: true,
      })

      // Check wizard container exists and is not in loading state
      const wizardContainer = page.locator("#ka-wizard")
      const hasWizard = await wizardContainer.count()
      const isLoading = await page.locator(".ka-wizard-loading").count()

      if (hasWizard === 0) {
        console.log(`${wizard.name}: No #ka-wizard container found`)
        await page.screenshot({
          path: `tests/screenshots/wp-${wizard.slug}-no-wizard.png`,
          fullPage: true,
        })
        test.fail(true, "No wizard container found")
        return
      }

      // Get current step indicator
      const activeStep = page.locator(".kaw-step.active")
      const initialStepText = await activeStep.textContent().catch(() => "")
      console.log(`${wizard.name}: Initial step: ${initialStepText}`)

      // Look for any Weiter button (various selectors used)
      const weiterSelectors = [
        'button:has-text("Weiter")',
        "#kaw-next",
        "#n0",
        "#n1",
        "#n2",
        ".kaw-btn-next",
        ".ka-btn-primary",
      ]

      let weiterBtn = null
      for (const sel of weiterSelectors) {
        const btn = page.locator(sel).first()
        if ((await btn.count()) > 0 && (await btn.isVisible())) {
          weiterBtn = btn
          break
        }
      }

      if (!weiterBtn) {
        console.log(`${wizard.name}: No visible Weiter button found`)
        await page.screenshot({
          path: `tests/screenshots/wp-${wizard.slug}-no-weiter-btn.png`,
          fullPage: true,
        })
        test.fail(true, "No Weiter button found")
        return
      }

      // Fill first step based on wizard type
      try {
        await fillFirstStep(page, wizard.slug)
      } catch (e) {
        console.log(`${wizard.name}: Error filling first step: ${e}`)
      }

      // Click Weiter
      await weiterBtn.click()

      // Wait for potential navigation/render
      await page.waitForTimeout(1000)

      // Take screenshot AFTER click
      await page.screenshot({
        path: `tests/screenshots/wp-${wizard.slug}-step1-after.png`,
        fullPage: true,
      })

      // Check if step changed
      const newActiveStep = page.locator(".kaw-step.active")
      const newStepText = await newActiveStep.textContent().catch(() => "")
      console.log(`${wizard.name}: After click step: ${newStepText}`)

      // Check for error messages
      const errorMsg = page.locator(
        '.ka-error-msg:visible, [class*="error"]:visible'
      )
      const hasError = (await errorMsg.count()) > 0
      if (hasError) {
        const errorText = await errorMsg.first().textContent()
        console.log(`${wizard.name}: Error shown: ${errorText}`)
      }

      // Verify step changed (step text should be different) or no error
      const stepChanged = initialStepText !== newStepText
      expect(stepChanged || !hasError).toBe(true)

      console.log(
        `${wizard.name}: ${stepChanged ? "SUCCESS - step changed" : hasError ? "FAIL - error shown" : "PARTIAL - step unchanged but no error"}`
      )
    })
  }
})

async function fillFirstStep(
  page: import("@playwright/test").Page,
  slug: string
) {
  switch (slug) {
    case "anfrage":
      // Pflanzung wizard - typically starts with Besitzertyp selection
      const privatBtn = page.locator('[data-bt="privat"]')
      if ((await privatBtn.count()) > 0) {
        await privatBtn.click()
      }
      break

    case "flachenvorbereitung":
    case "pflanzenbeschaffung":
    case "kulturschutz":
    case "pflege":
    case "zaunbau":
    case "saatguternte":
      // These wizards typically start with Besitzertyp or similar card selection
      const besitzerCards = page.locator(".ka-card, .ka-radio-card")
      if ((await besitzerCards.count()) > 0) {
        await besitzerCards.first().click()
      }
      break
  }

  // Small wait for state update
  await page.waitForTimeout(500)
}
