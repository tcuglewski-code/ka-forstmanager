import { test as setup, expect } from "@playwright/test"

const authFile = "tests/.auth/live-user.json"
const BASE = "https://ka-forstmanager.vercel.app"
const BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"

setup("authenticate against live", async ({ page }) => {
  // 1. Get CSRF token
  const csrfRes = await page.request.get(`${BASE}/api/auth/csrf`, {
    headers: { "x-vercel-bypass-automation-protection": BYPASS },
  })
  expect(csrfRes.ok()).toBeTruthy()
  const { csrfToken } = await csrfRes.json()

  // 2. Sign in via credentials with 2FA bypass
  const signInRes = await page.request.post(
    `${BASE}/api/auth/callback/credentials`,
    {
      form: {
        email: "supervisor@forstmanager.de",
        password: "Test1234!",
        twoFactorValidated: "true",
        csrfToken,
        json: "true",
      },
      headers: { "x-vercel-bypass-automation-protection": BYPASS },
    }
  )
  expect(signInRes.ok()).toBeTruthy()

  // 3. Verify session
  const sessionRes = await page.request.get(`${BASE}/api/auth/session`, {
    headers: { "x-vercel-bypass-automation-protection": BYPASS },
  })
  expect(sessionRes.ok()).toBeTruthy()
  const session = await sessionRes.json()
  expect(session.user).toBeTruthy()

  // 4. Save state
  await page.context().storageState({ path: authFile })
})
