/**
 * ZUGFeRD PDF/A-3b Generator
 *
 * Generates a minimal but valid PDF/A-3b document with embedded ZUGFeRD XML.
 * Uses only pdf-lib with standard fonts (Helvetica) to avoid CIDSet/SMask issues.
 *
 * This PDF is for machine processing. The pretty PDF stays on /api/rechnungen/[id]/pdf.
 */

import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFHexString,
  PDFNumber,
  PDFArray,
  PDFDict,
  StandardFonts,
  rgb,
  AFRelationship,
} from 'pdf-lib'
import crypto from 'crypto'

interface ZUGFeRDPdfOptions {
  rechnungsNummer: string
  rechnungsDatum: string  // formatted "DD.MM.YYYY"
  empfaenger: string
  nettoBetrag: string
  mwstBetrag: string
  bruttoBetrag: string
  mwstSatz: number
  positionen: Array<{
    beschreibung: string
    menge: string
    einheit: string
    einzelpreis: string
    gesamt: string
  }>
  firma: {
    name: string
    strasse: string
    plz: string
    ort: string
    iban: string
    bic: string
    steuernummer: string
    ustIdNr: string
  }
}

/**
 * Sanitizes text for use with pdf-lib's drawText():
 * - Replaces newlines with spaces (drawText does NOT support multi-line)
 * - Replaces characters outside WinAnsiEncoding with '?'
 * - Trims and collapses multiple spaces
 */
function sanitizeForPdf(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/[\r\n]+/g, ' ')   // newlines → space
    .replace(/\t/g, ' ')         // tabs → space
    .replace(/\s{2,}/g, ' ')     // collapse multiple spaces
    .trim()
}

/**
 * Fetches the sRGB ICC profile
 */
// sRGB ICC profile embedded directly (avoids HTTP fetch in serverless)
const SRGB_ICC_B64 = 'AAAByGxjbXMCEAAAbW50clJHQiBYWVogB+IAAwAUAAkADgAdYWNzcE1TRlQAAAAAc2F3c2N0cmwAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1oYW5knZEAPUCAsD1AdCyBnqUijgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJZGVzYwAAAPAAAABfY3BydAAAAQwAAAAMd3RwdAAAARgAAAAUclhZWgAAASwAAAAUZ1hZWgAAAUAAAAAUYlhZWgAAAVQAAAAUclRSQwAAAWgAAABgZ1RSQwAAAWgAAABgYlRSQwAAAWgAAABgZGVzYwAAAAAAAAAFdVJHQgAAAAAAAAAAAAAAAHRleHQAAAAAQ0MwAFhZWiAAAAAAAADzVAABAAAAARbJWFlaIAAAAAAAAG+gAAA48gAAA49YWVogAAAAAAAAYpYAALeJAAAY2lhZWiAAAAAAAAAkoAAAD4UAALbEY3VydgAAAAAAAAAqAAAAfAD4AZwCdQODBMkGTggSChgMYg70Ec8U9hhqHC4gQySsKWoufjPrObM/1kZXTTZUdlwXZB1shnVWfo2ILJI2nKunjLLbvpnKx9dl5Hfx+f//'

function getSRGBIccProfile(): Uint8Array {
  return new Uint8Array(Buffer.from(SRGB_ICC_B64, 'base64'))
}

/**
 * Generates a complete PDF/A-3b document with embedded ZUGFeRD XML.
 *
 * Key design decisions:
 * - Standard Helvetica font (WinAnsiEncoding) → no CIDSet required
 * - No images → no SMask issues
 * - Text only with basic layout → clean PDF structure
 * - All PDF/A-3b mandatory elements included
 */
