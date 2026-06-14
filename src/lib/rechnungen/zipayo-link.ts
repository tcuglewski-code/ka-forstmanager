/**
 * A8 Rechnungs-Agent — Zahlungslink (REC-005b)
 *
 * Erzeugt einen Online-Zahlungslink über Zipayo, sofern konfiguriert
 * (ZIPAYO_API_URL + ZIPAYO_API_KEY). Schlägt der Aufruf fehl oder ist
 * Zipayo nicht konfiguriert, wird ein EPC/GiroCode-Payload als deterministischer
 * Fallback zurückgegeben (Bank-Überweisung bleibt immer möglich → kein harter Fehler).
 *
 * NEVER #23: Antwort wird Zod-validiert, kein `as`-Cast.
 */
import { z } from "zod"
import { getFirmenStammdaten } from "./config"

const ZipayoResponseSchema = z.object({
  // Zipayo liefert i.d.R. eine Hosted-Payment-URL; Feldname defensiv geprüft
  url: z.string().url().optional(),
  paymentUrl: z.string().url().optional(),
  link: z.string().url().optional(),
})

export interface ZahlungsLinkErgebnis {
  link: string | null
  quelle: "zipayo" | "girocode" | "keiner"
  girocode: string | null
  hinweis?: string
}

/** EPC-QR (GiroCode) Payload als String-Fallback. */
function baueGiroCode(empfaenger: string, iban: string, bic: string, betrag: number, zweck: string): string {
  return [
    "BCD", "002", "1", "SCT",
    bic.replace(/\s/g, ""),
    empfaenger.substring(0, 70),
    iban.replace(/\s/g, ""),
    `EUR${betrag.toFixed(2)}`,
    "",
    zweck.substring(0, 140),
    "",
  ].join("\n")
}

export async function erstelleZahlungsLink(args: {
  rechnungNummer: string
  betrag: number
  kundenName: string
  kundenEmail?: string | null
}): Promise<ZahlungsLinkErgebnis> {
  const firma = getFirmenStammdaten()
  const zweck = `Rechnung ${args.rechnungNummer}`
  const girocode = firma.iban
    ? baueGiroCode(firma.name, firma.iban, firma.bic, args.betrag, zweck)
    : null

  const apiUrl = process.env.ZIPAYO_API_URL
  const apiKey = process.env.ZIPAYO_API_KEY

  if (!apiUrl || !apiKey) {
    return {
      link: null,
      quelle: girocode ? "girocode" : "keiner",
      girocode,
      hinweis: "Zipayo nicht konfiguriert — Zahlung per Überweisung/GiroCode.",
    }
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        amount: Math.round(args.betrag * 100), // Cent
        currency: "EUR",
        reference: args.rechnungNummer,
        description: zweck,
        customer: { name: args.kundenName, email: args.kundenEmail ?? undefined },
      }),
    })

    if (!res.ok) {
      console.error("[A8-ZIPAYO] HTTP", res.status)
      return { link: null, quelle: girocode ? "girocode" : "keiner", girocode, hinweis: `Zipayo-Fehler (${res.status}) — Fallback Überweisung.` }
    }

    const json = await res.json()
    const parsed = ZipayoResponseSchema.safeParse(json)
    const link = parsed.success ? (parsed.data.url || parsed.data.paymentUrl || parsed.data.link || null) : null

    if (!link) {
      return { link: null, quelle: girocode ? "girocode" : "keiner", girocode, hinweis: "Zipayo-Antwort ohne Link — Fallback Überweisung." }
    }

    return { link, quelle: "zipayo", girocode }
  } catch (error) {
    console.error("[A8-ZIPAYO] Aufruf fehlgeschlagen:", error instanceof Error ? error.message : error)
    return { link: null, quelle: girocode ? "girocode" : "keiner", girocode, hinweis: "Zipayo nicht erreichbar — Fallback Überweisung." }
  }
}
