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

import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFHexString, PDFStream, AFRelationship } from 'pdf-lib'

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

  // USt-ID oder Steuernummer
  const steuerInfoXml = rechnung.verkaeuferUstId 
    ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(rechnung.verkaeuferUstId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    : rechnung.verkaeuferSteuernummer
    ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${escapeXml(rechnung.verkaeuferSteuernummer)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    : ''

  // Vollständiges XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:en16931</ram:ID>
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
      ${rechnung.zahlungsReferenz ? `<ram:PaymentReference>${escapeXml(rechnung.zahlungsReferenz)}</ram:PaymentReference>` : ''}
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`

  return xml.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EINBETTUNG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bettet ZUGFeRD XML in ein bestehendes PDF ein
 * 
 * Das XML wird als eingebettete Datei (factur-x.xml) mit
 * AFRelationship: Alternative hinzugefügt.
 */
export async function embedZUGFeRDXml(
  pdfBytes: Uint8Array,
  xmlString: string
): Promise<Uint8Array> {
  // PDF laden
  const pdfDoc = await PDFDocument.load(pdfBytes)
  
  // XML als UTF-8 Bytes
  const xmlBytes = new TextEncoder().encode(xmlString)
  
  // XML als embedded file hinzufügen
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'Factur-X/ZUGFeRD Invoice Data',
    afRelationship: AFRelationship.Source,
    creationDate: new Date(),
    modificationDate: new Date(),
  })
  
  // PDF/A-3 Metadaten setzen (vereinfacht)
  pdfDoc.setTitle('ZUGFeRD Rechnung')
  pdfDoc.setSubject('Factur-X / ZUGFeRD 2.3 E-Rechnung')
  pdfDoc.setKeywords(['ZUGFeRD', 'Factur-X', 'EN16931', 'E-Rechnung'])
  pdfDoc.setProducer('ForstManager by Feldhub')
  pdfDoc.setCreator('ForstManager ZUGFeRD Export')

  // XMP Metadata Stream für Factur-X Profil-Deklaration
  // Validatoren lesen den Profil aus dem XMP, nicht aus dem XML-Inhalt
  const xmpXml = `<?xpacket begin="\xef\xbb\xbf" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
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

  // PDF mit Anhang speichern
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
