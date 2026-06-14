/**
 * A1 — Follow-up-Verarbeitung (ANG-030)
 * Verarbeitet fällige Follow-ups: erzeugt (LLM, Zod-abgesichert) einen Erinnerungs-
 * text und versendet ihn. Wird vom Cron aufgerufen. Bricht ab, wenn das Angebot
 * bereits angenommen/abgelehnt ist.
 */
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { pseudonymizePrompt } from "@/lib/pseudonymize"
import { logAiCall } from "@/lib/ai-audit"
import { ANGEBOTE_KI_MODEL_FAST, KI_ENABLED } from "@/lib/angebote/config"
import { FollowUpTextSchema, parseLlmJson, type FollowUpText } from "@/lib/angebote/zod-schemas"

const TERMINAL_STATUS = new Set(["angenommen", "abgelehnt"])

function fallbackText(stufe: number, nummer: string): FollowUpText {
  const betreff = `Erinnerung: Ihr Angebot ${nummer}`
  const text =
    stufe === 1
      ? "wir möchten kurz nachfragen, ob Sie unser Angebot erhalten haben und ob Fragen offen sind."
      : stufe === 2
        ? "gerne passen wir das Angebot an Ihre Wünsche an – melden Sie sich einfach bei uns."
        : "falls weiterhin Interesse besteht, lassen Sie uns die nächsten Schritte besprechen."
  return FollowUpTextSchema.parse({ betreff, text })
}

async function erzeugeText(stufe: number, nummer: string, name: string | null): Promise<FollowUpText> {
  if (!KI_ENABLED || !process.env.ANTHROPIC_API_KEY) return fallbackText(stufe, nummer)
  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: { "x-anthropic-no-store": "true" },
    })
    const promptText = `Follow-up Stufe ${stufe} für Angebot ${nummer}, Kunde: ${name ?? "unbekannt"}`
    const { text: pseudo } = pseudonymizePrompt(promptText)
    const response = await client.messages.create({
      model: ANGEBOTE_KI_MODEL_FAST,
      max_tokens: 512,
      system: `Du schreibst freundliche, kurze deutsche Follow-up-E-Mails für Angebote eines
Aufforstungsbetriebs. KEINE neuen Preise, KEINE Garantien. Gib NUR JSON zurück:
{"betreff": string, "text": string}. Der "text" ist der Mail-Body OHNE Anrede/Gruß.`,
      messages: [{ role: "user", content: `<UNTRUSTED_INPUT>\n${pseudo}\n</UNTRUSTED_INPUT>` }],
    })
    const inTok = response.usage?.input_tokens ?? 0
    const outTok = response.usage?.output_tokens ?? 0
    await logAiCall({
      prompt: promptText,
      model: ANGEBOTE_KI_MODEL_FAST,
      tokenCount: inTok + outTok,
      route: "/api/cron/angebote-followup",
    })
    const block = response.content[0]
    const raw = block && block.type === "text" ? block.text : ""
    const parsed = parseLlmJson(FollowUpTextSchema, raw)
    return parsed.ok ? parsed.data : fallbackText(stufe, nummer)
  } catch {
    return fallbackText(stufe, nummer)
  }
}

export interface FollowUpLauf {
  geprueft: number
  gesendet: number
  uebersprungen: number
}

export async function verarbeiteFaelligeFollowUps(jetzt = new Date()): Promise<FollowUpLauf> {
  const faellige = await prisma.angebotsFollowUp.findMany({
    where: { status: "offen", faelligAm: { lte: jetzt } },
    include: { angebot: { select: { id: true, nummer: true, status: true, waldbesitzerName: true, waldbesitzerEmail: true, trackingOptOut: true } } },
    take: 100,
  })

  let gesendet = 0
  let uebersprungen = 0

  for (const fu of faellige) {
    const a = fu.angebot
    // Angebot bereits abgeschlossen → Follow-up überspringen
    if (TERMINAL_STATUS.has(a.status)) {
      await prisma.angebotsFollowUp.update({ where: { id: fu.id }, data: { status: "uebersprungen" } })
      uebersprungen++
      continue
    }
    if (!a.waldbesitzerEmail) {
      await prisma.angebotsFollowUp.update({
        where: { id: fu.id },
        data: { status: "uebersprungen", notiz: "Keine E-Mail" },
      })
      uebersprungen++
      continue
    }

    const txt = await erzeugeText(fu.stufe, a.nummer ?? "", a.waldbesitzerName)

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: "Koch Aufforstung <noreply@koch-aufforstung.de>",
          to: a.waldbesitzerEmail,
          subject: txt.betreff,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#2C3A1C;">
            <p>Guten Tag ${a.waldbesitzerName ?? ""},</p>
            <p>${txt.text}</p>
            <p>Mit freundlichen Grüßen<br>Koch Aufforstung GmbH</p></div>`,
        })
      } catch {
        // Bei Versandfehler offen lassen für nächsten Lauf
        continue
      }
    }

    await prisma.angebotsFollowUp.update({
      where: { id: fu.id },
      data: { status: "gesendet", gesendetAm: new Date() },
    })
    await prisma.angebotsTracking.create({ data: { angebotId: a.id, ereignis: "link_geklickt", userAgent: `followup-${fu.stufe}` } })
    gesendet++
  }

  return { geprueft: faellige.length, gesendet, uebersprungen }
}
