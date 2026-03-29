import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// Optional: Resend für E-Mail-Versand
let resend: any = null
try {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require("resend")
    resend = new Resend(process.env.RESEND_API_KEY)
  }
} catch {
  // Resend nicht verfügbar
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-Mail-Adresse erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob User existiert und Kunde ist
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      // Security: Nicht verraten ob User existiert
      // Trotzdem "Erfolg" melden
      return NextResponse.json({
        success: true,
        message: "Falls ein Konto mit dieser E-Mail existiert, wurde ein Login-Link gesendet.",
      })
    }

    // Nur für Kunden erlaubt
    if (user.role !== "kunde") {
      return NextResponse.json({
        success: true,
        message: "Falls ein Konto mit dieser E-Mail existiert, wurde ein Login-Link gesendet.",
      })
    }

    // Alte Token invalidieren
    await prisma.magicToken.updateMany({
      where: {
        email: user.email,
        used: false,
      },
      data: { used: true },
    })

    // Neuen Token generieren (24h gültig)
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.magicToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    })

    // Magic Link URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000"
    const magicLink = `${baseUrl}/auth/magic?token=${token}`

    // E-Mail senden (oder loggen wenn kein API Key)
    if (resend) {
      try {
        await resend.emails.send({
          from: "Koch Aufforstung <noreply@koch-aufforstung.de>",
          to: user.email,
          subject: "Ihr Login-Link für den ForstManager",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <div style="background: #2C3A1C; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🌲 Koch Aufforstung</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <p>Hallo ${user.name},</p>
                <p>Klicken Sie auf den folgenden Link, um sich im ForstManager anzumelden:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${magicLink}" 
                     style="background: #2C3A1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Jetzt anmelden
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                  Der Link ist 24 Stunden gültig. Falls Sie diesen Login nicht angefordert haben, ignorieren Sie diese E-Mail.
                </p>
              </div>
              <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Koch Aufforstung GmbH
              </div>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("[Magic-Link] E-Mail-Versand fehlgeschlagen:", emailError)
      }
    } else {
      // Kein RESEND_API_KEY → nur loggen (für manuelle Tests)
      console.log("[Magic-Link] KEIN RESEND_API_KEY gesetzt")
      console.log("[Magic-Link] E-Mail:", user.email)
      console.log("[Magic-Link] Link:", magicLink)
    }

    // Bei fehlendem API Key: Link im Response für Tests zurückgeben
    const response: any = {
      success: true,
      message: "Falls ein Konto mit dieser E-Mail existiert, wurde ein Login-Link gesendet.",
    }

    // Nur in Development oder wenn kein RESEND_API_KEY: Link zurückgeben
    if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === "development") {
      response.debugLink = magicLink
      response.note = "RESEND_API_KEY nicht konfiguriert - Link nur für Tests sichtbar"
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[Magic-Link] Fehler:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
