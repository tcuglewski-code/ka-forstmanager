/**
 * A8 Rechnungs-Agent — Versand (REC-006)
 *
 * POST /api/rechnungen/:id/senden
 *
 * 1. Zahlungslink erzeugen (Zipayo + GiroCode-Fallback, REC-005b).
 * 2. ZUGFeRD-PDF rendern (REC-004) und per E-Mail an den Waldbesitzer senden.
 * 3. gesendetAm/zipayoLink persistieren, Status → "gesendet", faelligAm setzen.
 *
 * Nur freigegebene (gesperrte) Rechnungen dürfen versendet werden.
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdminOrGF } from "@/lib/permissions"
import { generateRechnungsPdf } from "@/lib/rechnungen/pdf"
import { erstelleZahlungsLink } from "@/lib/rechnungen/zipayo-link"
import { sendEmail, rechnungEmailHtml } from "@/lib/email"

const ZAHLUNGSZIEL_TAGE = 14

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const rechnung = await prisma.rechnung.findUnique({
    where: { id },
    select: { id: true, nummer: true, status: true, deletedAt: true, freigegebenAm: true, faelligAm: true, bruttoBetrag: true, betrag: true },
  })
  if (!rechnung) return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
  if (rechnung.deletedAt) return NextResponse.json({ error: "Rechnung ist gelöscht" }, { status: 400 })
  if (rechnung.status === "storniert") return NextResponse.json({ error: "Stornierte Rechnung kann nicht versendet werden" }, { status: 400 })
  if (!rechnung.freigegebenAm) {
    return NextResponse.json({ error: "Rechnung muss vor Versand freigegeben werden (REC-013)", code: "NOT_RELEASED" }, { status: 409 })
  }

  // PDF erzeugen (liefert auch Kundendaten + Bruttobetrag)
  let pdf
  try {
    pdf = await generateRechnungsPdf(id)
  } catch (error) {
    console.error("[A8-SENDEN] PDF:", error)
    return NextResponse.json({ error: "PDF-Erzeugung fehlgeschlagen" }, { status: 500 })
  }

  if (!pdf.kundenEmail) {
    return NextResponse.json({ error: "Keine E-Mail-Adresse des Waldbesitzers hinterlegt — Versand nicht möglich.", code: "NO_RECIPIENT" }, { status: 422 })
  }

  // Zahlungslink (Zipayo + Fallback)
  const zahlung = await erstelleZahlungsLink({
    rechnungNummer: pdf.nummer,
    betrag: pdf.brutto,
    kundenName: pdf.kundenName,
    kundenEmail: pdf.kundenEmail,
  })

  const faelligAm = rechnung.faelligAm ?? new Date(Date.now() + ZAHLUNGSZIEL_TAGE * 24 * 60 * 60 * 1000)

  // E-Mail mit PDF-Anhang
  const htmlBasis = rechnungEmailHtml({
    rechnungNummer: pdf.nummer,
    kundenName: pdf.kundenName,
    betrag: pdf.brutto,
    faelligAm: faelligAm.toISOString(),
  })
  const html = zahlung.link
    ? htmlBasis.replace("</body>", `<div style="max-width:600px;margin:0 auto;padding:0 20px"><a href="${zahlung.link}" style="display:inline-block;padding:12px 24px;background:#C5A55A;color:#2C3A1C;text-decoration:none;border-radius:4px;font-weight:bold">Jetzt online bezahlen</a></div></body>`)
    : htmlBasis

  const mail = await sendEmail({
    to: pdf.kundenEmail,
    subject: `Ihre Rechnung ${pdf.nummer} — Koch Aufforstung`,
    html,
    attachments: [{ filename: pdf.dateiname, content: Buffer.from(pdf.bytes), contentType: "application/pdf" }],
  })

  if (mail.error) {
    return NextResponse.json({ error: `E-Mail-Versand fehlgeschlagen: ${mail.error}` }, { status: 502 })
  }

  const jetzt = new Date()
  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.rechnung.update({
      where: { id },
      data: {
        status: "gesendet",
        gesendetAm: jetzt,
        faelligAm,
        zipayoLink: zahlung.link ?? undefined,
      },
    })
    await tx.rechnungAuditLog.create({
      data: {
        rechnungId: id,
        action: "VERSAND",
        field: "status",
        oldValue: JSON.stringify(rechnung.status),
        newValue: JSON.stringify({ status: "gesendet", empfaenger: "[REDACTED]", zahlungsQuelle: zahlung.quelle, mailSkipped: mail.skipped ?? false, zugferd: pdf.zugferdEmbedded }),
        userId: session.user?.id ?? null,
        userName: session.user?.name ?? null,
      },
    })
    return r
  })

  return NextResponse.json({
    ok: true,
    rechnung: { id: updated.id, nummer: updated.nummer, status: updated.status, gesendetAm: updated.gesendetAm, faelligAm: updated.faelligAm },
    zahlung: { quelle: zahlung.quelle, link: zahlung.link, hinweis: zahlung.hinweis },
    mail: { skipped: mail.skipped ?? false, messageId: mail.messageId ?? null },
  })
}
