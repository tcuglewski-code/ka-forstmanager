/**
 * XRechnung E-Rechnung Export
 * 
 * Generiert XRechnung 3.0 konformes XML nach EN 16931 (German CIUS)
 * Format: UN/CEFACT CrossIndustryInvoice (CII)
 * 
 * XRechnung ist der deutsche Standard für elektronische Rechnungen
 * an öffentliche Auftraggeber (B2G) und wird zunehmend auch für B2B genutzt.
 * 
 * @see https://xeinkauf.de/xrechnung/
 * @see https://www.kosit.bund.de/
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPEN
// ─────────────────────────────────────────────────────────────────────────────

export interface XRechnungAddress {
  name: string
  strasse?: string
  plz?: string
  ort?: string
  land?: string // ISO 3166-1 alpha-2, z.B. "DE"
}

export interface XRechnungPosition {
  nummer: number
  beschreibung: string
  menge: number
  einheit: string
  einzelpreis: number
  gesamtpreis: number
  mwstSatz: number // z.B. 19
  mwstKategorie?: 'S' | 'Z' | 'E' | 'AE' | 'K' | 'G' | 'O' | 'L' | 'M' // Standard: 'S'
}

export interface XRechnungData {
  // Rechnungskopf
  rechnungsNummer: string
  rechnungsDatum: Date
  faelligkeitsDatum?: Date
  
  // BT-10: Buyer reference (Leitweg-ID für öffentliche Auftraggeber)
  leitwegId?: string
  
  // BT-13: Bestellnummer des Käufers
  bestellnummer?: string
  
  // Verkäufer (Lieferant)
  verkaeufer: XRechnungAddress
  verkaeuferSteuernummer?: string
  verkaeuferUstId?: string
  verkaeuferEmail?: string
  verkaeuferTelefon?: string
  
  // Käufer (Kunde)
  kaeufer: XRechnungAddress
  kaeuferEmail?: string
  kaeuferUstId?: string
  
  // Positionen
  positionen: XRechnungPosition[]
  
  // Beträge
  nettoSumme: number
  mwstSumme: number
  bruttoSumme: number
  mwstSatz: number // Haupt-MwSt-Satz
  
  // Rabatt (optional)
  rabattBetrag?: number
  rabattGrund?: string
  
  // Zahlung
  iban?: string
  bic?: string
  bank?: string
  zahlungsReferenz?: string // Verwendungszweck
  
  // Notizen / Bemerkungen
  notizen?: string
  
  // Währung (Standard: EUR)
  waehrung?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNKTIONEN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatiert Datum nach XRechnung (YYYYMMDD)
 */
