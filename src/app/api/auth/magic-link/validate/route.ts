import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token erforderlich" },
        { status: 400 }
      )
    }

    // Token suchen
    const magicToken = await prisma.magicToken.findUnique({
      where: { token },
    })

    if (!magicToken) {
      return NextResponse.json(
        { error: "Ungültiger Link" },
        { status: 400 }
      )
    }

    // Prüfen ob bereits verwendet
    if (magicToken.used) {
      return NextResponse.json(
        { error: "Dieser Link wurde bereits verwendet" },
        { status: 400 }
      )
    }

    // Prüfen ob abgelaufen
    if (new Date() > magicToken.expiresAt) {
      // Token als verwendet markieren
      await prisma.magicToken.update({
        where: { id: magicToken.id },
        data: { used: true },
      })
      return NextResponse.json(
        { error: "Dieser Link ist abgelaufen" },
        { status: 400 }
      )
    }

    // User laden
    const user = await prisma.user.findUnique({
      where: { email: magicToken.email },
    })

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Konto nicht gefunden oder deaktiviert" },
        { status: 400 }
      )
    }

    // Token als verwendet markieren
    await prisma.magicToken.update({
      where: { id: magicToken.id },
      data: { used: true },
    })

    // Session erstellen (custom Session, nicht NextAuth signIn da wir kein Passwort haben)
    const sessionToken = crypto.randomBytes(32).toString("hex")
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Tage

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: sessionExpiry,
      },
    })

    // Letzten Login aktualisieren
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Session-Cookie setzen für NextAuth
    // Wir nutzen die NextAuth session strategy, daher müssen wir ein JWT Cookie setzen
    // Alternative: Wir verwenden signIn mit einem speziellen "magic" provider
    
    // Da NextAuth kompliziert ist mit programmatic signIn, 
    // nutzen wir einen Workaround: Wir generieren einen temporären Code
    // den die Client-Seite nutzen kann um sich einzuloggen
    
    const authCode = crypto.randomBytes(16).toString("hex")
    
    // Speichere den Code temporär (5 Minuten gültig)
    await prisma.magicToken.create({
      data: {
        email: user.email,
        token: `auth_${authCode}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    return NextResponse.json({
      success: true,
      authCode,
      userId: user.id,
      role: user.role,
    })
  } catch (error) {
    console.error("[Magic-Link Validate] Fehler:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
