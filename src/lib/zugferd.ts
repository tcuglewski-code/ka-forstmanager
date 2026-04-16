/**
 * ZUGFeRD / Factur-X E-Rechnung
 * 
 * Generiert ZUGFeRD 2.3 / Factur-X konformes XML nach EN 16931
 * und bettet es in PDF/A-3 ein.
 * 
 * Profil: EN16931 (KOSIT-kompatibel)
 * 
 * @see https://zugferd.de/
 * @see https://fnfe-mpe.org/factur-x/
 */

import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFHexString, PDFStream, PDFNumber, AFRelationship } from 'pdf-lib'
import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// TYPEN
// ─────────────────────────────────────────────────────────────────────────────

export interface ZUGFeRDAddress {
  name: string
  strasse?: string
  plz?: string
  ort?: string
  land?: string // ISO 3166-1 alpha-2, z.B. "DE"
}

export interface ZUGFeRDPosition {
  nummer: number
  beschreibung: string
  menge: number
  einheit: string
  einzelpreis: number
  gesamtpreis: number
  mwstSatz: number // z.B. 19
}

export interface ZUGFeRDRechnungData {
  // Rechnungskopf
  rechnungsNummer: string
  rechnungsDatum: Date
  faelligkeitsDatum?: Date
  
  // Verkäufer (Lieferant)
  verkaeufer: ZUGFeRDAddress
  verkaeuferSteuernummer?: string
  verkaeuferUstId?: string
  
  // Käufer (Kunde)
  kaeufer: ZUGFeRDAddress
  kaeuferEmail?: string
  
  // Positionen
  positionen: ZUGFeRDPosition[]
  
  // Beträge
  nettoSumme: number
  mwstSumme: number
  bruttoSumme: number
  mwstSatz: number // Haupt-MwSt-Satz
  
  // Rabatt (optional)
  rabattBetrag?: number
  
  // Zahlung
  iban?: string
  bic?: string
  bank?: string
  zahlungsReferenz?: string // Verwendungszweck
  
