/**
 * Telegram Bot Notification Helper
 * Sprint: Telegram Kundenbenachrichtigungen
 */

import { prisma } from "@/lib/prisma"

const TELEGRAM_API = "https://api.telegram.org/bot"
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ""
const ADMIN_CHAT_IDS = process.env.TELEGRAM_ADMIN_CHAT_IDS ?? ""

/**
 * Status-Texte für Kunden (Deutsch)
 */
const STATUS_TEXTE: Record<string, string> = {
  anfrage: "Ihre Anfrage wurde eingegangen 📋",
  bestaetigt: "Ihr Auftrag wurde bestätigt ✅",
  in_planung: "Ihr Auftrag wird geplant 📅",
  in_arbeit: "Die Pflanzarbeiten haben begonnen 🌱",
  abgeschlossen: "Ihr Auftrag wurde erfolgreich abgeschlossen 🎉",
  abgebrochen: "Ihr Auftrag wurde leider storniert ❌",
  pausiert: "Ihr Auftrag wurde pausiert ⏸️",
}

/**
 * Sendet eine Nachricht via Telegram Bot API
 */
export async function sendTelegramNotification(
  chatId: string,
  message: string
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn("[Telegram] BOT_TOKEN nicht konfiguriert")
    return false
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[Telegram] Fehler beim Senden:", err)
      return false
    }

    return true
  } catch (err) {
    console.error("[Telegram] Exception:", err)
    return false
  }
}

/**
 * Benachrichtigt alle registrierten Nutzer bei Auftrags-Statusänderung
 * Fire-and-forget: Blockiert nicht den API-Response
 */
export async function notifyAuftragStatusChange(
  auftragId: string,
  newStatus: string,
  oldStatus?: string
): Promise<void> {
  // Nicht benachrichtigen wenn Status gleich
  if (oldStatus && oldStatus === newStatus) return

  try {
    // Auftrag-Details holen
    const auftrag = await prisma.auftrag.findUnique({
      where: { id: auftragId },
      select: {
        id: true,
        nummer: true,
        titel: true,
        waldbesitzer: true,
        telegramChatId: true,
      },
    })

    if (!auftrag) return

    // Status-Text generieren
    const statusText = STATUS_TEXTE[newStatus] ?? `Status: ${newStatus}`
    const message = `<b>Koch Aufforstung</b>\n\n` +
      `${statusText}\n\n` +
      `<b>Auftrag:</b> ${auftrag.nummer ?? auftrag.id}\n` +
      (auftrag.titel ? `<b>Titel:</b> ${auftrag.titel}\n` : "") +
      `\nBei Fragen erreichen Sie uns unter info@koch-aufforstung.de`

    // Alle registrierten ChatIds für diesen Auftrag holen
    const registrierungen = await prisma.telegramRegistrierung.findMany({
      where: {
        auftragId: auftragId,
        aktiv: true,
      },
      select: { chatId: true },
    })

    // Chat-IDs sammeln
    const chatIds = new Set<string>()
    
    // Direkt am Auftrag hinterlegte Chat-ID
    if (auftrag.telegramChatId) {
      chatIds.add(auftrag.telegramChatId)
    }
    
    // Registrierungen
    for (const reg of registrierungen) {
      chatIds.add(reg.chatId)
    }

    // Alle Benachrichtigungen parallel senden
    const promises = Array.from(chatIds).map((chatId) =>
      sendTelegramNotification(chatId, message)
    )

    await Promise.allSettled(promises)
  } catch (err) {
    console.error("[Telegram] notifyAuftragStatusChange Fehler:", err)
  }
}

/**
 * Benachrichtigt Admins über neue Anfragen (z.B. vom Website-Wizard)
 */
export async function notifyAdminsNewAuftrag(
  auftragId: string,
  auftragNummer: string,
  waldbesitzer: string,
  bundesland?: string,
  flaeche?: number
): Promise<void> {
  if (!ADMIN_CHAT_IDS) {
    console.warn("[Telegram] ADMIN_CHAT_IDS nicht konfiguriert")
    return
  }

  const adminIds = ADMIN_CHAT_IDS.split(",").map((id) => id.trim()).filter(Boolean)
  if (adminIds.length === 0) return

  const message = `<b>🌲 Neue Anfrage eingegangen!</b>\n\n` +
    `<b>Auftrag:</b> ${auftragNummer}\n` +
    `<b>Waldbesitzer:</b> ${waldbesitzer}\n` +
    (bundesland ? `<b>Bundesland:</b> ${bundesland}\n` : "") +
    (flaeche ? `<b>Fläche:</b> ${flaeche} ha\n` : "") +
    `\n<a href="https://ka-forstmanager.vercel.app/auftraege/${auftragId}">Im ForstManager öffnen</a>`

  const promises = adminIds.map((chatId) =>
    sendTelegramNotification(chatId, message)
  )

  await Promise.allSettled(promises)
}
