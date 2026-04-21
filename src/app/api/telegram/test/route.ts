/**
 * API Route: Telegram Testnachricht senden
 * POST /api/telegram/test
 * Body: { chatId?: string } — ohne chatId → interne Gruppe
 *
 * NUR für Admins in Production. In development wird nur geloggt.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KA ?? process.env.TELEGRAM_BOT_TOKEN ?? ""
const INTERNAL_CHAT_ID = process.env.TELEGRAM_CHAT_ID_KA ?? ""

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Nur Admins dürfen Test-Nachrichten senden
  const role = (session.user as { role?: string })?.role
  if (role !== "admin" && role !== "ka_admin") {
    return NextResponse.json({ error: "Nur Admins dürfen Test-Nachrichten senden" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const chatId = (body as { chatId?: string }).chatId || INTERNAL_CHAT_ID

    if (!chatId) {
      return NextResponse.json(
        { error: "Keine Chat-ID angegeben und TELEGRAM_CHAT_ID_KA nicht konfiguriert" },
        { status: 400 }
      )
    }

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN_KA nicht konfiguriert" },
        { status: 500 }
      )
    }

    // In development: nur loggen
    if (process.env.NODE_ENV === "development") {
      console.log(`[Telegram Test][DEV] Würde senden an ${chatId}`)
      return NextResponse.json({ ok: true, chatId, dev: true })
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ *Testnachricht vom ForstManager*\n\n` +
          `Telegram-Integration funktioniert\\!\n` +
          `Gesendet: ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`,
        parse_mode: "MarkdownV2",
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[Telegram Test] API Error:", err)
      return NextResponse.json({ error: "Telegram API Fehler" }, { status: 502 })
    }

    return NextResponse.json({ ok: true, chatId })
  } catch (err) {
    console.error("[Telegram Test] Fehler:", err)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