  // Währung (Standard: EUR)
  waehrung?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNKTIONEN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatiert Datum nach ZUGFeRD (YYYYMMDD)
 */
function formatZUGFeRDDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Formatiert Betrag (2 Dezimalstellen, Punkt als Trenner)
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Escapt XML-Sonderzeichen
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * UN/ECE Recommendation 20 - Einheiten-Codes
 */
function getUnitCode(einheit: string): string {
  const mapping: Record<string, string> = {
    'stück': 'C62',
    'stk': 'C62',
    'stk.': 'C62',
    'pauschal': 'C62',
    'pausch.': 'C62',
    'ha': 'HAR',
    'hektar': 'HAR',
    'm²': 'MTK',
    'qm': 'MTK',
    'stunde': 'HUR',
    'std': 'HUR',
    'std.': 'HUR',
    'h': 'HUR',
    'tag': 'DAY',
    'tage': 'DAY',
    'km': 'KMT',
    'meter': 'MTR',
    'm': 'MTR',
    'liter': 'LTR',
    'l': 'LTR',
    'kg': 'KGM',
    'tonne': 'TNE',
    't': 'TNE',
  }
  return mapping[einheit.toLowerCase()] || 'C62' // C62 = "one" (Stück) als Fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// XML GENERIERUNG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generiert ZUGFeRD 2.3 / Factur-X konformes XML
 * Profil: EN16931 (KOSIT-kompatibel)
 */
export function generateZUGFeRDXml(rechnung: ZUGFeRDRechnungData): string {
  const waehrung = rechnung.waehrung || 'EUR'
  const rechnungsDatum = formatZUGFeRDDate(rechnung.rechnungsDatum)
  const faelligkeitsDatum = rechnung.faelligkeitsDatum 
    ? formatZUGFeRDDate(rechnung.faelligkeitsDatum)
    : rechnungsDatum
  
  // Positionen generieren
  const positionenXml = rechnung.positionen.map((pos, idx) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${pos.nummer || idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(pos.beschreibung)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatAmount(pos.einzelpreis)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${getUnitCode(pos.einheit)}">${formatAmount(pos.menge)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${formatAmount(pos.mwstSatz)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatAmount(pos.gesamtpreis)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('')

  // Adresse des Verkäufers
  const verkaeuferAdresse = rechnung.verkaeufer.strasse ? `
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(rechnung.verkaeufer.plz || '')}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(rechnung.verkaeufer.strasse)}</ram:LineOne>
          <ram:CityName>${escapeXml(rechnung.verkaeufer.ort || '')}</ram:CityName>
          <ram:CountryID>${rechnung.verkaeufer.land || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>` : ''

  // Adresse des Käufers
  const kaeuferAdresse = rechnung.kaeufer.strasse ? `
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(rechnung.kaeufer.plz || '')}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(rechnung.kaeufer.strasse)}</ram:LineOne>
          <ram:CityName>${escapeXml(rechnung.kaeufer.ort || '')}</ram:CityName>
          <ram:CountryID>${rechnung.kaeufer.land || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>` : ''

  // Zahlungsinformationen
  const zahlungXml = rechnung.iban ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXml(rechnung.iban.replace(/\s/g, ''))}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${rechnung.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${escapeXml(rechnung.bic.replace(/\s/g, ''))}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>` : ''

  // USt-ID und/oder Steuernummer (BR-CO-26 erfordert mindestens VA oder Seller ID)
  const steuerInfoParts: string[] = []
  if (rechnung.verkaeuferUstId) {
    steuerInfoParts.push(`<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(rechnung.verkaeuferUstId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`)
  }
  if (rechnung.verkaeuferSteuernummer) {
    steuerInfoParts.push(`<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${escapeXml(rechnung.verkaeuferSteuernummer)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`)
  }
  const steuerInfoXml = steuerInfoParts.join('\n        ')

  // Vollständiges XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(rechnung.rechnungsNummer)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${rechnungsDatum}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  
  <rsm:SupplyChainTradeTransaction>
    ${positionenXml}
    
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(rechnung.verkaeufer.name)}</ram:Name>
        ${verkaeuferAdresse}
        ${steuerInfoXml}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(rechnung.kaeufer.name)}</ram:Name>
        ${kaeuferAdresse}
        ${rechnung.kaeuferEmail ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(rechnung.kaeuferEmail)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${rechnungsDatum}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    
    <ram:ApplicableHeaderTradeSettlement>
      ${rechnung.zahlungsReferenz ? `<ram:PaymentReference>${escapeXml(rechnung.zahlungsReferenz)}</ram:PaymentReference>` : ''}
      <ram:InvoiceCurrencyCode>${waehrung}</ram:InvoiceCurrencyCode>
      ${zahlungXml}
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${formatAmount(rechnung.mwstSumme)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${formatAmount(rechnung.nettoSumme)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${formatAmount(rechnung.mwstSatz)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${faelligkeitsDatum}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${formatAmount(rechnung.nettoSumme)}</ram:LineTotalAmount>
        ${rechnung.rabattBetrag ? `<ram:AllowanceTotalAmount>${formatAmount(rechnung.rabattBetrag)}</ram:AllowanceTotalAmount>` : ''}
        <ram:TaxBasisTotalAmount>${formatAmount(rechnung.nettoSumme - (rechnung.rabattBetrag || 0))}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${waehrung}">${formatAmount(rechnung.mwstSumme)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${formatAmount(rechnung.bruttoSumme)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${formatAmount(rechnung.bruttoSumme)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`

  return xml.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF/A-3b KONFORMITÄT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sRGB IEC61966-2.1 ICC Color Profile (base64-encoded)
 * Required for PDF/A-3b OutputIntents
 */
const SRGB_ICC_PROFILE = `
AAAL0AAAAAACAAAAbW50clJHQiBYWVogB98AAgAPAAAAAAAAYWNzcAAAAAAAAAAAAAAAAAAAAAAA
AAABAAAAAAAAAAAAAPbWAAEAAAAA0y0AAAAAPQ6y3q6Tl76bZybOjApDzgAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAQZGVzYwAAAUQAAABjYlhZWgAAAagAAAAUYlRSQwAAAbwAAAgMZ1RS
QwAAAbwAAAgMclRSQwAAAbwAAAgMZG1kZAAACcgAAACIZ1hZWgAAClAAAAAUbHVtaQAACmQAAAAU
bWVhcwAACngAAAAkYmtwdAAACpwAAAAUclhZWgAACrAAAAAUdGVjaAAACsQAAAAMdnVlZAAACtAA
AACHd3RwdAAAC1gAAAAUY3BydAAAC2wAAAA3Y2hhZAAAC6QAAAAsZGVzYwAAAAAAAAAJc1JHQjIw
MTQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAAAkoAAAD4QAALbPY3VydgAAAAAAAAQA
AAAABQAKAA8AFAAZAB4AIwAoAC0AMgA3ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYA
iwCQAJUAmgCfAKQAqQCuALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEf
ASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB
8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4CmAKiAqwCtgLBAssC1QLgAusC9QMA
AwsDFgMhAy0DOANDA08DWgNmA3IDfgOKA5YDogOuA7oDxwPTA+AD7AP5BAYEEwQgBC0EOwRIBFUE
YwRxBH4EjASaBKgEtgTEBNME4QTwBP4FDQUcBSsFOgVJBVgFZwV3BYYFlgWmBbUFxQXVBeUF9gYG
BhYGJwY3BkgGWQZqBnsGjAadBq8GwAbRBuMG9QcHBxkHKwc9B08HYQd0B4YHmQesB78H0gflB/gI
CwgfCDIIRghaCG4IggiWCKoIvgjSCOcI+wkQCSUJOglPCWQJeQmPCaQJugnPCeUJ+woRCicKPQpU
CmoKgQqYCq4KxQrcCvMLCwsiCzkLUQtpC4ALmAuwC8gL4Qv5DBIMKgxDDFwMdQyODKcMwAzZDPMN
DQ0mDUANWg10DY4NqQ3DDd4N+A4TDi4OSQ5kDn8Omw62DtIO7g8JDyUPQQ9eD3oPlg+zD88P7BAJ
ECYQQxBhEH4QmxC5ENcQ9RETETERTxFtEYwRqhHJEegSBxImEkUSZBKEEqMSwxLjEwMTIxNDE2MT
gxOkE8UT5RQGFCcUSRRqFIsUrRTOFPAVEhU0FVYVeBWbFb0V4BYDFiYWSRZsFo8WshbWFvoXHRdB
F2UXiReuF9IX9xgbGEAYZRiKGK8Y1Rj6GSAZRRlrGZEZtxndGgQaKhpRGncanhrFGuwbFBs7G2Mb
ihuyG9ocAhwqHFIcexyjHMwc9R0eHUcdcB2ZHcMd7B4WHkAeah6UHr4e6R8THz4faR+UH78f6iAV
IEEgbCCYIMQg8CEcIUghdSGhIc4h+yInIlUigiKvIt0jCiM4I2YjlCPCI/AkHyRNJHwkqyTaJQkl
OCVoJZclxyX3JicmVyaHJrcm6CcYJ0kneierJ9woDSg/KHEooijUKQYpOClrKZ0p0CoCKjUqaCqb
Ks8rAis2K2krnSvRLAUsOSxuLKIs1y0MLUEtdi2rLeEuFi5MLoIuty7uLyQvWi+RL8cv/jA1MGww
pDDbMRIxSjGCMbox8jIqMmMymzLUMw0zRjN/M7gz8TQrNGU0njTYNRM1TTWHNcI1/TY3NnI2rjbp
NyQ3YDecN9c4FDhQOIw4yDkFOUI5fzm8Ofk6Njp0OrI67zstO2s7qjvoPCc8ZTykPOM9Ij1hPaE9
4D4gPmA+oD7gPyE/YT+iP+JAI0BkQKZA50EpQWpBrEHuQjBCckK1QvdDOkN9Q8BEA0RHRIpEzkUS
RVVFmkXeRiJGZ0arRvBHNUd7R8BIBUhLSJFI10kdSWNJqUnwSjdKfUrESwxLU0uaS+JMKkxyTLpN
Ak1KTZNN3E4lTm5Ot08AT0lPk0/dUCdQcVC7UQZRUFGbUeZSMVJ8UsdTE1NfU6pT9lRCVI9U21Uo
VXVVwlYPVlxWqVb3V0RXklfgWC9YfVjLWRpZaVm4WgdaVlqmWvVbRVuVW+VcNVyGXNZdJ114Xcle
Gl5sXr1fD19hX7NgBWBXYKpg/GFPYaJh9WJJYpxi8GNDY5dj62RAZJRk6WU9ZZJl52Y9ZpJm6Gc9
Z5Nn6Wg/aJZo7GlDaZpp8WpIap9q92tPa6dr/2xXbK9tCG1gbbluEm5rbsRvHm94b9FwK3CGcOBx
OnGVcfByS3KmcwFzXXO4dBR0cHTMdSh1hXXhdj52m3b4d1Z3s3gReG54zHkqeYl553pGeqV7BHtj
e8J8IXyBfOF9QX2hfgF+Yn7CfyN/hH/lgEeAqIEKgWuBzYIwgpKC9INXg7qEHYSAhOOFR4Wrhg6G
cobXhzuHn4gEiGmIzokziZmJ/opkisqLMIuWi/yMY4zKjTGNmI3/jmaOzo82j56QBpBukNaRP5Go
khGSepLjk02TtpQglIqU9JVflcmWNJaflwqXdZfgmEyYuJkkmZCZ/JpomtWbQpuvnByciZz3nWSd
0p5Anq6fHZ+Ln/qgaaDYoUehtqImopajBqN2o+akVqTHpTilqaYapoum/adup+CoUqjEqTepqaoc
qo+rAqt1q+msXKzQrUStuK4trqGvFq+LsACwdbDqsWCx1rJLssKzOLOutCW0nLUTtYq2AbZ5tvC3
aLfguFm40blKucK6O7q1uy67p7whvJu9Fb2Pvgq+hL7/v3q/9cBwwOzBZ8Hjwl/C28NYw9TEUcTO
xUvFyMZGxsPHQce/yD3IvMk6ybnKOMq3yzbLtsw1zLXNNc21zjbOts83z7jQOdC60TzRvtI/0sHT
RNPG1EnUy9VO1dHWVdbY11zX4Nhk2OjZbNnx2nba+9uA3AXcit0Q3ZbeHN6i3ynfr+A24L3hROHM
4lPi2+Nj4+vkc+T85YTmDeaW5x/nqegy6LzpRunQ6lvq5etw6/vshu0R7ZzuKO6070DvzPBY8OXx
cvH/8ozzGfOn9DT0wvVQ9d72bfb794r4Gfio+Tj5x/pX+uf7d/wH/Jj9Kf26/kv+3P9t//9kZXNj
AAAAAAAAAC5JRUMgNjE5NjYtMi0xIERlZmF1bHQgUkdCIENvbG91ciBTcGFjZSAtIHNSR0IAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAAAAAUAAAAAAA
AG1lYXMAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlhZWiAAAAAAAAAAngAAAKQAAACH
WFlaIAAAAAAAAG+iAAA49QAAA5BzaWcgAAAAAENSVCBkZXNjAAAAAAAAAC1SZWZlcmVuY2UgVmll
d2luZyBDb25kaXRpb24gaW4gSUVDIDYxOTY2LTItMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFla
IAAAAAAAAPbWAAEAAAAA0y10ZXh0AAAAAENvcHlyaWdodCBJbnRlcm5hdGlvbmFsIENvbG9yIENv
bnNvcnRpdW0sIDIwMTUAAHNmMzIAAAAAAAEMRAAABd////MmAAAHlAAA/Y////uh///9ogAAA9sA
AMB1`.trim()

/**
 * Decodes base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EINBETTUNG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bettet ZUGFeRD XML in ein bestehendes PDF ein (PDF/A-3b konform)
 *
 * Implementiert vollständige PDF/A-3b Konformität:
 * - sRGB ICC Farbprofil + OutputIntents
 * - MarkInfo + StructTreeRoot
 * - Vollständige XMP Metadata mit pdfaExtension Schema
 * - Trailer Info ID
 * - Link Annotation Fixes
 */
export async function embedZUGFeRDXml(
  pdfBytes: Uint8Array,
  xmlString: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const now = new Date()

  // ── 1. XML als embedded file anhängen ──
  const xmlBytes = new TextEncoder().encode(xmlString)
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'Factur-X/ZUGFeRD Invoice Data',
    afRelationship: AFRelationship.Alternative,
    creationDate: now,
    modificationDate: now,
  })

  // ── 2. PDF Metadaten setzen ──
  pdfDoc.setTitle('ZUGFeRD Rechnung')
  pdfDoc.setSubject('Factur-X / ZUGFeRD 2.3 E-Rechnung')
  pdfDoc.setKeywords(['ZUGFeRD', 'Factur-X', 'EN16931', 'E-Rechnung'])
  pdfDoc.setProducer('ForstManager by Koch Aufforstung')
  pdfDoc.setCreator('ForstManager ZUGFeRD Export')
  pdfDoc.setCreationDate(now)
  pdfDoc.setModificationDate(now)

  // ── 3. ICC Farbprofil + OutputIntents (PDF/A-3b Pflicht) ──
  const iccProfile = base64ToUint8Array(SRGB_ICC_PROFILE)
  const iccStream = pdfDoc.context.stream(iccProfile, {
    N: 3, // Number of color components (RGB)
    Length: iccProfile.length,
  })
  const iccStreamRef = pdfDoc.context.register(iccStream)

  const outputIntent = pdfDoc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    OutputConditionIdentifier: PDFString.of('sRGB'),
    DestOutputProfile: iccStreamRef,
  })
  const outputIntentRef = pdfDoc.context.register(outputIntent)
  pdfDoc.catalog.set(
    PDFName.of('OutputIntents'),
    pdfDoc.context.obj([outputIntentRef])
  )

  // ── 4. MarkInfo (PDF/A-3b Pflicht) ──
  const markInfo = pdfDoc.context.obj({ Marked: true })
  pdfDoc.catalog.set(PDFName.of('MarkInfo'), markInfo)

  // ── 5. StructTreeRoot (PDF/A-3b Pflicht) ──
  const structTreeRoot = pdfDoc.context.obj({
    Type: PDFName.of('StructTreeRoot'),
  })
  const structTreeRootRef = pdfDoc.context.register(structTreeRoot)
  pdfDoc.catalog.set(PDFName.of('StructTreeRoot'), structTreeRootRef)

  // ── 6. Link Annotations fixen (Print-Flag setzen) ──
  for (const page of pdfDoc.getPages()) {
    const annotations = page.node.get(PDFName.of('Annots'))
    if (annotations instanceof PDFArray) {
      for (let i = 0; i < annotations.size(); i++) {
        const annotRef = annotations.get(i)
        const annotation = page.node.context.lookup(annotRef)
        if (annotation instanceof PDFDict) {
          const subtype = annotation.get(PDFName.of('Subtype'))
          if (subtype === PDFName.of('Link')) {
            const flagsObj = annotation.get(PDFName.of('F'))
            const flags = flagsObj instanceof PDFNumber ? flagsObj.asNumber() : 0
            annotation.set(PDFName.of('F'), PDFNumber.of(flags | 4))
          }
        }
      }
    }
  }

  // ── 7. Trailer Info ID (PDF/A-3b Pflicht) ──
  const idString = `ZUGFeRD-${now.toISOString()}`
  const hash = crypto.createHash('sha256').update(idString).digest()
  const hashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const docId = PDFHexString.of(hashHex)
  pdfDoc.context.trailerInfo.ID = pdfDoc.context.obj([docId, docId])

  // ── 8. XMP Metadata mit vollständigem pdfaExtension Schema ──
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
      <dc:creator>
        <rdf:Seq>
          <rdf:li>ForstManager ZUGFeRD Export</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:date>
        <rdf:Seq>
          <rdf:li>${now.toISOString()}</rdf:li>
        </rdf:Seq>
      </dc:date>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>ForstManager by Koch Aufforstung</pdf:Producer>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>ForstManager ZUGFeRD Export</xmp:CreatorTool>
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
                  <pdfaProperty:description>The type of the hybrid document in capital letters, e.g. INVOICE or ORDER</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The actual version of the standard applying to the embedded XML document</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The conformance level of the embedded XML document</pdfaProperty:description>
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
    Type: 'Metadata',
    Subtype: 'XML',
    Length: xmpBytes.length,
  })
  const metadataRef = pdfDoc.context.register(metadataStream)
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef)

