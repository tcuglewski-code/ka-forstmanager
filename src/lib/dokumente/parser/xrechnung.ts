/**
 * DOK-005: XRechnung/ZUGFeRD-Parser (XML, deterministisch — kein OCR).
 *
 * Mustangproject ist ein Java-Tool und steht in der Vercel-Runtime nicht
 * zur Verfügung. Daher: eigener schlanker Parser auf Basis von
 * fast-xml-parser für die beiden EN16931-Syntaxen:
 *   - UBL (urn:oasis:…:Invoice-2)            → XRechnung (UBL)
 *   - UN/CEFACT CII (CrossIndustryInvoice)   → XRechnung (CII) / ZUGFeRD
 *
 * Konfidenz: 1.0 für alle aus XML geparsten Felder (deterministisch).
 * Sicherheit: XXE/DTD deaktiviert (fast-xml-parser löst Entities nicht auf),
 * Größen-Limit gegen Billion-Laughs-artige Inputs.
 */
import { XMLParser, XMLValidator } from "fast-xml-parser"
import { z } from "zod"
import { landAusUstId, pruefeMwstSaetze, type DachLand } from "../compliance/ust-validierung"

const MAX_XML_BYTES = 5 * 1024 * 1024 // 5 MB — E-Rechnungen sind klein

export interface GeparsteRechnungsPosition {
  artikelBezeichnung: string
  lieferantArtikelNr: string | null
  menge: number
  einheit: string
  einzelpreis: number
  gesamtpreis: number
  mwstSatz: number
  konfidenz: number
}

export interface ExtrahiertesRechnungsDokument {
  syntax: "UBL" | "CII"
  rechnungsNr: string
  datum: string | null // ISO YYYY-MM-DD
  faelligDatum: string | null
  lieferantName: string
  lieferantUstId: string | null
  lieferantLand: DachLand | null
  gesamtBetrag: number
  nettoBetrag: number | null
  waehrung: string
  mwstSaetze: number[]
  mwstGueltig: boolean
  mwstHinweise: string[]
  positionen: GeparsteRechnungsPosition[]
  /** 1.0 — deterministisch aus XML */
  konfidenz: number
}

export class XRechnungParseError extends Error {}

// ---------- Hilfen: defensives Lesen aus geparstem XML-Objekt ----------

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false, // alles als String — wir konvertieren explizit
  processEntities: false, // XXE-Schutz: keine Entity-Auflösung
})

type XmlNode = Record<string, unknown>

function asNode(v: unknown): XmlNode | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as XmlNode) : null
}

