import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

/**
 * Demo Password Protection (Basic Auth)
 * Aktiviert wenn DEMO_PASSWORD ENV-Variable gesetzt ist
 */
function checkDemoAuth(req: Request): NextResponse | null {
  const demoPassword = process.env.DEMO_PASSWORD
  if (!demoPassword) return null // Demo-Schutz deaktiviert

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Basic ")) {
    return new NextResponse("Demo-Zugang erforderlich", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Demo AppFabrik"' },
    })
  }

  const base64Credentials = authHeader.slice(6)
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
  const [, password] = credentials.split(":")

  if (password !== demoPassword) {
    return new NextResponse("Falsches Passwort", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Demo AppFabrik"' },
    })
  }

  return null // Auth OK
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // API-Routen, statische Assets und Favicon immer durchlassen
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Demo Password Protection (vor allem anderen)
  const demoAuthResponse = checkDemoAuth(req)
  if (demoAuthResponse) return demoAuthResponse

  const isLoggedIn = !!req.auth
  const isLoginPage = pathname === "/login"
  const isPublicPage = pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password"

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/(.*)", "/api/(.*)"],
}