  return await pdfDoc.save()
}

// ─────────────────────────────────────────────────────────────────────────────
// KOMBINATION: Rechnung → ZUGFeRD PDF
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Konvertiert eine Rechnung zu ZUGFeRD-Daten
 * 
 * @param rechnung Prisma-Rechnung mit Auftrag und Positionen
 * @param firmenDaten Firmen-Stammdaten aus SystemConfig
 */
export function rechnungToZUGFeRDData(
  rechnung: {
    nummer: string
    rechnungsDatum: Date | string
    faelligAm?: Date | string | null
    nettoBetrag?: number | null
    betrag: number
    mwst?: number | null
    bruttoBetrag?: number | null
    rabatt?: number | null
    rabattBetrag?: number | null
    notizen?: string | null
    auftrag?: {
      titel?: string | null
      waldbesitzer?: string | null
      waldbesitzerEmail?: string | null
      standort?: string | null
      bundesland?: string | null
    } | null
    positionen?: {
      beschreibung: string
      menge: number
      einheit: string
      preisProEinheit: number
      gesamt: number
    }[]
  },
  firmenDaten: {
    name: string
    strasse: string
    plz: string
    ort: string
    land?: string
    steuernummer?: string
    ustIdNr?: string
    iban?: string
    bic?: string
    bank?: string
  }
): ZUGFeRDRechnungData {
  const mwstSatz = rechnung.mwst ?? 19
  const netto = rechnung.nettoBetrag ?? rechnung.betrag
  const rabattAbsolut = rechnung.rabattBetrag ?? ((rechnung.rabatt ?? 0) * netto / 100)
  const nettoNachRabatt = netto - rabattAbsolut
  const mwstBetrag = (nettoNachRabatt * mwstSatz) / 100
  const brutto = rechnung.bruttoBetrag ?? nettoNachRabatt + mwstBetrag
  
  // Positionen konvertieren
  const positionen: ZUGFeRDPosition[] = rechnung.positionen?.length
    ? rechnung.positionen.map((pos, idx) => ({
        nummer: idx + 1,
        beschreibung: pos.beschreibung,
        menge: pos.menge,
        einheit: pos.einheit,
        einzelpreis: pos.preisProEinheit,
        gesamtpreis: pos.gesamt,
        mwstSatz: mwstSatz,
      }))
    : [{
        nummer: 1,
        beschreibung: rechnung.notizen ?? rechnung.auftrag?.titel ?? 'Forstdienstleistung',
        menge: 1,
        einheit: 'pauschal',
        einzelpreis: netto,
        gesamtpreis: netto,
        mwstSatz: mwstSatz,
      }]
  
  return {
    rechnungsNummer: rechnung.nummer,
    rechnungsDatum: new Date(rechnung.rechnungsDatum),
    faelligkeitsDatum: rechnung.faelligAm ? new Date(rechnung.faelligAm) : undefined,
    
    verkaeufer: {
      name: firmenDaten.name,
      strasse: firmenDaten.strasse,
      plz: firmenDaten.plz,
      ort: firmenDaten.ort,
      land: firmenDaten.land || 'DE',
    },
    verkaeuferSteuernummer: firmenDaten.steuernummer,
    verkaeuferUstId: firmenDaten.ustIdNr,
    
    kaeufer: {
      name: rechnung.auftrag?.waldbesitzer ?? 'Kunde',
      strasse: rechnung.auftrag?.standort ?? undefined,
      ort: rechnung.auftrag?.bundesland ?? undefined,
      land: 'DE',
    },
    kaeuferEmail: rechnung.auftrag?.waldbesitzerEmail ?? undefined,
    
    positionen,
    
    nettoSumme: netto,
    mwstSumme: mwstBetrag,
    bruttoSumme: brutto,
    mwstSatz: mwstSatz,
    rabattBetrag: rabattAbsolut > 0 ? rabattAbsolut : undefined,
    
    iban: firmenDaten.iban,
    bic: firmenDaten.bic,
    bank: firmenDaten.bank,
    zahlungsReferenz: `Rechnung ${rechnung.nummer}`,
    
    waehrung: 'EUR',
  }
}