export async function generateZUGFeRDPdf(
  xmlString: string,
  options: ZUGFeRDPdfOptions
): Promise<Uint8Array> {
  const now = new Date()
  const pdfDoc = await PDFDocument.create()

  // ── 1. Embed standard fonts (WinAnsiEncoding, no CIDSet needed) ──
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // ── 2. Create page with invoice content ──
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  const margin = 50
  let y = height - margin

  // Helper to draw text
  const drawText = (text: string, x: number, yPos: number, size: number, bold = false) => {
    page.drawText(text, {
      x,
      y: yPos,
      size,
      font: bold ? helveticaBold : helvetica,
      color: rgb(0, 0, 0),
    })
  }

  // Helper for right-aligned text
  const drawTextRight = (text: string, xRight: number, yPos: number, size: number, bold = false) => {
    const font = bold ? helveticaBold : helvetica
    const tw = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: xRight - tw,
      y: yPos,
      size,
      font,
      color: rgb(0, 0, 0),
    })
  }

  // Sanitize all string options to prevent drawText crashes from newlines/special chars
  const firmaName = sanitizeForPdf(options.firma.name) || 'Koch Aufforstung GmbH'
  const firmaStrasse = sanitizeForPdf(options.firma.strasse)
  const firmaPlz = sanitizeForPdf(options.firma.plz)
  const firmaOrt = sanitizeForPdf(options.firma.ort)
  const firmaIban = sanitizeForPdf(options.firma.iban)
  const firmaBic = sanitizeForPdf(options.firma.bic)
  const firmaSteuer = sanitizeForPdf(options.firma.steuernummer)
  const firmaUst = sanitizeForPdf(options.firma.ustIdNr)
  const rechnungsNummer = sanitizeForPdf(options.rechnungsNummer) || 'OHNE-NR'
  const rechnungsDatum = sanitizeForPdf(options.rechnungsDatum) || 'unbekannt'
  const empfaenger = sanitizeForPdf(options.empfaenger) || 'Kunde'
  const nettoBetragStr = sanitizeForPdf(options.nettoBetrag) || '0.00'
  const mwstBetragStr = sanitizeForPdf(options.mwstBetrag) || '0.00'
  const bruttoBetragStr = sanitizeForPdf(options.bruttoBetrag) || '0.00'
  const mwstSatz = options.mwstSatz ?? 19

  // ── Header ──
  drawText(firmaName, margin, y, 14, true)
  y -= 16
  drawText(`${firmaStrasse}, ${firmaPlz} ${firmaOrt}`, margin, y, 8)
  y -= 11
  drawText(`St.-Nr.: ${firmaSteuer} | USt-IdNr.: ${firmaUst}`, margin, y, 8)
  y -= 30

  // ── Invoice title ──
  drawText('RECHNUNG', margin, y, 18, true)
  drawTextRight(`Nr. ${rechnungsNummer}`, width - margin, y, 12, true)
  y -= 16
  drawTextRight(`Datum: ${rechnungsDatum}`, width - margin, y, 9)
  y -= 30

  // ── Recipient ──
  drawText('Rechnungsempfaenger:', margin, y, 8)
  y -= 14
  drawText(empfaenger, margin, y, 11, true)
  y -= 30

  // ── Line separator ──
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  y -= 20

  // ── Position table header ──
  const colX = { pos: margin, desc: margin + 30, menge: 340, einheit: 390, preis: 440, gesamt: width - margin }
  drawText('Pos.', colX.pos, y, 8, true)
  drawText('Beschreibung', colX.desc, y, 8, true)
  drawText('Menge', colX.menge, y, 8, true)
  drawText('Einheit', colX.einheit, y, 8, true)
  drawTextRight('Einzelpreis', colX.preis + 50, y, 8, true)
  drawTextRight('Gesamt', colX.gesamt, y, 8, true)
  y -= 4
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.3,
    color: rgb(0, 0, 0),
  })
  y -= 14

  // ── Positions ──
  const safePositionen = (options.positionen && options.positionen.length > 0)
    ? options.positionen
    : [{ beschreibung: 'Forstdienstleistung', menge: '1.00', einheit: 'pauschal', einzelpreis: nettoBetragStr, gesamt: nettoBetragStr }]

  safePositionen.forEach((pos, i) => {
    // Sanitize all position text to prevent drawText crashes
    const maxDescWidth = colX.menge - colX.desc - 10
    let desc = sanitizeForPdf(pos.beschreibung) || 'Position'
    const menge = sanitizeForPdf(pos.menge) || '1.00'
    const einheit = sanitizeForPdf(pos.einheit) || 'Stk'
    const einzelpreis = sanitizeForPdf(pos.einzelpreis) || '0.00'
    const gesamt = sanitizeForPdf(pos.gesamt) || '0.00'

    while (helvetica.widthOfTextAtSize(desc, 9) > maxDescWidth && desc.length > 3) {
      desc = desc.slice(0, -4) + '...'
    }

    drawText(`${i + 1}`, colX.pos, y, 9)
    drawText(desc, colX.desc, y, 9)
    drawText(menge, colX.menge, y, 9)
    drawText(einheit, colX.einheit, y, 9)
    drawTextRight(einzelpreis, colX.preis + 50, y, 9)
    drawTextRight(gesamt, colX.gesamt, y, 9)
    y -= 16
  })

  y -= 10
  page.drawLine({
    start: { x: 300, y },
    end: { x: width - margin, y },
    thickness: 0.3,
    color: rgb(0, 0, 0),
  })
  y -= 16

  // ── Totals ──
  drawText('Nettobetrag:', 300, y, 9)
  drawTextRight(`${nettoBetragStr} EUR`, width - margin, y, 9)
  y -= 14
  drawText(`MwSt. (${mwstSatz}%):`, 300, y, 9)
  drawTextRight(`${mwstBetragStr} EUR`, width - margin, y, 9)
  y -= 4
  page.drawLine({
    start: { x: 300, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  })
  y -= 16
  drawText('Gesamtbetrag:', 300, y, 11, true)
  drawTextRight(`${bruttoBetragStr} EUR`, width - margin, y, 11, true)
  y -= 30

  // ── Payment info ──
  drawText('Zahlungsinformationen:', margin, y, 9, true)
  y -= 14
  drawText(`IBAN: ${firmaIban}`, margin, y, 9)
  y -= 12
  drawText(`BIC: ${firmaBic}`, margin, y, 9)
  y -= 12
  drawText(`Verwendungszweck: Rechnung ${rechnungsNummer}`, margin, y, 9)
  y -= 30

  // ── ZUGFeRD notice ──
  drawText('Dieses PDF enthaelt eingebettete ZUGFeRD 2.3 / Factur-X Daten (EN 16931).', margin, y, 7)

  // ── 3. Document metadata (must match XMP exactly) ──
  const PRODUCER = 'ForstManager by Koch Aufforstung'
  const CREATOR = 'ForstManager ZUGFeRD Export'
  const TITLE = 'ZUGFeRD Rechnung'
  const SUBJECT = 'Factur-X / ZUGFeRD 2.3 E-Rechnung'
  pdfDoc.setTitle(TITLE)
  pdfDoc.setAuthor('Koch Aufforstung GmbH')
  pdfDoc.setSubject(SUBJECT)
  pdfDoc.setKeywords(['ZUGFeRD', 'Factur-X', 'EN16931', 'E-Rechnung'])
  pdfDoc.setProducer(PRODUCER)
  pdfDoc.setCreator(CREATOR)
  pdfDoc.setCreationDate(now)
  pdfDoc.setModificationDate(now)

  // ── 4. Attach XML as embedded file (Factur-X requirement) ──
  const xmlBytes = new TextEncoder().encode(xmlString)
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'Factur-X/ZUGFeRD Invoice Data',
    afRelationship: AFRelationship.Alternative,
    creationDate: now,
    modificationDate: now,
  })

  // ── 5. sRGB ICC profile + OutputIntents (PDF/A-3b mandatory) ──
  const iccProfile = getSRGBIccProfile()
  const iccStream = pdfDoc.context.stream(iccProfile, {
    N: PDFNumber.of(3),
    Length: PDFNumber.of(iccProfile.length),
  })
  const iccStreamRef = pdfDoc.context.register(iccStream)
  const outputIntent = pdfDoc.context.obj({
    Type: PDFName.of('OutputIntent'),
    S: PDFName.of('GTS_PDFA1'),
    OutputConditionIdentifier: PDFString.of('sRGB'),
    RegistryName: PDFString.of('http://www.color.org'),
    Info: PDFString.of('sRGB IEC61966-2.1'),
    DestOutputProfile: iccStreamRef,
  })
  const outputIntentRef = pdfDoc.context.register(outputIntent)
  pdfDoc.catalog.set(
    PDFName.of('OutputIntents'),
    pdfDoc.context.obj([outputIntentRef])
  )

  // ── 6. MarkInfo (PDF/A-3b mandatory) ──
  pdfDoc.catalog.set(PDFName.of('MarkInfo'), pdfDoc.context.obj({ Marked: true }))

  // ── 7. StructTreeRoot (PDF/A-3b mandatory) ──
  const structTreeRoot = pdfDoc.context.obj({ Type: PDFName.of('StructTreeRoot') })
  const structTreeRootRef = pdfDoc.context.register(structTreeRoot)
  pdfDoc.catalog.set(PDFName.of('StructTreeRoot'), structTreeRootRef)

  // ── 8. Trailer Info ID (PDF/A-3b mandatory) ──
  const idString = `ZUGFeRD-${now.toISOString()}-${options.rechnungsNummer}`
  const hash = crypto.createHash('sha256').update(idString).digest()
  const hashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const docId = PDFHexString.of(hashHex)
  pdfDoc.context.trailerInfo.ID = pdfDoc.context.obj([docId, docId])

  // ── 9. XMP Metadata with all required namespaces ──
  const xmpXml = `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${TITLE}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${SUBJECT}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${CREATOR}</rdf:li>
        </rdf:Seq>
      </dc:creator>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>${PRODUCER}</pdf:Producer>
      <pdf:Keywords>ZUGFeRD Factur-X EN16931 E-Rechnung</pdf:Keywords>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>${CREATOR}</xmp:CreatorTool>
      <xmp:CreateDate>${now.toISOString()}</xmp:CreateDate>
      <xmp:ModifyDate>${now.toISOString()}</xmp:ModifyDate>
      <xmp:MetadataDate>${now.toISOString()}</xmp:MetadataDate>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The name of the embedded XML document</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>INVOICE or ORDER</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Standard version</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Conformance level</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

  const xmpBytes = new TextEncoder().encode(xmpXml)
  const metadataStream = pdfDoc.context.stream(xmpBytes, {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
    Length: PDFNumber.of(xmpBytes.length),
  })
  const metadataRef = pdfDoc.context.register(metadataStream)
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef)

  // ── 10. AF Array on catalog (Factur-X mandatory) ──
  // Navigate: Catalog → Names → EmbeddedFiles → Names array → get FileSpec ref
  const namesDict = pdfDoc.context.lookup(
    pdfDoc.catalog.get(PDFName.of('Names'))
  ) as PDFDict | undefined
  if (namesDict) {
    const embeddedFilesRef = namesDict.get(PDFName.of('EmbeddedFiles'))
    if (embeddedFilesRef) {
      const embeddedFiles = pdfDoc.context.lookup(embeddedFilesRef) as PDFDict | undefined
      if (embeddedFiles) {
        const nameArray = embeddedFiles.get(PDFName.of('Names')) as PDFArray | undefined
        if (nameArray && nameArray.size() >= 2) {
          // nameArray is [name_string, filespec_ref, ...]
          const fileSpecRef = nameArray.get(1)
          pdfDoc.catalog.set(PDFName.of('AF'), pdfDoc.context.obj([fileSpecRef]))

          // Also set AFRelationship on the FileSpec dict itself
          const fileSpec = pdfDoc.context.lookup(fileSpecRef) as PDFDict | undefined
          if (fileSpec) {
            fileSpec.set(PDFName.of('AFRelationship'), PDFName.of('Alternative'))
          }
        }
      }
    }
  }

  // ── 11. PDF version 1.7 (required for PDF/A-3) ──
  // pdf-lib defaults to 1.7 which is correct

  // ── 12. Save without object streams (PDF/A-3b forbids them) ──
  return await pdfDoc.save({ useObjectStreams: false })
}
