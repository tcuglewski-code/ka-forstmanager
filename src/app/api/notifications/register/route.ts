import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ============================================================
// Push Token Registrierung (Sprint AQ)
// App sendet Expo Push Token nach Login
// Gespeichert beim Mitarbeiter für spätere Push-Benachrichtigungen
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, platform, userId } = body

    if (!token) {
      return NextResponse.json({ error: "Token fehlt" }, { status: 400 })
    }

    // Token in SystemConfig speichern (einfaches Key-Value-Fallback)
    await prisma.systemConfig.upsert({
      where: { key: `push_token_${userId ?? "anon"}` },
      update: { value: JSON.stringify({ token, platform, updatedAt: new Date().toISOString() }) },
      create: { 
        key: `push_token_${userId ?? "anon"}`,
        value: JSON.stringify({ token, platform, updatedAt: new Date().toISOString() }),
      },
    }).catch(() => null)

    return NextResponse.json({ success: true, message: "Push-Token gespeichert" })
  } catch (err) {
    console.error("[notifications/register] Fehler:", err)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
