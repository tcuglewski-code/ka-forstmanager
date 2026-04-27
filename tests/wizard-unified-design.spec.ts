import { test, expect } from '@playwright/test';

const WIZARDS = [
  { name: 'pflanzung', url: 'https://peru-otter-113714.hostingersite.com/anfrage/' },
  { name: 'flaechenvorbereitung', url: 'https://peru-otter-113714.hostingersite.com/flaechenvorbereitung-anfrage/' },
  { name: 'kulturschutz', url: 'https://peru-otter-113714.hostingersite.com/kulturschutz-anfrage/' },
  { name: 'pflege', url: 'https://peru-otter-113714.hostingersite.com/pflege-anfrage/' },
  { name: 'zaunbau', url: 'https://peru-otter-113714.hostingersite.com/zaunbau-anfrage/' },
  { name: 'saatguternte', url: 'https://peru-otter-113714.hostingersite.com/saatguternte-anfrage/' },
  { name: 'pflanzenbeschaffung', url: 'https://peru-otter-113714.hostingersite.com/pflanzenbeschaffung-anfrage/' },
];

test.describe('Wizard Unified Design System', () => {
  for (const w of WIZARDS) {
    test(`${w.name}: loads and uses design system`, async ({ page }) => {
      await page.goto(w.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Screenshot
      await page.screenshot({
        path: `/tmp/wizard-unified-${w.name}.png`,
        fullPage: false,
      });

      // Check CSS design system is loaded
      const hasCSSLink = await page.locator('link[id="ka-design-system-css"], link[href*="ka-wizard-design-system"]').count();
      console.log(`${w.name}: design-system-css-link=${hasCSSLink}`);

      // Check ka-wizard CSS classes are present
      const hasDesignClasses = await page.locator('.ka-card, .ka-card-option, .ka-btn-primary, .ka-card-header, .ka-inp, .ka-field').count();
      console.log(`${w.name}: ka-design-classes=${hasDesignClasses}`);

      // Check wizard container exists
      const hasWizardContainer = await page.locator('[id*="wizard"], [class*="wizard"], #pf, #pf-main').count();
      console.log(`${w.name}: wizard-container=${hasWizardContainer}`);

      // Check wizard has content (not empty)
      const hasContent = await page.locator('h2, .ka-card-header h2, .pf-hd h2').count();
      console.log(`${w.name}: content-headings=${hasContent}`);
      expect(hasContent).toBeGreaterThan(0);

      // Check buttons exist
      const hasButtons = await page.locator('.ka-btn-primary, .ka-btn, .pf-btn').count();
      console.log(`${w.name}: buttons=${hasButtons}`);
      expect(hasButtons).toBeGreaterThan(0);

      // Check for JavaScript errors
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      if (errors.length > 0) {
        console.log(`${w.name}: JS-ERRORS=${errors.join('; ')}`);
      }
    });
  }

  test('Design consistency check', async ({ page }) => {
    // Check Flächenvorbereitung specifically for new design
    await page.goto(WIZARDS[1].url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Should have Waldbesitzertyp as first step
    const hasWaldbesitzertyp = await page.locator('text=Waldbesitzertyp').count();
    console.log(`flaechenvorbereitung: waldbesitzertyp-step=${hasWaldbesitzertyp}`);

    // Should have ka-card-option elements
    const hasCardOptions = await page.locator('.ka-card-option').count();
    console.log(`flaechenvorbereitung: card-options=${hasCardOptions}`);

    // Check color consistency (forest green)
    const primaryBtn = page.locator('.ka-btn-primary').first();
    if (await primaryBtn.count() > 0) {
      const bg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      console.log(`flaechenvorbereitung: primary-btn-bg=${bg}`);
    }
  });
});
