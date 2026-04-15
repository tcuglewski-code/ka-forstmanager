import { test as setup, expect } from "@playwright/test"

/**
 * Global auth setup — authenticates via NextAuth credentials endpoint
 * and saves storageState so all tests skip manual login.
 * Passes twoFactorValidated=true to bypass 2FA for test users.
 */

const authFile = "tests/.auth/user.json"

setup("authenticate", async ({ page }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
  const email = process.env.TEST_USER_EMAIL || "test@kochaufforstung.de"
  const password = process.env.TEST_USER_PASSWORD || "test1234"

  // 1. Get CSRF token from NextAuth
  const csrfRes = await page.request.get(`${baseURL}/api/auth/csrf`, {
    headers: {
      "x-vercel-bypass-automation-protection": "rpFNEmGS7CB0FunapN20rLGDCG0foMzx",
    },
  })
  expect(csrfRes.ok()).toBeTruthy()
  const { csrfToken } = await csrfRes.json()

  // 2. Sign in via credentials endpoint with 2FA bypass
  const signInRes = await page.request.post(
    `${baseURL}/api/auth/callback/credentials`,
    {
      form: {
        email,
        password,
        twoFactorValidated: "true",
        csrfToken,
        json: "true",
      },
      headers: {
        "x-vercel-bypass-automation-protection": "rpFNEmGS7CB0FunapN20rLGDCG0foMzx",
      },
    }
  )
  expect(signInRes.ok()).toBeTruthy()

  // 3. Verify session is active
  const sessionRes = await page.request.get(`${baseURL}/api/auth/session`, {
    headers: {
      "x-vercel-bypass-automation-protection": "rpFNEmGS7CB0FunapN20rLGDCG0foMzx",
    },
  })
  expect(sessionRes.ok()).toBeTruthy()
  const session = await sessionRes.json()
  expect(session.user).toBeTruthy()

  // 4. Save authenticated state
  await page.context().storageState({ path: authFile })
})
