/**
 * Telegram Bot Webhook Handler
 * Empfängt Updates von Telegram und verarbeitet Befehle
 * 
 * Befehle:
 * - /start <auftragId> — Registriert Nutzer für Benachrichtigungen zu einem Auftrag
 * - /status — Zeigt aktuellen Status des registrierten Auftrags
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTelegramNotification } from "@/lib/telegram"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ""

// Telegram Update Interface
interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
    date: number
  }
}

export async function POST(req: NextRequest) {
  // Verify request is from Telegram (optional: use secret token)
  try {
    const update: TelegramUpdate = await req.json()
    
    if (!update.message?.text || !update.message.chat) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(update.message.chat.id)
    const text = update.message.text.trim()
    const firstName = update.message.from?.first_name ?? "Kunde"

    // /start <auftragId> — Registrierung für Auftrag
    if (text.startsWith("/start")) {
      const parts = text.split(" ")
      const auftragId = parts[1]

      if (!auftragId) {
        // Kein Auftrag-ID angegeben — Willkommensnachricht
        await sendTelegramNotification(
          chatId,
          `<b>Willkommen bei Koch Aufforstung! 🌲</b>\n\n` +
          `Um Benachrichtigungen zu Ihrem Auftrag zu erhalten, klicken Sie bitte auf den Link, den Sie von uns erhalten haben.\n\n` +
          `Alternativ können Sie /status eingeben, um den Status Ihres Auftrags abzufragen.`
        )
        return NextResponse.json({ ok: true })
      }

      // Auftrag suchen
      const auftrag = await prisma.auftrag.findUnique({
        where: { id: auftragId },
        select: { id: true, nummer: true, titel: true, waldbesitzer: true, status: true },
      })

      if (!auftrag) {
        await sendTelegramNotification(
          chatId,
          `❌ Auftrag nicht gefunden.\n\nBitte überprüfen Sie den Link oder kontaktieren Sie uns unter info@koch-aufforstung.de`
        )
        return NextResponse.json({ ok: true })
      }

      // Registrierung erstellen oder aktualisieren
      await prisma.telegramRegistrierung.upsert({
        where: { chatId },
        create: {
          chatId,
          waldbesitzer: auftrag.waldbesitzer ?? firstName,
          auftragId: auftrag.id,
          aktiv: true,
        },
        update: {
          waldbesitzer: auftrag.waldbesitzer ?? firstName,
          auftragId: auftrag.id,
          aktiv: true,
        },
      })

      // ChatId auch direkt am Auftrag speichern
      await prisma.auftrag.update({
        where: { id: auftragId },
        data: { telegramChatId: chatId },
      })

      await sendTelegramNotification(
        chatId,
        `<b>✅ Erfolgreich registriert!</b>\n\n` +
        `Hallo ${firstName}, Sie erhalten ab jetzt Benachrichtigungen zu:\n\n` +
        `<b>Auftrag:</b> ${auftrag.nummer ?? auftrag.id}\n` +
        (auftrag.titel ? `<b>Titel:</b> ${auftrag.titel}\n` : "") +
        `<b>Aktueller Status:</b> ${formatStatus(auftrag.status)}\n\n` +
        `Mit /status können Sie jederzeit den aktuellen Stand abfragen.`
      )
      return NextResponse.json({ ok: true })
    }

    // /status — Aktuellen Status abfragen
    if (text === "/status" || text.startsWith("/status")) {
      // Registrierung suchen
      const registrierung = await prisma.telegramRegistrierung.findUnique({
        where: { chatId },
      })

      if (!registrierung?.auftragId) {
        await sendTelegramNotification(
          chatId,
          `❓ Sie haben noch keinen Auftrag registriert.\n\n` +
          `Klicken Sie auf den Link aus Ihrer E-Mail oder Bestätigung, um Benachrichtigungen zu aktivieren.`
        )
        return NextResponse.json({ ok: true })
      }

      // Auftrag laden
      const auftrag = await prisma.auftrag.findUnique({
        where: { id: registrierung.auftragId },
        select: {
          id: true,
          nummer: true,
          titel: true,
          status: true,
          standort: true,
          flaeche_ha: true,
          startDatum: true,
          endDatum: true,
        },
      })

      if (!auftrag) {
        await sendTelegramNotification(
          chatId,
          `❌ Auftrag nicht mehr gefunden. Möglicherweise wurde er archiviert.`
        )
        return NextResponse.json({ ok: true })
      }

      const statusEmoji = getStatusEmoji(auftrag.status)
      await sendTelegramNotification(
        chatId,
        `<b>📋 Auftragsstatus</b>\n\n` +
        `<b>Auftrag:</b> ${auftrag.nummer ?? auftrag.id}\n` +
        (auftrag.titel ? `<b>Titel:</b> ${auftrag.titel}\n` : "") +
        `<b>Status:</b> ${statusEmoji} ${formatStatus(auftrag.status)}\n` +
        (auftrag.standort ? `<b>Standort:</b> ${auftrag.standort}\n` : "") +
        (auftrag.flaeche_ha ? `<b>Fläche:</b> ${auftrag.flaeche_ha} ha\n` : "") +
        (auftrag.startDatum ? `<b>Geplanter Start:</b> ${formatDate(auftrag.startDatum)}\n` : "") +
        `\nBei Fragen: info@koch-aufforstung.de`
      )
      return NextResponse.json({ ok: true })
    }

    // /hilfe oder /help
    if (text === "/hilfe" || text === "/help") {
      await sendTelegramNotification(
        chatId,
        `<b>🌲 Koch Aufforstung Bot</b>\n\n` +
        `<b>Verfügbare Befehle:</b>\n` +
        `/status — Aktuellen Auftragsstatus anzeigen\n` +
        `/hilfe — Diese Hilfe anzeigen\n\n` +
        `<b>Kontakt:</b>\n` +
        `📧 info@koch-aufforstung.de\n` +
        `🌐 www.koch-aufforstung.de`
      )
      return NextResponse.json({ ok: true })
    }

    // Unbekannter Befehl
    await sendTelegramNotification(
      chatId,
      `Ich habe Sie leider nicht verstanden. 🤔\n\n` +
      `Verfügbare Befehle:\n` +
      `/status — Auftragsstatus abfragen\n` +
      `/hilfe — Hilfe anzeigen`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Telegram Webhook] Fehler:", err)
    // Telegram erwartet immer 200 OK, sonst Retry-Schleife
    return NextResponse.json({ ok: true })
  }
}

// Utility: Status formatieren
function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    anfrage: "Anfrage eingegangen",
    bestaetigt: "Bestätigt",
    in_planung: "In Planung",
    in_arbeit: "In Arbeit",
    abgeschlossen: "Abgeschlossen",
    abgebrochen: "Abgebrochen",
    pausiert: "Pausiert",
  }
  return labels[status] ?? status
}

// Utility: Status Emoji
function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    anfrage: "📋",
    bestaetigt: "✅",
    in_planung: "📅",
    in_arbeit: "🌱",
    abgeschlossen: "🎉",
    abgebrochen: "❌",
    pausiert: "⏸️",
  }
  return emojis[status] ?? "📄"
}

// Utility: Datum formatieren
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
