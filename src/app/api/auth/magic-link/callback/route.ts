import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const authCode = req.nextUrl.searchParams.get("authCode")
  if (!authCode) {
    return NextResponse.redirect(new URL("/auth/magic?error=missing", req.url))
  }

  // Vorab-Validierung: existiert der Auth-Code, ist nicht verbraucht und nicht abgelaufen
  const token = await prisma.magicToken.findUnique({
    where: { token: `auth_${authCode}` },
  })

  if (!token || token.used) {
    return NextResponse.redirect(new URL("/auth/magic?error=invalid", req.url))
  }

  if (new Date() > token.expiresAt) {
    return NextResponse.redirect(new URL("/auth/magic?error=expired", req.url))
  }

  // Server-side signIn — NextAuth wirft NEXT_REDIRECT bei Erfolg, das muss durchgereicht werden
  try {
    await signIn("magic-link", {
      authCode,
      redirectTo: "/kunde/dashboard",
    })
  } catch (e) {
    const err = e as { message?: string; digest?: string }
    // NextAuth wirft NEXT_REDIRECT bei erfolgreichem Redirect → durchreichen
    if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e
    }
    console.error("[Magic-Link Callback] signIn fehlgeschlagen:", e)
    return NextResponse.redirect(new URL("/auth/magic?error=signin", req.url))
  }

  // Sollte nie hier ankommen (signIn redirected immer), aber zur Sicherheit
  return NextResponse.redirect(new URL("/kunde/dashboard", req.url))
}