function asArray(v: unknown): unknown[] {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

/** Liest einen Text-Wert: String direkt, oder { "#text": "..." } */
function text(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null
  if (typeof v === "number") return String(v)
  const node = asNode(v)
  if (node && typeof node["#text"] === "string") return (node["#text"] as string).trim() || null
  if (node && typeof node["#text"] === "number") return String(node["#text"])
  return null
}

function num(v: unknown): number | null {
  const t = text(v)
  if (t === null) return null
  const n = Number(t.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Attribut-Wert lesen (z. B. unitCode) */
function attr(v: unknown, name: string): string | null {
  const node = asNode(v)
  const raw = node?.[`@_${name}`]
  return typeof raw === "string" ? raw : null
}

function pfad(root: unknown, ...keys: string[]): unknown {
  let cur: unknown = root
  for (const key of keys) {
    const node = asNode(cur)
    if (!node) return undefined
    cur = node[key]
  }
  return cur
}

// ---------- UBL ----------

function parseUBL(invoice: XmlNode): ExtrahiertesRechnungsDokument {
  const lieferantParty = pfad(invoice, "AccountingSupplierParty", "Party")
  const lieferantName =
    text(pfad(lieferantParty, "PartyLegalEntity", "RegistrationName")) ??
    text(pfad(lieferantParty, "PartyName", "Name")) ??
    ""
  const ustId =
    text(pfad(lieferantParty, "PartyTaxScheme", "CompanyID")) ??
    text(pfad(lieferantParty, "PartyLegalEntity", "CompanyID"))

  const monetary = pfad(invoice, "LegalMonetaryTotal")
  const gesamt = num(pfad(monetary, "PayableAmount")) ?? num(pfad(monetary, "TaxInclusiveAmount"))
  const netto = num(pfad(monetary, "TaxExclusiveAmount")) ?? num(pfad(monetary, "LineExtensionAmount"))
  const waehrung =
    text(pfad(invoice, "DocumentCurrencyCode")) ??
    attr(pfad(monetary, "PayableAmount"), "currencyID") ??
    "EUR"

  const mwstSaetze = new Set<number>()
  for (const sub of asArray(pfad(invoice, "TaxTotal", "TaxSubtotal"))) {
    const satz = num(pfad(sub, "TaxCategory", "Percent"))
    if (satz !== null) mwstSaetze.add(satz)
  }

  const positionen: GeparsteRechnungsPosition[] = []
  for (const line of asArray(invoice["InvoiceLine"])) {
    const menge = num(pfad(line, "InvoicedQuantity")) ?? 0
    const einheit = attr(pfad(line, "InvoicedQuantity"), "unitCode") ?? "Stück"
    const einzelpreis = num(pfad(line, "Price", "PriceAmount")) ?? 0
    const gesamtpreis = num(pfad(line, "LineExtensionAmount")) ?? menge * einzelpreis
    const satz = num(pfad(line, "Item", "ClassifiedTaxCategory", "Percent")) ?? 0
    positionen.push({
      artikelBezeichnung: text(pfad(line, "Item", "Name")) ?? "",
      lieferantArtikelNr: text(pfad(line, "Item", "SellersItemIdentification", "ID")),
      menge,
      einheit,
      einzelpreis,
      gesamtpreis,
      mwstSatz: satz,
      konfidenz: 1.0,
    })
    if (satz) mwstSaetze.add(satz)
  }

  return finalisiere({
    syntax: "UBL",
    rechnungsNr: text(invoice["ID"]) ?? "",
    datum: text(invoice["IssueDate"]),
    faelligDatum: text(invoice["DueDate"]),
    lieferantName,
    lieferantUstId: ustId,
    gesamtBetrag: gesamt ?? 0,
    nettoBetrag: netto,
    waehrung,
    mwstSaetze: [...mwstSaetze],
    positionen,
  })
}

// ---------- CII (ZUGFeRD / XRechnung-CII) ----------

function parseCII(cii: XmlNode): ExtrahiertesRechnungsDokument {
  const exchanged = pfad(cii, "ExchangedDocument")
  const transaction = pfad(cii, "SupplyChainTradeTransaction")
  const agreement = pfad(transaction, "ApplicableHeaderTradeAgreement")
  const settlement = pfad(transaction, "ApplicableHeaderTradeSettlement")

  const seller = pfad(agreement, "SellerTradeParty")
  const ustId = text(pfad(seller, "SpecifiedTaxRegistration", "ID"))

  const summation = pfad(settlement, "SpecifiedTradeSettlementHeaderMonetarySummation")
  const gesamt = num(pfad(summation, "GrandTotalAmount")) ?? num(pfad(summation, "DuePayableAmount"))
  const netto = num(pfad(summation, "TaxBasisTotalAmount")) ?? num(pfad(summation, "LineTotalAmount"))

  const mwstSaetze = new Set<number>()
  for (const tax of asArray(pfad(settlement, "ApplicableTradeTax"))) {
    const satz = num(pfad(tax, "RateApplicablePercent"))
    if (satz !== null) mwstSaetze.add(satz)
  }

  // Datum: <IssueDateTime><DateTimeString format="102">20260601</DateTimeString>
  const rohDatum = text(pfad(exchanged, "IssueDateTime", "DateTimeString"))
  const datum =
    rohDatum && /^\d{8}$/.test(rohDatum)
      ? `${rohDatum.slice(0, 4)}-${rohDatum.slice(4, 6)}-${rohDatum.slice(6, 8)}`
      : rohDatum

  const positionen: GeparsteRechnungsPosition[] = []
  for (const item of asArray(pfad(transaction, "IncludedSupplyChainTradeLineItem"))) {
    const delivery = pfad(item, "SpecifiedLineTradeDelivery")
    const lineSettlement = pfad(item, "SpecifiedLineTradeSettlement")
    const menge = num(pfad(delivery, "BilledQuantity")) ?? 0
    const einheit = attr(pfad(delivery, "BilledQuantity"), "unitCode") ?? "Stück"
    const einzelpreis =
      num(pfad(item, "SpecifiedLineTradeAgreement", "NetPriceProductTradePrice", "ChargeAmount")) ?? 0
    const gesamtpreis =
      num(pfad(lineSettlement, "SpecifiedTradeSettlementLineMonetarySummation", "LineTotalAmount")) ??
      menge * einzelpreis
    const satz = num(pfad(lineSettlement, "ApplicableTradeTax", "RateApplicablePercent")) ?? 0
    positionen.push({
      artikelBezeichnung: text(pfad(item, "SpecifiedTradeProduct", "Name")) ?? "",
      lieferantArtikelNr: text(pfad(item, "SpecifiedTradeProduct", "SellerAssignedID")),
      menge,
      einheit,
      einzelpreis,
      gesamtpreis,
      mwstSatz: satz,
      konfidenz: 1.0,
    })
    if (satz) mwstSaetze.add(satz)
  }

  return finalisiere({
    syntax: "CII",
    rechnungsNr: text(pfad(exchanged, "ID")) ?? "",
    datum,
    faelligDatum: null,
    lieferantName: text(pfad(seller, "Name")) ?? "",
    lieferantUstId: ustId,
    gesamtBetrag: gesamt ?? 0,
    nettoBetrag: netto,
    waehrung: text(pfad(settlement, "InvoiceCurrencyCode")) ?? "EUR",
    mwstSaetze: [...mwstSaetze],
    positionen,
  })
}

// ---------- Gemeinsame Finalisierung + Zod-Absicherung (NEVER #23) ----------

const DokumentSchema = z.object({
  syntax: z.enum(["UBL", "CII"]),
  rechnungsNr: z.string().min(1, "Rechnungsnummer fehlt"),
  datum: z.string().nullable(),
  faelligDatum: z.string().nullable(),
  lieferantName: z.string().min(1, "Lieferantenname fehlt"),
  lieferantUstId: z.string().nullable(),
  gesamtBetrag: z.number(),
  nettoBetrag: z.number().nullable(),
  waehrung: z.string().min(3).max(3),
  mwstSaetze: z.array(z.number()),
  positionen: z.array(
    z.object({
      artikelBezeichnung: z.string(),
      lieferantArtikelNr: z.string().nullable(),
      menge: z.number(),
      einheit: z.string(),
      einzelpreis: z.number(),
      gesamtpreis: z.number(),
      mwstSatz: z.number(),
      konfidenz: z.number(),
    })
  ),
})

function finalisiere(roh: z.infer<typeof DokumentSchema>): ExtrahiertesRechnungsDokument {
  const parsed = DokumentSchema.safeParse(roh)
  if (!parsed.success) {
    throw new XRechnungParseError(
      `Pflichtfelder fehlen/ungültig: ${parsed.error.issues.map((i) => i.message).join("; ")}`
    )
  }
  const land = landAusUstId(parsed.data.lieferantUstId)
  const mwst = pruefeMwstSaetze(parsed.data.mwstSaetze, land)
  return {
    ...parsed.data,
    lieferantLand: land,
    mwstGueltig: mwst.gueltig,
    mwstHinweise: mwst.hinweise,
    konfidenz: 1.0,
  }
}

// ---------- Einstiegspunkt ----------

export function parseXRechnung(xmlBuffer: Buffer): ExtrahiertesRechnungsDokument {
  if (xmlBuffer.length > MAX_XML_BYTES) {
    throw new XRechnungParseError(`XML zu groß (${xmlBuffer.length} Bytes, max ${MAX_XML_BYTES})`)
  }
  const xml = xmlBuffer.toString("utf8")
  if (xml.includes("<!DOCTYPE") || xml.includes("<!ENTITY")) {
    // XXE-/Billion-Laughs-Schutz: DTDs sind in EN16931 nicht zulässig
    throw new XRechnungParseError("DTD/Entity-Deklarationen sind nicht erlaubt (XXE-Schutz)")
  }
  const valid = XMLValidator.validate(xml)
  if (valid !== true) {
    throw new XRechnungParseError(`XML ungültig: ${valid.err.msg}`)
  }
  const doc = asNode(parser.parse(xml))
  if (!doc) throw new XRechnungParseError("XML konnte nicht geparst werden")

  const invoice = asNode(doc["Invoice"])
  if (invoice) return parseUBL(invoice)

  const cii = asNode(doc["CrossIndustryInvoice"])
  if (cii) return parseCII(cii)

  throw new XRechnungParseError("Weder UBL-Invoice noch CrossIndustryInvoice gefunden")
}
