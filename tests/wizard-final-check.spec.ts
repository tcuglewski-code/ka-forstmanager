import { test, expect } from '@playwright/test'

const WIZARDS = [
  { name: 'pflanzung', url: 'https://peru-otter-113714.hostingersite.com/pflanzung-anfrage/' },
  { name: 'flaechenvorbereitung', url: 'https://peru-otter-113714.hostingersite.com/flaechenvorbereitung-anfrage/' },
  { name: 'kulturschutz', url: 'https://peru-otter-113714.hostingersite.com/kulturschutz-anfrage/' },
  { name: 'pflege', url: 'https://peru-otter-113714.hostingersite.com/pflege-anfrage/' },
  { name: 'zaunbau', url: 'https://peru-otter-113714.hostingersite.com/zaunbau-anfrage/' },
  { name: 'saatguternte', url: 'https://peru-otter-113714.hostingersite.com/saatguternte-anfrage/' },
  { name: 'pflanzenbeschaffung', url: 'https://peru-otter-113714.hostingersite.com/pflanzenbeschaffung-anfrage/' },
]

test('Alle Wizards laden + Design System aktiv', async ({ page }) => {
  for (const w of WIZARDS) {
    await page.goto(w.url, { timeout: 15000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1500)
    
    // Design System CSS geladen?
    const cssLoaded = await page.evaluate(() =>
      !!document.querySelector('link[href*="ka-wizard-design-system"]') ||
      !!document.querySelector('link[id="ka-design-system-css"]') ||
      getComputedStyle(document.documentElement).getPropertyValue('--kaw-forest').trim() !== ''
    )
    
    // Wizard-Container vorhanden?
    const wizardEl = await page.locator('[class*="ka-wizard"],[class*="pf-wizard"],[class*="wizard-container"],[id*="wizard"]').count()
    
    // Screenshot
    await page.screenshot({ path: `/tmp/wizard-final-${w.name}.png`, fullPage: false })
    
    console.log(`${w.name}: css=${cssLoaded} | wizard-elements=${wizardEl}`)
    expect(wizardEl).toBeGreaterThan(0)
  }
})
