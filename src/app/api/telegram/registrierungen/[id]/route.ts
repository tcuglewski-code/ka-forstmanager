/**
 * API Route: Telegram Registrierung deaktivieren
 * DELETE /api/telegram/registrierungen/[id]
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const registrierung = await prisma.telegramRegistrierung.findUnique({
      where: { id },
    })

    if (!registrierung) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }

    // Deactivate instead of delete
    await prisma.telegramRegistrierung.update({
      where: { id },
      data: { aktiv: false },
    })

    // Remove chatId from linked Auftrag
    if (registrierung.auftragId) {
      await prisma.auftrag.updateMany({
        where: { id: registrierung.auftragId, telegramChatId: registrierung.chatId },
        data: { telegramChatId: null },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Telegram Registrierung DELETE] Fehler:", err)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
