import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ============================================================
// Push Token für Mitarbeiter (Sprint AQ)
// Expo Push Token wird beim Login gespeichert
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, platform, mitarbeiterId } = body

    if (!token) {
      return NextResponse.json({ error: "Push-Token fehlt" }, { status: 400 })
    }

    // Token speichern
    await prisma.systemConfig.upsert({
      where: { key: `push_token_ma_${mitarbeiterId ?? "anon"}` },
      update: { value: JSON.stringify({ token, platform, ts: Date.now() }) },
      create: { 
        key: `push_token_ma_${mitarbeiterId ?? "anon"}`,
        value: JSON.stringify({ token, platform, ts: Date.now() }),
      },
    }).catch(() => null)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Fehler" }, { status: 500 })
  }
}
