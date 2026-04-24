import { test } from '@playwright/test'
// No auth needed — these are public WP pages
test.use({ storageState: undefined })

const WIZARDS = [
  { name: 'pflanzung', url: 'https://peru-otter-113714.hostingersite.com/anfrage-stellen/' },
  { name: 'flaechenvorbereitung', url: 'https://peru-otter-113714.hostingersite.com/flaechenvorbereitung/' },
  { name: 'kulturschutz', url: 'https://peru-otter-113714.hostingersite.com/kulturschutz/' },
  { name: 'zaunbau', url: 'https://peru-otter-113714.hostingersite.com/zaunbau/' },
  { name: 'pflege', url: 'https://peru-otter-113714.hostingersite.com/pflege/' },
  { name: 'saatguternte', url: 'https://peru-otter-113714.hostingersite.com/saatguternte/' },
]

test('wizard screenshots', async ({ page }) => {
  for (const w of WIZARDS) {
    await page.goto(w.url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `/tmp/wizard-${w.name}.png`, fullPage: true })
    console.log('Screenshot:', w.name, 'done')
  }
})