function formatXRechnungDate(date: Date): string {
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
 * XRechnung erfordert die korrekten Codes
 */
function getUnitCode(einheit: string): string {
  const mapping: Record<string, string> = {
    'stück': 'C62',
    'stk': 'C62',
    'stk.': 'C62',
    'pauschal': 'C62',
    'pausch.': 'C62',
    'einheit': 'C62',
    'ha': 'HAR',
    'hektar': 'HAR',
    'm²': 'MTK',
    'qm': 'MTK',
    'quadratmeter': 'MTK',
    'stunde': 'HUR',
    'std': 'HUR',
    'std.': 'HUR',
    'h': 'HUR',
    'tag': 'DAY',
    'tage': 'DAY',
    'km': 'KMT',
    'kilometer': 'KMT',
    'meter': 'MTR',
    'm': 'MTR',
    'lfm': 'MTR', // Laufmeter
    'liter': 'LTR',
    'l': 'LTR',
    'kg': 'KGM',
    'kilogramm': 'KGM',
    'tonne': 'TNE',
    't': 'TNE',
    'ar': 'ARE',
    'pflanze': 'C62',
    'pflanzen': 'C62',
  }
  return mapping[einheit.toLowerCase().trim()] || 'C62' // C62 = "one" (Stück) als Fallback
}

/**
 * Ermittelt MwSt-Kategorie-Code nach EN 16931
 */
function getVATCategoryCode(kategorie?: string, mwstSatz?: number): string {
  if (kategorie) return kategorie
  
  // Standard-Kategorien basierend auf MwSt-Satz
  if (mwstSatz === 0) return 'E' // Exempt (befreit)
  if (mwstSatz === 7) return 'S' // Standard (ermäßigt gilt auch als S)
  return 'S' // Standard rate
}

// ─────────────────────────────────────────────────────────────────────────────
// XML GENERIERUNG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generiert XRechnung 3.0 konformes XML
 * Format: UN/CEFACT CrossIndustryInvoice (CII)
 * 
 * Profil: urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0
 */
export function generateXRechnungXml(rechnung: XRechnungData): string {
  const waehrung = rechnung.waehrung || 'EUR'
  const rechnungsDatum = formatXRechnungDate(rechnung.rechnungsDatum)
  const faelligkeitsDatum = rechnung.faelligkeitsDatum 
    ? formatXRechnungDate(rechnung.faelligkeitsDatum)
    : rechnungsDatum
  
  // Positionen generieren
  const positionenXml = rechnung.positionen.map((pos, idx) => {
    const kategorie = getVATCategoryCode(pos.mwstKategorie, pos.mwstSatz)
    return `
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
          <ram:CategoryCode>${kategorie}</ram:CategoryCode>
          <ram:RateApplicablePercent>${formatAmount(pos.mwstSatz)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatAmount(pos.gesamtpreis)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`
  }).join('')

  // Adresse des Verkäufers (BG-5: Seller postal address - mandatory in XRechnung)
  const verkaeuferAdresse = `
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(rechnung.verkaeufer.plz || '')}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(rechnung.verkaeufer.strasse || '')}</ram:LineOne>
          <ram:CityName>${escapeXml(rechnung.verkaeufer.ort || '')}</ram:CityName>
          <ram:CountryID>${rechnung.verkaeufer.land || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>`

  // Verkäufer Kontakt (BG-6: Seller contact - empfohlen)
  const verkaeuferKontakt = (rechnung.verkaeuferEmail || rechnung.verkaeuferTelefon) ? `
        <ram:DefinedTradeContact>
          ${rechnung.verkaeuferTelefon ? `<ram:TelephoneUniversalCommunication>
            <ram:CompleteNumber>${escapeXml(rechnung.verkaeuferTelefon)}</ram:CompleteNumber>
          </ram:TelephoneUniversalCommunication>` : ''}
          ${rechnung.verkaeuferEmail ? `<ram:EmailURIUniversalCommunication>
            <ram:URIID>${escapeXml(rechnung.verkaeuferEmail)}</ram:URIID>
          </ram:EmailURIUniversalCommunication>` : ''}
        </ram:DefinedTradeContact>` : ''

  // Adresse des Käufers (BG-8: Buyer postal address)
  const kaeuferAdresse = `
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(rechnung.kaeufer.plz || '')}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(rechnung.kaeufer.strasse || '')}</ram:LineOne>
          <ram:CityName>${escapeXml(rechnung.kaeufer.ort || '')}</ram:CityName>
          <ram:CountryID>${rechnung.kaeufer.land || 'DE'}</ram:CountryID>
        </ram:PostalTradeAddress>`

  // Zahlungsinformationen (BG-17: Credit transfer)
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

  // BT-34: Seller electronic address (PFLICHT in XRechnung 3.0)
  const verkaeuferEmailXml = rechnung.verkaeuferEmail
    ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(rechnung.verkaeuferEmail)}</ram:URIID>
        </ram:URIUniversalCommunication>`
    : ''

  // USt-ID des Verkäufers (BT-31 - mandatory in XRechnung wenn vorhanden)
  const verkaeuferSteuerXml = rechnung.verkaeuferUstId
    ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(rechnung.verkaeuferUstId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    : rechnung.verkaeuferSteuernummer
    ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${escapeXml(rechnung.verkaeuferSteuernummer)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    : ''

  // Käufer USt-ID (BT-48 - optional)
  const kaeuferSteuerXml = rechnung.kaeuferUstId
    ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(rechnung.kaeuferUstId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    : ''

  // Rabatt als Document Level Allowance (BG-20)
  const rabattXml = rechnung.rabattBetrag && rechnung.rabattBetrag > 0 ? `
      <ram:SpecifiedTradeAllowanceCharge>
        <ram:ChargeIndicator>
          <udt:Indicator>false</udt:Indicator>
        </ram:ChargeIndicator>
        <ram:ActualAmount>${formatAmount(rechnung.rabattBetrag)}</ram:ActualAmount>
        ${rechnung.rabattGrund ? `<ram:Reason>${escapeXml(rechnung.rabattGrund)}</ram:Reason>` : ''}
        <ram:CategoryTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${formatAmount(rechnung.mwstSatz)}</ram:RateApplicablePercent>
        </ram:CategoryTradeTax>
      </ram:SpecifiedTradeAllowanceCharge>` : ''

  // Notizen (BT-22: Invoice note)
  const notizenXml = rechnung.notizen ? `
    <ram:IncludedNote>
      <ram:Content>${escapeXml(rechnung.notizen)}</ram:Content>
    </ram:IncludedNote>` : ''

  // Buyer Reference / Leitweg-ID (BT-10 - PFLICHT in XRechnung 3.0, auch B2B)
  const buyerReference = rechnung.leitwegId || rechnung.rechnungsNummer
  const buyerReferenceXml = `<ram:BuyerReference>${escapeXml(buyerReference)}</ram:BuyerReference>`

  // Bestellnummer (BT-13 - optional)
  const bestellnummerXml = rechnung.bestellnummer
    ? `<ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${escapeXml(rechnung.bestellnummer)}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>`
    : ''

  // Netto nach Rabatt berechnen
  const nettoNachRabatt = rechnung.nettoSumme - (rechnung.rabattBetrag || 0)

  // Vollständiges XRechnung XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(rechnung.rechnungsNummer)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${rechnungsDatum}</udt:DateTimeString>
    </ram:IssueDateTime>${notizenXml}
  </rsm:ExchangedDocument>
  
  <rsm:SupplyChainTradeTransaction>
    ${positionenXml}
    
    <ram:ApplicableHeaderTradeAgreement>${buyerReferenceXml}
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(rechnung.verkaeufer.name)}</ram:Name>${verkaeuferKontakt}${verkaeuferAdresse}
        ${verkaeuferEmailXml}
        ${verkaeuferSteuerXml}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(rechnung.kaeufer.name)}</ram:Name>${kaeuferAdresse}
        ${rechnung.kaeuferEmail ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(rechnung.kaeuferEmail)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ''}
        ${kaeuferSteuerXml}
      </ram:BuyerTradeParty>${bestellnummerXml}
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
      ${zahlungXml}${rabattXml}
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${formatAmount(rechnung.mwstSumme)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${formatAmount(nettoNachRabatt)}</ram:BasisAmount>
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
        <ram:TaxBasisTotalAmount>${formatAmount(nettoNachRabatt)}</ram:TaxBasisTotalAmount>
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
// KONVERTER: Rechnung → XRechnung Daten
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Konvertiert eine Prisma-Rechnung zu XRechnung-Daten
 * 
 * @param rechnung Prisma-Rechnung mit Auftrag und Positionen
 * @param firmenDaten Firmen-Stammdaten
 * @param optionen Zusätzliche Optionen (Leitweg-ID, Bestellnummer, etc.)
 */
export function rechnungToXRechnungData(
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
    rabattGrund?: string | null
    notizen?: string | null
    auftrag?: {
      titel?: string | null
      waldbesitzer?: string | null
      waldbesitzerEmail?: string | null
      waldbesitzerStrasse?: string | null
      waldbesitzerPlz?: string | null
      waldbesitzerOrt?: string | null
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
    email?: string
    telefon?: string
  },
  optionen?: {
    leitwegId?: string
    bestellnummer?: string
  }
): XRechnungData {
  const mwstSatz = rechnung.mwst ?? 19
  const netto = rechnung.nettoBetrag ?? rechnung.betrag
  const rabattAbsolut = rechnung.rabattBetrag ?? ((rechnung.rabatt ?? 0) * netto / 100)
  const nettoNachRabatt = netto - rabattAbsolut
  const mwstBetrag = (nettoNachRabatt * mwstSatz) / 100
  const brutto = rechnung.bruttoBetrag ?? nettoNachRabatt + mwstBetrag
  
  // Positionen konvertieren
  const positionen: XRechnungPosition[] = rechnung.positionen?.length
    ? rechnung.positionen.map((pos, idx) => ({
        nummer: idx + 1,
        beschreibung: pos.beschreibung,
        menge: pos.menge,
        einheit: pos.einheit,
        einzelpreis: pos.preisProEinheit,
        gesamtpreis: pos.gesamt,
        mwstSatz: mwstSatz,
        mwstKategorie: 'S' as const,
      }))
    : [{
        nummer: 1,
        beschreibung: rechnung.notizen ?? rechnung.auftrag?.titel ?? 'Forstdienstleistung',
        menge: 1,
        einheit: 'pauschal',
        einzelpreis: netto,
        gesamtpreis: netto,
        mwstSatz: mwstSatz,
        mwstKategorie: 'S' as const,
      }]
  
  return {
    rechnungsNummer: rechnung.nummer,
    rechnungsDatum: new Date(rechnung.rechnungsDatum),
    faelligkeitsDatum: rechnung.faelligAm ? new Date(rechnung.faelligAm) : undefined,
    
    leitwegId: optionen?.leitwegId,
    bestellnummer: optionen?.bestellnummer,
    
    verkaeufer: {
      name: firmenDaten.name,
      strasse: firmenDaten.strasse,
      plz: firmenDaten.plz,
      ort: firmenDaten.ort,
      land: firmenDaten.land || 'DE',
    },
    verkaeuferSteuernummer: firmenDaten.steuernummer,
    verkaeuferUstId: firmenDaten.ustIdNr,
    verkaeuferEmail: firmenDaten.email,
    verkaeuferTelefon: firmenDaten.telefon,
    
    kaeufer: {
      name: rechnung.auftrag?.waldbesitzer ?? 'Kunde',
      strasse: rechnung.auftrag?.waldbesitzerStrasse ?? rechnung.auftrag?.standort ?? undefined,
      plz: rechnung.auftrag?.waldbesitzerPlz ?? undefined,
      ort: rechnung.auftrag?.waldbesitzerOrt ?? rechnung.auftrag?.bundesland ?? undefined,
      land: 'DE',
    },
    kaeuferEmail: rechnung.auftrag?.waldbesitzerEmail ?? undefined,
    
    positionen,
    
    nettoSumme: netto,
    mwstSumme: mwstBetrag,
    bruttoSumme: brutto,
    mwstSatz: mwstSatz,
    
    rabattBetrag: rabattAbsolut > 0 ? rabattAbsolut : undefined,
    rabattGrund: rechnung.rabattGrund ?? undefined,
    
    iban: firmenDaten.iban,
    bic: firmenDaten.bic,
    bank: firmenDaten.bank,
    zahlungsReferenz: `Rechnung ${rechnung.nummer}`,
    
    notizen: rechnung.notizen ?? undefined,
    
    waehrung: 'EUR',
  }
}

/**
 * Validiert XRechnung-Daten auf Pflichtfelder
 * Gibt Array von Fehlermeldungen zurück (leer = valide)
 */
export function validateXRechnungData(data: XRechnungData): string[] {
  const errors: string[] = []
  
  // Pflichtfelder prüfen
  if (!data.rechnungsNummer) errors.push('Rechnungsnummer fehlt (BT-1)')
  if (!data.rechnungsDatum) errors.push('Rechnungsdatum fehlt (BT-2)')
  if (!data.verkaeufer?.name) errors.push('Verkäufername fehlt (BT-27)')
  if (!data.verkaeufer?.strasse) errors.push('Verkäufer Straße fehlt (BT-35)')
  if (!data.verkaeufer?.plz) errors.push('Verkäufer PLZ fehlt (BT-38)')
  if (!data.verkaeufer?.ort) errors.push('Verkäufer Ort fehlt (BT-37)')
  if (!data.kaeufer?.name) errors.push('Käufername fehlt (BT-44)')
  if (!data.kaeufer?.strasse) errors.push('Käufer Straße fehlt (BT-50)')
  if (!data.kaeufer?.plz) errors.push('Käufer PLZ fehlt (BT-53)')
  if (!data.kaeufer?.ort) errors.push('Käufer Ort fehlt (BT-52)')
  if (!data.positionen?.length) errors.push('Mindestens eine Position erforderlich (BG-25)')
  
  // BT-34: Seller electronic address (Pflicht in XRechnung 3.0)
  if (!data.verkaeuferEmail) {
    errors.push('Verkäufer E-Mail-Adresse fehlt (BT-34)')
  }

  // Steuernummer oder USt-ID (BT-31/BT-32)
  if (!data.verkaeuferUstId && !data.verkaeuferSteuernummer) {
    errors.push('Verkäufer USt-ID oder Steuernummer erforderlich (BT-31/BT-32)')
  }
  
  // Positionen prüfen
  data.positionen?.forEach((pos, idx) => {
    if (!pos.beschreibung) errors.push(`Position ${idx + 1}: Beschreibung fehlt (BT-153)`)
    if (pos.menge === undefined || pos.menge === null) errors.push(`Position ${idx + 1}: Menge fehlt (BT-129)`)
    if (pos.einzelpreis === undefined || pos.einzelpreis === null) errors.push(`Position ${idx + 1}: Einzelpreis fehlt (BT-146)`)
  })
  
  return errors
}
