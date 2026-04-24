import { test as setup, expect } from "@playwright/test"

/**
 * Global auth setup — authenticates via browser-based login flow
 * and saves storageState so all tests skip manual login.
 */

const authFile = "tests/.auth/user.json"

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL || "test@kochaufforstung.de"
  const password = process.env.TEST_USER_PASSWORD || "test1234"

  // 1. Navigate to login page
  await page.goto("/login")
  await page.waitForLoadState("domcontentloaded")

  // 2. Fill credentials and submit
  await page.locator("#login-email").fill(email)
  await page.locator("#login-password").fill(password)
  await page.locator('button[type="submit"]').click()

  // 3. Wait for redirect to dashboard (or 2FA prompt)
  //    The login flow either redirects to /dashboard or shows 2FA input
  try {
    await page.waitForURL(/\/(dashboard|kunde\/dashboard)/, { timeout: 15000 })
  } catch {
    // Check if we're stuck on login with an error
    const errorText = await page
      .locator(".bg-red-500\\/10")
      .textContent()
      .catch(() => null)
    if (errorText) {
      throw new Error(`Login failed: ${errorText}`)
    }

    // Might be 2FA prompt — check if token input is visible
    const twoFaInput = page.locator("#login-2fa-token")
    if (await twoFaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      throw new Error(
        "2FA is enabled for test user. Disable 2FA or provide TOTP secret in env."
      )
    }

    throw new Error("Login did not redirect to dashboard within 15s")
  }

  // 4. Verify session is active
  const sessionRes = await page.request.get("/api/auth/session")
  expect(sessionRes.ok()).toBeTruthy()
  const session = await sessionRes.json()
  expect(session.user).toBeTruthy()

  // 5. Save authenticated state (cookies + localStorage)
  await page.context().storageState({ path: authFile })
})
