/**
 * A1 — Angebots-PDF Generator (ANG-025)
 * Markenkonformes Angebots-PDF (Koch Aufforstung: Waldgrün/Gold) mit pdf-lib.
 * Enthält Pflicht-Geschäftsangaben, Positionstabelle, Netto/MwSt/Brutto sowie
 * optional eine Gut/Besser/Best-Übersicht. Ausschließlich Koch-Aufforstung-Marke (CLAUDE.md).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

const WALDGRUEN = rgb(0x2c / 255, 0x3a / 255, 0x1c / 255)
const GOLD = rgb(0xc5 / 255, 0xa5 / 255, 0x5a / 255)
const SCHWARZ = rgb(0.1, 0.1, 0.1)

export interface AngebotPdfPosition {
  bezeichnung: string
  menge: number
  einheit: string
  einzelpreis: number
  gesamtpreis: number
  mwstSatz: number
}

export interface AngebotPdfVariante {
  stufe: string
  titel: string
  gesamtNetto: number
  gesamtBrutto: number
}

export interface AngebotPdfDaten {
  nummer: string
  datum: string // DD.MM.YYYY
  gueltigBis?: string
  empfaenger: string
  beschreibung?: string
  positionen: AngebotPdfPosition[]
  gesamtNetto: number
  mwstBetrag: number
  gesamtBrutto: number
  foerderHinweis?: string | null
  varianten?: AngebotPdfVariante[]
  firma: { name: string; adresse?: string; email?: string }
}

function san(t: string | null | undefined): string {
  if (!t) return ""
  return t.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim()
}

function eur(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR"
}

export async function generiereAngebotPdf(daten: AngebotPdfDaten): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  let page = pdf.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  const margin = 50
  let y = height - margin

  const text = (s: string, x: number, yy: number, size: number, f: PDFFont = font, color = SCHWARZ) =>
    page.drawText(san(s), { x, y: yy, size, font: f, color })
  const textRight = (s: string, xr: number, yy: number, size: number, f: PDFFont = font, color = SCHWARZ) => {
    const w = f.widthOfTextAtSize(san(s), size)
    page.drawText(san(s), { x: xr - w, y: yy, size, font: f, color })
  }
  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 60) {
      page = pdf.addPage([595.28, 841.89])
      y = height - margin
    }
  }

  // ── Marken-Balken oben ──
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: WALDGRUEN })

  // ── Header: Firma ──
  text(daten.firma.name || "Koch Aufforstung GmbH", margin, y, 15, bold, WALDGRUEN)
  y -= 15
  if (daten.firma.adresse) {
    text(daten.firma.adresse, margin, y, 8)
    y -= 11
  }
  if (daten.firma.email) {
    text(daten.firma.email, margin, y, 8)
    y -= 11
  }
  y -= 18

  // ── Titel + Nummer ──
  text("ANGEBOT", margin, y, 20, bold, WALDGRUEN)
  textRight(`Nr. ${daten.nummer}`, width - margin, y, 12, bold)
  y -= 16
  textRight(`Datum: ${daten.datum}`, width - margin, y, 9)
  y -= 11
  if (daten.gueltigBis) {
    textRight(`Gültig bis: ${daten.gueltigBis}`, width - margin, y, 9)
  }
  y -= 24

  // ── Empfänger ──
  text("Für:", margin, y, 8)
  y -= 13
  text(daten.empfaenger || "Waldbesitzer:in", margin, y, 11, bold)
  y -= 22

  if (daten.beschreibung) {
    text(daten.beschreibung, margin, y, 9, font, GOLD)
    y -= 18
  }

  // ── Goldene Trennlinie ──
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: GOLD })
  y -= 18

  // ── Positionstabelle ──
  const col = { pos: margin, desc: margin + 28, menge: 320, einheit: 370, preis: 470, gesamt: width - margin }
  text("Pos", col.pos, y, 8, bold, WALDGRUEN)
  text("Leistung", col.desc, y, 8, bold, WALDGRUEN)
  text("Menge", col.menge, y, 8, bold, WALDGRUEN)
  text("Einh.", col.einheit, y, 8, bold, WALDGRUEN)
  textRight("Einzelpreis", col.preis + 30, y, 8, bold, WALDGRUEN)
  textRight("Gesamt", col.gesamt, y, 8, bold, WALDGRUEN)
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.4, color: SCHWARZ })
  y -= 14

  daten.positionen.forEach((p, i) => {
    ensureSpace(16)
    const maxW = col.menge - col.desc - 8
    let desc = san(p.bezeichnung) || "Position"
    while (font.widthOfTextAtSize(desc, 9) > maxW && desc.length > 3) desc = desc.slice(0, -4) + "..."
    text(String(i + 1), col.pos, y, 9)
    text(desc, col.desc, y, 9)
    text(p.menge.toLocaleString("de-DE"), col.menge, y, 9)
    text(p.einheit, col.einheit, y, 9)
    textRight(eur(p.einzelpreis), col.preis + 30, y, 9)
    textRight(eur(p.gesamtpreis), col.gesamt, y, 9)
    y -= 16
  })

  y -= 6
  page.drawLine({ start: { x: 300, y }, end: { x: width - margin, y }, thickness: 0.4, color: SCHWARZ })
  y -= 16

  // ── Summen ──
  text("Nettobetrag:", 300, y, 9)
  textRight(eur(daten.gesamtNetto), width - margin, y, 9)
  y -= 14
  text("zzgl. MwSt:", 300, y, 9)
  textRight(eur(daten.mwstBetrag), width - margin, y, 9)
  y -= 4
  page.drawLine({ start: { x: 300, y }, end: { x: width - margin, y }, thickness: 1, color: WALDGRUEN })
  y -= 16
  text("Gesamtbetrag:", 300, y, 11, bold, WALDGRUEN)
  textRight(eur(daten.gesamtBrutto), width - margin, y, 11, bold, WALDGRUEN)
  y -= 28

  // ── Varianten-Übersicht (optional) ──
  if (daten.varianten && daten.varianten.length > 0) {
    ensureSpace(80)
    text("Ihre Auswahlmöglichkeiten", margin, y, 11, bold, WALDGRUEN)
    y -= 16
    for (const v of daten.varianten) {
      ensureSpace(16)
      text(`${v.stufe.toUpperCase()} — ${san(v.titel)}`, margin, y, 9, bold)
      textRight(`${eur(v.gesamtBrutto)} (brutto)`, width - margin, y, 9)
      y -= 14
    }
    y -= 14
  }

  // ── Förderhinweis (Info-only) ──
  if (daten.foerderHinweis) {
    ensureSpace(40)
    page.drawRectangle({ x: margin, y: y - 4, width: width - 2 * margin, height: 2, color: GOLD })
    y -= 14
    text("Förderhinweis (unverbindlich):", margin, y, 8, bold, WALDGRUEN)
    y -= 12
    const words = san(daten.foerderHinweis).split(" ")
    let line = ""
    const maxW = width - 2 * margin
    for (const w of words) {
      const test = line ? line + " " + w : w
      if (font.widthOfTextAtSize(test, 8) > maxW) {
        text(line, margin, y, 8)
        y -= 11
        line = w
      } else line = test
    }
    if (line) {
      text(line, margin, y, 8)
      y -= 11
    }
    y -= 10
  }

  // ── Footer ──
  const footerY = margin
  page.drawLine({ start: { x: margin, y: footerY + 24 }, end: { x: width - margin, y: footerY + 24 }, thickness: 0.4, color: GOLD })
  text(
    `${daten.firma.name || "Koch Aufforstung GmbH"} · ${daten.firma.adresse ?? ""}`,
    margin,
    footerY + 12,
    7,
    font,
    WALDGRUEN
  )
  text("Dieses Angebot ist freibleibend. Alle Preise verstehen sich zzgl. gesetzlicher MwSt.", margin, footerY, 7)

  return await pdf.save()
}
