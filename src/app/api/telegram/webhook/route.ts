/**
 * Telegram Bot Webhook Handler
 * Empfängt Updates von Telegram und verarbeitet Befehle
 *
 * Befehle:
 * - /start [auftragId] — Begrüßung oder Registrierung via Deep-Link
 * - /anmelden <auftragsnummer> — Verknüpft Chat mit Auftrag via Auftragsnummer
 * - /status — Zeigt aktuellen Status des registrierten Auftrags
 * - /abmelden — Deaktiviert Telegram-Benachrichtigungen
 * - /hilfe — Hilfe anzeigen
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KA ?? process.env.TELEGRAM_BOT_TOKEN ?? ""
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? ""

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

async function sendMessage(chatId: string, text: string): Promise<void> {
  if (!BOT_TOKEN) return
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  // Validate webhook secret if configured
  if (WEBHOOK_SECRET) {
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token")
    if (secretHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true })
    }
  }

  try {
    const update: TelegramUpdate = await req.json()

    if (!update.message?.text || !update.message.chat) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(update.message.chat.id)
    const text = update.message.text.trim()
    const firstName = update.message.from?.first_name ?? "Kunde"

    // /start [auftragId] — Deep-Link Registrierung
    if (text.startsWith("/start")) {
      const parts = text.split(" ")
      const auftragId = parts[1]

      if (!auftragId) {
        await sendMessage(
          chatId,
          `<b>Willkommen bei Koch Aufforstung! 🌲</b>\n\n` +
          `Um Benachrichtigungen zu Ihrem Auftrag zu erhalten:\n\n` +
          `<b>Option 1:</b> Klicken Sie auf den Link, den Sie von uns erhalten haben.\n` +
          `<b>Option 2:</b> Geben Sie Ihre Auftragsnummer ein:\n` +
          `<code>/anmelden AU-2025-0001</code>\n\n` +
          `<b>Weitere Befehle:</b>\n` +
          `/status — Auftragsstatus abfragen\n` +
          `/abmelden — Benachrichtigungen deaktivieren\n` +
          `/hilfe — Hilfe anzeigen`
        )
        return NextResponse.json({ ok: true })
      }

      // Deep-Link: Auftrag per ID suchen
      const auftrag = await prisma.auftrag.findUnique({
        where: { id: auftragId },
        select: { id: true, nummer: true, titel: true, waldbesitzer: true, status: true },
      })

      if (!auftrag) {
        await sendMessage(
          chatId,
          `❌ Auftrag nicht gefunden.\n\nBitte überprüfen Sie den Link oder kontaktieren Sie uns unter info@koch-aufforstung.de`
        )
        return NextResponse.json({ ok: true })
      }

      await registerChat(chatId, auftrag, firstName)
      return NextResponse.json({ ok: true })
    }

    // /anmelden <auftragsnummer> — Verknüpfung via Auftragsnummer
    if (text.startsWith("/anmelden")) {
      const parts = text.split(" ")
      const nummer = parts.slice(1).join(" ").trim()

      if (!nummer) {
        await sendMessage(
          chatId,
          `Bitte geben Sie Ihre Auftragsnummer an.\n\n` +
          `<b>Beispiel:</b> <code>/anmelden AU-2025-0001</code>\n\n` +
          `Die Auftragsnummer finden Sie auf Ihrer Auftragsbestätigung oder Rechnung.`
        )
        return NextResponse.json({ ok: true })
      }

      // Auftrag per Nummer suchen (case-insensitive)
      const auftrag = await prisma.auftrag.findFirst({
        where: {
          nummer: { equals: nummer, mode: "insensitive" },
          deletedAt: null,
        },
        select: { id: true, nummer: true, titel: true, waldbesitzer: true, status: true },
      })

      if (!auftrag) {
        await sendMessage(
          chatId,
          `❌ Kein Auftrag mit der Nummer <b>${escapeHtml(nummer)}</b> gefunden.\n\n` +
          `Bitte überprüfen Sie die Nummer (z.B. AU-2025-0001) oder kontaktieren Sie uns unter info@koch-aufforstung.de`
        )
        return NextResponse.json({ ok: true })
      }

      await registerChat(chatId, auftrag, firstName)
      return NextResponse.json({ ok: true })
    }

    // /status — Aktuellen Status abfragen
    if (text === "/status" || text.startsWith("/status")) {
      const registrierung = await prisma.telegramRegistrierung.findUnique({
        where: { chatId },
      })

      if (!registrierung?.auftragId || !registrierung.aktiv) {
        await sendMessage(
          chatId,
          `❓ Sie haben keinen aktiven Auftrag registriert.\n\n` +
          `Registrieren Sie sich mit:\n<code>/anmelden AU-2025-0001</code>`
        )
        return NextResponse.json({ ok: true })
      }

      const auftrag = await prisma.auftrag.findUnique({
        where: { id: registrierung.auftragId },
        select: {
          id: true, nummer: true, titel: true, status: true,
          standort: true, flaeche_ha: true, startDatum: true, endDatum: true,
        },
      })

      if (!auftrag) {
        await sendMessage(chatId, `❌ Auftrag nicht mehr gefunden. Möglicherweise wurde er archiviert.`)
        return NextResponse.json({ ok: true })
      }

      const statusEmoji = getStatusEmoji(auftrag.status)
      await sendMessage(
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

    // /abmelden — Benachrichtigungen deaktivieren
    if (text === "/abmelden" || text.startsWith("/abmelden")) {
      const registrierung = await prisma.telegramRegistrierung.findUnique({
        where: { chatId },
      })

      if (!registrierung || !registrierung.aktiv) {
        await sendMessage(chatId, `ℹ️ Sie haben keine aktiven Benachrichtigungen.`)
        return NextResponse.json({ ok: true })
      }

      await prisma.telegramRegistrierung.update({
        where: { chatId },
        data: { aktiv: false },
      })

      // Remove chatId from Auftrag if set
      if (registrierung.auftragId) {
        await prisma.auftrag.updateMany({
          where: { id: registrierung.auftragId, telegramChatId: chatId },
          data: { telegramChatId: null },
        })
      }

      await sendMessage(
        chatId,
        `✅ Benachrichtigungen deaktiviert.\n\n` +
        `Sie erhalten keine weiteren Updates. Um sich erneut anzumelden:\n<code>/anmelden AU-2025-0001</code>`
      )
      return NextResponse.json({ ok: true })
    }

    // /hilfe oder /help
    if (text === "/hilfe" || text === "/help") {
      await sendMessage(
        chatId,
        `<b>🌲 Koch Aufforstung Bot</b>\n\n` +
        `<b>Verfügbare Befehle:</b>\n` +
        `/anmelden <i>Auftragsnummer</i> — Für Updates registrieren\n` +
        `/status — Aktuellen Auftragsstatus anzeigen\n` +
        `/abmelden — Benachrichtigungen deaktivieren\n` +
        `/hilfe — Diese Hilfe anzeigen\n\n` +
        `<b>Kontakt:</b>\n` +
        `📧 info@koch-aufforstung.de\n` +
        `🌐 www.koch-aufforstung.de`
      )
      return NextResponse.json({ ok: true })
    }

    // Unbekannter Befehl
    await sendMessage(
      chatId,
      `Ich habe Sie leider nicht verstanden. 🤔\n\n` +
      `Verfügbare Befehle:\n` +
      `/anmelden <i>Auftragsnummer</i> — Registrieren\n` +
      `/status — Auftragsstatus abfragen\n` +
      `/hilfe — Hilfe anzeigen`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Telegram Webhook] Fehler:", err)
    return NextResponse.json({ ok: true })
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function registerChat(
  chatId: string,
  auftrag: { id: string; nummer: string | null; titel: string; waldbesitzer: string | null; status: string },
  firstName: string
): Promise<void> {
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

  await prisma.auftrag.update({
    where: { id: auftrag.id },
    data: { telegramChatId: chatId },
  })

  await sendMessage(
    chatId,
    `<b>✅ Verknüpfung erfolgreich!</b>\n\n` +
    `Hallo ${firstName}, Sie erhalten jetzt Updates zu:\n\n` +
    `<b>Auftrag:</b> #${auftrag.nummer ?? auftrag.id}\n` +
    (auftrag.titel ? `<b>Titel:</b> ${auftrag.titel}\n` : "") +
    `<b>Aktueller Status:</b> ${getStatusEmoji(auftrag.status)} ${formatStatus(auftrag.status)}\n\n` +
    `Mit /status können Sie jederzeit den aktuellen Stand abfragen.\n` +
    `Mit /abmelden können Sie Benachrichtigungen deaktivieren.`
  )
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    anfrage: "Anfrage eingegangen",
    bestaetigt: "Bestätigt",
    geplant: "Geplant",
    in_planung: "In Planung",
    in_arbeit: "In Arbeit",
    in_ausfuehrung: "In Ausführung",
    laufend: "Laufend",
    abnahme: "Abnahme",
    abgeschlossen: "Abgeschlossen",
    abgebrochen: "Abgebrochen",
    pausiert: "Pausiert",
  }
  return labels[status] ?? status
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    anfrage: "📋",
    bestaetigt: "✅",
    geplant: "📅",
    in_planung: "📅",
    in_arbeit: "🌱",
    in_ausfuehrung: "🌱",
    laufend: "🌱",
    abnahme: "🔍",
    abgeschlossen: "🎉",
    abgebrochen: "❌",
    pausiert: "⏸️",
  }
  return emojis[status] ?? "📄"
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
