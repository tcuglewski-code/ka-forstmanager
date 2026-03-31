/**
 * API Route: Telegram Registrierungen
 * GET /api/telegram/registrierungen — Liste aller Registrierungen (Admin)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const registrierungen = await prisma.telegramRegistrierung.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(registrierungen)
  } catch (err) {
    console.error("[Telegram Registrierungen] Fehler:", err)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
