import { handlers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { loginRateLimit } from "@/lib/rate-limit"

export const { GET } = handlers

// Demo-Accounts die vom Rate-Limit ausgenommen sind
const DEMO_EXEMPT_EMAILS = ["supervisor@forstmanager.de"]

// Wrap POST with rate-limiting for credential login attempts
export async function POST(req: NextRequest) {
  // Only rate-limit credential sign-in (callback/credentials), not other POST actions
  const url = new URL(req.url)
  if (url.pathname.includes("/callback/credentials") || url.pathname.endsWith("/signin")) {
    // Demo-Accounts vom Rate-Limit ausnehmen
    let bodyEmail: string | null = null
    try {
      const cloned = req.clone()
      const text = await cloned.text()
      const params = new URLSearchParams(text)
      bodyEmail = params.get("email")
    } catch { /* ignore parse errors */ }

    const isDemo = bodyEmail && DEMO_EXEMPT_EMAILS.includes(bodyEmail)

    if (!isDemo) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown"
      const { success } = await loginRateLimit.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: "Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten." },
          { status: 429, headers: { "Retry-After": "900", "X-RateLimit-Remaining": "0" } }
        )
      }
    }
  }
  return handlers.POST(req)
}
