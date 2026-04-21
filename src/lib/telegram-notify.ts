/**
 * Direktes Telegram-Benachrichtigungs-System — KEIN LLM!
 * Sendet Event-basierte Nachrichten direkt über die Telegram Bot API.
 *
 * NUR für Koch Aufforstung Mitarbeiter-Benachrichtigungen!
 * Erlaubte Events: auftrag_erstellt, auftrag_abgeschlossen, rechnung_erstellt,
 *   zahlung_eingegangen, mitarbeiter_eingestempelt, protokoll_eingereicht
 *
 * TELEGRAM_CHAT_ID_KA muss auf den Koch Aufforstung Mitarbeiter-Gruppen-Chat
 * gesetzt sein, NICHT auf Tomeks privaten Chat (977688457).
 *
 * Zwei Telegram-Kanäle:
 * A) Amadeus-Kanal: OpenClaw → LLM (existiert, nutzt API-Tokens)
 * B) KA-Bot-Kanal: Direkte Telegram-API → Kein LLM (DIESES SYSTEM)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KA || '8788038095:AAF2h8l8U02HeaPvjvVl6HJ3gPfxM9ldNuY'
const CHAT_ID = process.env.TELEGRAM_CHAT_ID_KA || ''
const IS_DEV = process.env.NODE_ENV === 'development'

export type EventType =
  | 'auftrag_erstellt'
  | 'auftrag_abgeschlossen'
  | 'rechnung_erstellt'
  | 'zahlung_eingegangen'
  | 'mitarbeiter_eingestempelt'
  | 'protokoll_eingereicht'

interface NotifyOptions {
  event: EventType
  data: Record<string, string | number>
  chatId?: string
}

const TEMPLATES: Record<EventType, (data: Record<string, string | number>) => string> = {
  auftrag_erstellt: (d) =>
    `🌲 *Neuer Auftrag*\n📋 ${d.name}\n👤 ${d.kunde}\n📅 ${d.datum}`,
  auftrag_abgeschlossen: (d) =>
    `✅ *Auftrag abgeschlossen*\n📋 ${d.name}\n👤 ${d.mitarbeiter}`,
  rechnung_erstellt: (d) =>
    `🧾 *Rechnung erstellt*\nNr\\. ${d.nummer}\n💶 ${d.betrag}€`,
  zahlung_eingegangen: (d) =>
    `💰 *Zahlung eingegangen*\nNr\\. ${d.nummer}\n💶 ${d.betrag}€`,
  mitarbeiter_eingestempelt: (d) =>
    `⏰ *Eingestempelt*\n👤 ${d.name}\n📍 ${d.ort}`,
  protokoll_eingereicht: (d) =>
    `📝 *Protokoll*\n📋 ${d.auftrag}\n👤 ${d.ersteller}`,
}

export async function sendKANotification(options: NotifyOptions): Promise<boolean> {
  const token = BOT_TOKEN
  const chatId = options.chatId || CHAT_ID

  if (!token || !chatId) {
    console.warn('[TG-KA] Bot-Token oder Chat-ID fehlt — Nachricht nicht gesendet')
    return false
  }

  const text = TEMPLATES[options.event](options.data)

  // In development: nur loggen, nicht senden
  if (IS_DEV) {
    console.log(`[TG-KA][DEV] ${options.event} → würde senden an ${chatId}:`, text)
    return true
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[TG-KA] API Error:', res.status, err)
      return false
    }

    return true
  } catch (err) {
    console.error('[TG-KA] Send error:', err)
    return false
  }
}
