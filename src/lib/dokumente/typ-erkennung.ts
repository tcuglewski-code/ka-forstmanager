/**
 * DOK-004: Dokumenten-Typ-Erkennung.
 *
 * Sprint 1: rein heuristisch, kein API-Call.
 * - XML-Dateien → XRECHNUNG
 * - PDF mit eingebettetem ZUGFeRD-XML → ZUGFERD
 * - PDF/Bild: Schlüsselwort-Heuristik auf Textauszug (OCR-Output)
 */
import type { DokTyp } from "@prisma/client"

export type ErkannterTyp = DokTyp | "UNBEKANNT"

function isXML(buffer: Buffer, filename: string): boolean {
  const head = buffer.toString("utf8", 0, Math.min(500, buffer.length))
  return head.includes("<?xml") || filename.toLowerCase().endsWith(".xml")
}

function isPDF(buffer: Buffer): boolean {
  return buffer.toString("latin1", 0, Math.min(1000, buffer.length)).includes("%PDF")
}

/**
 * ZUGFeRD-Erkennung: PDF mit eingebettetem XML-Anhang.
 * Heuristik: PDF-Header + Hinweise auf eingebettete Datei / ZUGFeRD-Metadaten
 * im Dokument (EmbeddedFile, factur-x.xml, zugferd-invoice.xml).
 */
function hasEmbeddedXML(buffer: Buffer): boolean {
  if (!isPDF(buffer)) return false
  const content = buffer.toString("latin1")
  return (
    content.includes("factur-x.xml") ||
    content.includes("zugferd-invoice.xml") ||
    content.includes("ZUGFeRD") ||
    (content.includes("/EmbeddedFile") && content.includes(".xml"))
  )
}

/**
 * Einfache Schlüsselwort-Klassifikation auf den ersten 200 Zeichen
 * eines Textauszugs (z. B. OCR-Output). Sprint 1: kein API-Call.
 */
export function classifyPDF(textAuszug: string): ErkannterTyp {
  const head = textAuszug.slice(0, 200).toLowerCase()
  if (head.includes("gutschrift")) return "GUTSCHRIFT"
  if (head.includes("lieferschein")) return "LIEFERSCHEIN"
  if (head.includes("rechnung")) return "PDF_RECHNUNG"
  return "UNBEKANNT"
}

/**
 * Erkennt den Dokumenttyp anhand von Datei-Inhalt und -Name.
 * @param textAuszug optionaler Textauszug (OCR) für PDF-Klassifikation
 */
export function erkenneDokTyp(
  buffer: Buffer,
  filename: string,
  textAuszug?: string
): ErkannterTyp {
  if (isXML(buffer, filename)) {
    // XML mit PDF-Header wäre ein ZUGFeRD-Sonderfall (PDF zuerst prüfen)
    if (isPDF(buffer)) return "ZUGFERD"
    return "XRECHNUNG"
  }
  if (isPDF(buffer)) {
    if (hasEmbeddedXML(buffer)) return "ZUGFERD"
    if (textAuszug) return classifyPDF(textAuszug)
    return "PDF_RECHNUNG"
  }
  // Bilder (jpg/png) ohne Textauszug: unbekannt bis OCR läuft
  if (textAuszug) return classifyPDF(textAuszug)
  return "UNBEKANNT"
}
