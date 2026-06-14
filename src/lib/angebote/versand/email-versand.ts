/**
 * A1 — Angebots-Versand per E-Mail (ANG-029)
 * Sendet das Angebot mit PDF-Anhang + DSGVO-konformem Tracking (Pixel + Portal-
 * Link). Tracking-Token/Pixel werden vorher erzeugt. Follow-ups werden geplant.
 * Versand nur für freigegebene Angebote (Mensch-im-Loop).
 */
import { prisma } from "@/lib/prisma"
import { generateToken, getConfig, CONFIG_KEYS } from "@/lib/angebote/config"
import { generiereAngebotPdf, type AngebotPdfDaten } from "@/lib/angebote/pdf/angebot-pdf"

export interface VersandErgebnis {
  ok: boolean
  versendetAm?: Date
  fehler?: string
  trackingToken?: string
}

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://ka-forstmanager.vercel.app"
  ).replace(/\/$/, "")
}

function fmtDatum(d: Date | null | undefined): string {
  if (!d) return ""
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** Plant die drei Follow-up-Stufen anhand der konfigurierten Intervalle. */
async function planeFollowUps(angebotId: string): Promise<void> {
  const aktiv = (await getConfig(CONFIG_KEYS.followupAktiv)) === "true"
  if (!aktiv) return
  const tage = [
    parseInt((await getConfig(CONFIG_KEYS.followupIntervall1)) || "3", 10),
    parseInt((await getConfig(CONFIG_KEYS.followupIntervall2)) || "7", 10),
    parseInt((await getConfig(CONFIG_KEYS.followupIntervall3)) || "14", 10),
  ]
  const typen = ["reminder", "alternativangebot", "abschluss"]
  await prisma.angebotsFollowUp.deleteMany({ where: { angebotId, status: "offen" } })
  const now = Date.now()
  await prisma.angebotsFollowUp.createMany({
    data: tage.map((t, i) => ({
      angebotId,
      stufe: i + 1,
      typ: typen[i],
      faelligAm: new Date(now + t * 24 * 60 * 60 * 1000),
      status: "offen",
    })),
  })
}

export async function versendeAngebot(angebotId: string, empfaengerEmail?: string): Promise<VersandErgebnis> {
  const angebot = await prisma.angebot.findUnique({
    where: { id: angebotId },
    include: { positionen: { orderBy: { reihenfolge: "asc" } }, varianten: { orderBy: { gesamtNetto: "asc" } } },
  })
  if (!angebot) return { ok: false, fehler: "Angebot nicht gefunden" }

  if (angebot.status !== "freigegeben") {
    return { ok: false, fehler: "Angebot muss zuerst freigegeben werden" }
  }
  const to = empfaengerEmail || angebot.waldbesitzerEmail
  if (!to) return { ok: false, fehler: "Keine Empfänger-E-Mail" }

  // Tracking-Token/Pixel erzeugen (falls noch nicht vorhanden)
  const trackingToken = angebot.trackingToken ?? generateToken()
  const trackingPixelId = angebot.trackingPixelId ?? generateToken()

  // Firmen-Stammdaten
  const cfgRows = await prisma.systemConfig.findMany({
    where: { key: { in: ["firma_name", "firma_adresse", "firma_email"] } },
  })
  const cfg: Record<string, string> = {}
  for (const c of cfgRows) cfg[c.key] = c.value

  const netto = angebot.gesamtNetto ?? 0
  const mwst = angebot.mwstBetrag ?? 0
  const brutto = angebot.gesamtpreis ?? netto + mwst

  const pdfDaten: AngebotPdfDaten = {
    nummer: angebot.nummer ?? "OHNE-NR",
    datum: fmtDatum(angebot.createdAt),
    gueltigBis: fmtDatum(angebot.gueltigBis),
    empfaenger: angebot.waldbesitzerName ?? "Waldbesitzer:in",
    beschreibung: angebot.beschreibung ?? undefined,
    positionen: angebot.positionen.map((p) => ({
      bezeichnung: p.bezeichnung,
      menge: p.menge,
      einheit: p.einheit,
      einzelpreis: p.einzelpreis,
      gesamtpreis: p.gesamtpreis,
      mwstSatz: p.mwstSatz,
    })),
    gesamtNetto: netto,
    mwstBetrag: mwst,
    gesamtBrutto: brutto,
    foerderHinweis: angebot.foerderHinweis,
    varianten: angebot.varianten.map((v) => ({
      stufe: v.stufe,
      titel: v.titel ?? v.stufe,
      gesamtNetto: v.gesamtNetto,
      gesamtBrutto: v.gesamtBrutto,
    })),
    firma: { name: cfg.firma_name ?? "Koch Aufforstung GmbH", adresse: cfg.firma_adresse, email: cfg.firma_email },
  }

  const pdfBytes = await generiereAngebotPdf(pdfDaten)

  const portalUrl = `${baseUrl()}/angebot/${trackingToken}`
  const pixelUrl = `${baseUrl()}/api/angebote/track/${trackingPixelId}`
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#2C3A1C;">
      <div style="background:#2C3A1C;color:#fff;padding:20px;">
        <h1 style="margin:0;font-size:20px;">${cfg.firma_name ?? "Koch Aufforstung GmbH"}</h1>
      </div>
      <div style="padding:20px;">
        <p>Guten Tag ${angebot.waldbesitzerName ?? ""},</p>
        <p>anbei unser Angebot <strong>${angebot.nummer ?? ""}</strong> für Ihr Aufforstungsvorhaben.
        Die Details finden Sie im angehängten PDF.</p>
        <p style="margin:24px 0;">
          <a href="${portalUrl}" style="background:#C5A55A;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Angebot online ansehen
          </a>
        </p>
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        <p>Mit freundlichen Grüßen<br>${cfg.firma_name ?? "Koch Aufforstung GmbH"}</p>
      </div>
      ${angebot.trackingOptOut ? "" : `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`}
    </div>`

  // Versand via Resend (falls konfiguriert)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: cfg.firma_email
          ? `${cfg.firma_name ?? "Koch Aufforstung"} <${cfg.firma_email}>`
          : "Koch Aufforstung <noreply@koch-aufforstung.de>",
        to,
        subject: `Ihr Angebot ${angebot.nummer ?? ""} – ${cfg.firma_name ?? "Koch Aufforstung"}`,
        html,
        attachments: [
          { filename: `Angebot-${angebot.nummer ?? "OHNE-NR"}.pdf`, content: Buffer.from(pdfBytes) },
        ],
      })
    } catch (e) {
      return { ok: false, fehler: `E-Mail-Versand fehlgeschlagen: ${(e as Error).message}` }
    }
  }

  const versendetAm = new Date()
  await prisma.angebot.update({
    where: { id: angebotId },
    data: { status: "versendet", versendetAm, trackingToken, trackingPixelId },
  })
  await prisma.angebotsTracking.create({
    data: { angebotId, ereignis: "gesendet" },
  })
  await planeFollowUps(angebotId)

  return { ok: true, versendetAm, trackingToken }
}
