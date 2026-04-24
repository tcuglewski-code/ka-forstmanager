import { test, expect } from '@playwright/test'
test.use({ storageState: 'tests/.auth/user.json' })

const SEITEN = [
  '/dashboard', '/protokolle', '/auftraege', '/rechnungen',
  '/lohn', '/lager', '/fuhrpark', '/gruppen', '/mitarbeiter', '/einstellungen'
]

test('Alle Seiten erreichbar + keine Fehlermeldung', async ({ page }) => {
  const errors: string[] = []
  for (const s of SEITEN) {
    const msgs: string[] = []
    page.on('console', m => { if(m.type()==='error') msgs.push(m.text()) })
    const resp = await page.goto(s)
    await page.waitForLoadState('networkidle').catch(()=>{})
    const txt = await page.textContent('body')
    if(txt?.includes('schiefgelaufen') || txt?.includes('Fehler beim Laden') || txt?.includes('Error')) {
      errors.push(`${s}: Fehlertext im Body`)
    }
    const status = resp?.status() ?? 0
    if(status >= 500) errors.push(`${s}: HTTP ${status}`)
    console.log(`${s}: HTTP ${status}, konsolen-fehler: ${msgs.length}`)
  }
  if(errors.length > 0) console.error('FEHLER:', errors.join(' | '))
  expect(errors.length).toBe(0)
})

test('DB Status-Werte in Aufträgen', async ({ page }) => {
  await page.goto('/auftraege')
  await page.waitForLoadState('networkidle')
  const txt = await page.textContent('body')
  console.log('Aufträge-Seite Länge:', txt?.length)
  await page.screenshot({ path: '/tmp/auftraege-live.png' })
})
