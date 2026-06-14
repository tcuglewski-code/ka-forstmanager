/**
 * A8 Rechnungs-Agent — wiederverwendbare PDF-Erzeugung (REC-004)
 *
 * Kapselt die ZUGFeRD-2.3/Factur-X-PDF-Erzeugung (EN16931, PDF/A-3b) als Lib,
 * damit sowohl der Download-Endpoint als auch der E-Mail-Versand (REC-006)
 * dieselben Bytes erzeugen. Reine Lese-Operation, persistiert nichts.
 */
import { prisma } from "@/lib/prisma"
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import QRCode from "qrcode"
import { generateZUGFeRDXml, embedZUGFeRDXml, rechnungToZUGFeRDData } from "@/lib/zugferd"

const baseUrl = process.env.NEXTAUTH_URL || "https://ka-forstmanager.vercel.app"
Font.register({
  family: "NotoSans",
  fonts: [
    { src: `${baseUrl}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" as const },
    { src: `${baseUrl}/fonts/NotoSans-Bold.ttf`, fontWeight: "bold" as const },
  ],
})

const FIRMA = {
  name: process.env.COMPANY_NAME || "Koch Aufforstung GmbH",
  strasse: process.env.COMPANY_STRASSE || "Hauptstraße 42",
  plz: process.env.COMPANY_PLZ || "54290",
  ort: process.env.COMPANY_ORT || "Trier",
  land: "Deutschland",
  telefon: process.env.COMPANY_TELEFON || "+49 651 12345678",
  email: process.env.COMPANY_EMAIL || "info@koch-aufforstung.de",
  web: "https://peru-otter-113714.hostingersite.com",
  iban: process.env.COMPANY_IBAN || "DE89 3704 0044 0532 0130 00",
  bic: process.env.COMPANY_BIC || "COBADEFFXXX",
  bank: process.env.COMPANY_BANK || "Commerzbank Trier",
  steuernummer: process.env.COMPANY_STEUERNUMMER || "22/123/45678",
  ustIdNr: process.env.COMPANY_UST_IDNR || process.env.COMPANY_VAT_ID || "DE123456789",
  handelsregister: process.env.COMPANY_HRB || "HRB 12345, Amtsgericht Trier",
  geschaeftsfuehrer: process.env.COMPANY_GF || "Sebastian Koch",
  kleinunternehmer: process.env.COMPANY_KLEINUNTERNEHMER === "true",
}

const styles = StyleSheet.create({
  seite: { padding: 40, fontFamily: "NotoSans", fontSize: 10, color: "#1a1a1a", position: "relative" },
  briefkopf: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#2C3A1C", paddingBottom: 12 },
  firmaBlock: { maxWidth: "60%" },
  firmaName: { fontSize: 18, fontFamily: "NotoSans", fontWeight: "bold" as const, color: "#2C3A1C" },
  firmaUntertitel: { fontSize: 9, color: "#666", marginTop: 2 },
  firmaKontakt: { fontSize: 8, color: "#666", marginTop: 4 },
  rechnungBlock: { alignItems: "flex-end" },
  rechnungTitel: { fontSize: 22, fontFamily: "NotoSans", fontWeight: "bold" as const, color: "#1a1a1a", marginBottom: 6 },
  rechnungMeta: { fontSize: 9, color: "#666", textAlign: "right" },
  rechnungMetaBold: { fontSize: 10, fontFamily: "NotoSans", fontWeight: "bold" as const, textAlign: "right" },
  empfaengerBox: { marginBottom: 24, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 4 },
  empfaengerLabel: { fontSize: 8, color: "#666", marginBottom: 4 },
  empfaengerName: { fontSize: 11, fontFamily: "NotoSans", fontWeight: "bold" as const, marginBottom: 2 },
  empfaengerDetails: { fontSize: 10, color: "#333" },
  tabelle: { marginTop: 8, marginBottom: 16 },
  tabelleKopf: { flexDirection: "row", backgroundColor: "#2C3A1C", color: "#fff", padding: "8 6", fontFamily: "NotoSans", fontWeight: "bold" as const, fontSize: 9 },
  tabelleZeile: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd", padding: "6 6", fontSize: 9 },
  tabelleZeileAlt: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd", padding: "6 6", fontSize: 9, backgroundColor: "#fafafa" },
  spaltePos: { width: "8%", textAlign: "center" },
  spalteBeschr: { width: "38%" },
  spalteMenge: { width: "12%", textAlign: "right" },
  spalteEinheit: { width: "10%", textAlign: "center" },
  spaltePreis: { width: "14%", textAlign: "right" },
  spalteMwst: { width: "8%", textAlign: "right" },
  spalteGesamt: { width: "10%", textAlign: "right" },
  summenBlock: { marginTop: 8, alignSelf: "flex-end", width: "50%" },
  summenZeile: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 8 },
  summenZeileLabel: { fontSize: 9, color: "#666" },
  summenZeileWert: { fontSize: 9, textAlign: "right" },
  gesamtZeile: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 2, borderTopColor: "#2C3A1C", paddingVertical: 8, paddingHorizontal: 8, marginTop: 4, backgroundColor: "#f4f4f4" },
  gesamtLabel: { fontSize: 12, fontFamily: "NotoSans", fontWeight: "bold" as const, color: "#2C3A1C" },
  gesamtWert: { fontSize: 14, fontFamily: "NotoSans", fontWeight: "bold" as const, color: "#2C3A1C" },
  zahlungsBox: { marginTop: 20, padding: 12, borderWidth: 1, borderColor: "#2C3A1C", borderRadius: 4, backgroundColor: "#f0f4e8" },
  zahlungsBoxTitel: { fontSize: 11, fontFamily: "NotoSans", fontWeight: "bold" as const, color: "#2C3A1C", marginBottom: 8 },
  zahlungsGrid: { flexDirection: "row", justifyContent: "space-between" },
  zahlungsSpalte: { width: "48%" },
  zahlungsZeile: { flexDirection: "row", marginBottom: 4 },
  zahlungsLabel: { fontSize: 9, color: "#666", width: "40%" },
  zahlungsWert: { fontSize: 9, fontFamily: "NotoSans", fontWeight: "bold" as const, width: "60%" },
  qrCodeBlock: { alignItems: "center", justifyContent: "center", paddingLeft: 10 },
  qrCodeImage: { width: 80, height: 80 },
  qrCodeHinweis: { fontSize: 7, color: "#666", marginTop: 4, textAlign: "center" },
  hinweisBox: { marginTop: 16, padding: 10, backgroundColor: "#fff9e6", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#f5a623" },
  hinweisText: { fontSize: 8, color: "#856404" },
  fusszeile: { position: "absolute", bottom: 25, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: "#ccc", paddingTop: 8 },
  fusszeileGrid: { flexDirection: "row", justifyContent: "space-between" },
  fusszeileSpalte: { width: "30%" },
  fusszeileLabel: { fontSize: 7, color: "#999", marginBottom: 2 },
  fusszeileText: { fontSize: 7, color: "#666" },
  fusszeileMitte: { width: "40%", textAlign: "center" },
  seitenZahl: { fontSize: 7, color: "#999", textAlign: "center", marginTop: 8 },
})

function formatEuro(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}
function formatDatum(d: Date | string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("de-DE")
}

async function generateEpcQrCode(
  empfaenger: string,
  iban: string,
  bic: string,
  betrag: number,
  verwendungszweck: string
): Promise<string> {
  const epcData = [
    "BCD", "002", "1", "SCT",
    bic.replace(/\s/g, ""),
    empfaenger.substring(0, 70),
    iban.replace(/\s/g, ""),
    `EUR${betrag.toFixed(2)}`,
    "",
    verwendungszweck.substring(0, 140),
    "",
  ].join("\n")
  const qrBuffer = await QRCode.toBuffer(epcData, {
    errorCorrectionLevel: "M", margin: 2, width: 200, type: "png",
    color: { dark: "#000000", light: "#ffffff" },
  })
  return `data:image/png;base64,${qrBuffer.toString("base64")}`
}

export interface RechnungsPdfErgebnis {
  bytes: Uint8Array
  dateiname: string
  nummer: string
  brutto: number
  kundenName: string
  kundenEmail: string | null
  zugferdEmbedded: boolean
}

/**
 * Lädt eine Rechnung und erzeugt das ZUGFeRD-PDF (Bytes + Metadaten).
 * Wirft, wenn die Rechnung nicht existiert.
 */
export async function generateRechnungsPdf(id: string): Promise<RechnungsPdfErgebnis> {
  const rechnung = await prisma.rechnung.findUnique({
    where: { id },
    include: {
      auftrag: {
        select: {
          titel: true, waldbesitzer: true, waldbesitzerEmail: true,
          waldbesitzerTelefon: true, standort: true, flaeche_ha: true, bundesland: true,
        },
      },
      positionen: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!rechnung) throw new Error("Rechnung nicht gefunden")

  const mwstSatz = rechnung.mwst ?? 19
  const netto = rechnung.nettoBetrag ?? rechnung.betrag
  const rabattProzent = rechnung.rabatt ?? 0
  const rabattAbsolut = rechnung.rabattBetrag ?? (netto * rabattProzent) / 100
  const nettoNachRabatt = netto - rabattAbsolut
  const mwstBetrag = rechnung.mwstBetrag ?? (nettoNachRabatt * mwstSatz) / 100
  const brutto = rechnung.bruttoBetrag ?? nettoNachRabatt + mwstBetrag
  const verwendungszweck = `Rechnung ${rechnung.nummer}`
  const kleinunternehmer = FIRMA.kleinunternehmer

  let qrCodeDataUrl: string | null = null
  try {
    qrCodeDataUrl = await generateEpcQrCode(FIRMA.name, FIRMA.iban, FIRMA.bic, brutto, verwendungszweck)
  } catch (error) {
    console.error("[A8-PDF] QR-Code Generierung fehlgeschlagen:", error)
  }

  const dokument = (
    <Document title={`Rechnung ${rechnung.nummer}`} author={FIRMA.name} subject={`Rechnung für ${rechnung.auftrag?.waldbesitzer ?? "Kunde"}`}>
      <Page size="A4" style={styles.seite}>
        <View style={styles.briefkopf}>
          <View style={styles.firmaBlock}>
            <Text style={styles.firmaName}>{FIRMA.name}</Text>
            <Text style={styles.firmaUntertitel}>Professionelle Forstwirtschaft & Aufforstung</Text>
            <Text style={styles.firmaKontakt}>{FIRMA.strasse} · {FIRMA.plz} {FIRMA.ort}</Text>
            <Text style={styles.firmaKontakt}>Tel: {FIRMA.telefon} · {FIRMA.email}</Text>
          </View>
          <View style={styles.rechnungBlock}>
            <Text style={styles.rechnungTitel}>RECHNUNG</Text>
            <Text style={styles.rechnungMetaBold}>Nr. {rechnung.nummer}</Text>
            <Text style={styles.rechnungMeta}>Rechnungsdatum: {formatDatum(rechnung.rechnungsDatum)}</Text>
            {rechnung.faelligAm && <Text style={styles.rechnungMeta}>Fällig bis: {formatDatum(rechnung.faelligAm)}</Text>}
          </View>
        </View>

        <View style={styles.empfaengerBox}>
          <Text style={styles.empfaengerLabel}>Rechnungsempfänger</Text>
          <Text style={styles.empfaengerName}>{rechnung.auftrag?.waldbesitzer ?? "Kunde"}</Text>
          {rechnung.auftrag?.standort && (
            <Text style={styles.empfaengerDetails}>{rechnung.auftrag.standort}{rechnung.auftrag.bundesland ? `, ${rechnung.auftrag.bundesland}` : ""}</Text>
          )}
          {rechnung.auftrag?.waldbesitzerEmail && <Text style={styles.empfaengerDetails}>{rechnung.auftrag.waldbesitzerEmail}</Text>}
        </View>

        <View style={styles.tabelle}>
          <View style={styles.tabelleKopf}>
            <Text style={styles.spaltePos}>Pos.</Text>
            <Text style={styles.spalteBeschr}>Beschreibung</Text>
            <Text style={styles.spalteMenge}>Menge</Text>
            <Text style={styles.spalteEinheit}>Einheit</Text>
            <Text style={styles.spaltePreis}>Einzelpreis</Text>
            <Text style={styles.spalteMwst}>MwSt</Text>
            <Text style={styles.spalteGesamt}>Gesamt</Text>
          </View>
          {rechnung.positionen.length > 0 ? (
            rechnung.positionen.map((pos, i) => (
              <View key={pos.id} style={i % 2 === 0 ? styles.tabelleZeile : styles.tabelleZeileAlt}>
                <Text style={styles.spaltePos}>{i + 1}</Text>
                <Text style={styles.spalteBeschr}>{pos.beschreibung}</Text>
                <Text style={styles.spalteMenge}>{pos.menge.toFixed(2)}</Text>
                <Text style={styles.spalteEinheit}>{pos.einheit}</Text>
                <Text style={styles.spaltePreis}>{formatEuro(pos.preisProEinheit)}</Text>
                <Text style={styles.spalteMwst}>{kleinunternehmer ? "—" : `${pos.mwstSatz ?? mwstSatz}%`}</Text>
                <Text style={styles.spalteGesamt}>{formatEuro(pos.gesamt)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tabelleZeile}>
              <Text style={styles.spaltePos}>1</Text>
              <Text style={styles.spalteBeschr}>{rechnung.notizen ?? rechnung.auftrag?.titel ?? "Forstdienstleistung"}</Text>
              <Text style={styles.spalteMenge}>1,00</Text>
              <Text style={styles.spalteEinheit}>pauschal</Text>
              <Text style={styles.spaltePreis}>{formatEuro(netto)}</Text>
              <Text style={styles.spalteMwst}>{kleinunternehmer ? "—" : `${mwstSatz}%`}</Text>
              <Text style={styles.spalteGesamt}>{formatEuro(netto)}</Text>
            </View>
          )}
        </View>

        <View style={styles.summenBlock}>
          <View style={styles.summenZeile}>
            <Text style={styles.summenZeileLabel}>Nettobetrag:</Text>
            <Text style={styles.summenZeileWert}>{formatEuro(netto)}</Text>
          </View>
          {!kleinunternehmer && (
            <View style={styles.summenZeile}>
              <Text style={styles.summenZeileLabel}>MwSt. ({mwstSatz}%):</Text>
              <Text style={styles.summenZeileWert}>{formatEuro(mwstBetrag)}</Text>
            </View>
          )}
          <View style={styles.gesamtZeile}>
            <Text style={styles.gesamtLabel}>Gesamtbetrag:</Text>
            <Text style={styles.gesamtWert}>{formatEuro(brutto)}</Text>
          </View>
        </View>

        <View style={styles.zahlungsBox}>
          <Text style={styles.zahlungsBoxTitel}>Zahlungsinformationen</Text>
          <View style={styles.zahlungsGrid}>
            <View style={styles.zahlungsSpalte}>
              <View style={styles.zahlungsZeile}><Text style={styles.zahlungsLabel}>Empfänger:</Text><Text style={styles.zahlungsWert}>{FIRMA.name}</Text></View>
              <View style={styles.zahlungsZeile}><Text style={styles.zahlungsLabel}>IBAN:</Text><Text style={styles.zahlungsWert}>{FIRMA.iban}</Text></View>
              <View style={styles.zahlungsZeile}><Text style={styles.zahlungsLabel}>BIC:</Text><Text style={styles.zahlungsWert}>{FIRMA.bic}</Text></View>
              <View style={styles.zahlungsZeile}><Text style={styles.zahlungsLabel}>Bank:</Text><Text style={styles.zahlungsWert}>{FIRMA.bank}</Text></View>
              <View style={styles.zahlungsZeile}><Text style={styles.zahlungsLabel}>Verwendung:</Text><Text style={styles.zahlungsWert}>{verwendungszweck}</Text></View>
              {rechnung.zipayoLink && (
                <View style={styles.zahlungsZeile}><Text style={styles.zahlungsLabel}>Online:</Text><Text style={styles.zahlungsWert}>{rechnung.zipayoLink}</Text></View>
              )}
              <View style={[styles.zahlungsZeile, { marginTop: 8 }]}><Text style={styles.zahlungsLabel}>Betrag:</Text><Text style={[styles.zahlungsWert, { fontSize: 11 }]}>{formatEuro(brutto)}</Text></View>
            </View>
            {qrCodeDataUrl && (
              <View style={styles.qrCodeBlock}>
                <Image style={styles.qrCodeImage} src={qrCodeDataUrl} />
                <Text style={styles.qrCodeHinweis}>GiroCode scannen</Text>
                <Text style={styles.qrCodeHinweis}>für schnelle Überweisung</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.hinweisBox}>
          <Text style={styles.hinweisText}>
            {rechnung.zahlungsBedingung ? `Zahlungsbedingung: ${rechnung.zahlungsBedingung}` : "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 30 Tagen nach Rechnungserhalt."}
          </Text>
          {kleinunternehmer && (
            <Text style={[styles.hinweisText, { marginTop: 2 }]}>Gemäß §19 UStG wird keine Umsatzsteuer ausgewiesen (Kleinunternehmer).</Text>
          )}
        </View>

        <View style={styles.fusszeile}>
          <View style={styles.fusszeileGrid}>
            <View style={styles.fusszeileSpalte}>
              <Text style={styles.fusszeileLabel}>Firmensitz</Text>
              <Text style={styles.fusszeileText}>{FIRMA.name}</Text>
              <Text style={styles.fusszeileText}>{FIRMA.strasse}</Text>
              <Text style={styles.fusszeileText}>{FIRMA.plz} {FIRMA.ort}</Text>
            </View>
            <View style={styles.fusszeileMitte}>
              <Text style={styles.fusszeileLabel}>Steuerdaten</Text>
              <Text style={styles.fusszeileText}>St.-Nr.: {FIRMA.steuernummer}</Text>
              <Text style={styles.fusszeileText}>USt-IdNr.: {FIRMA.ustIdNr}</Text>
              <Text style={styles.fusszeileText}>{FIRMA.handelsregister}</Text>
            </View>
            <View style={[styles.fusszeileSpalte, { alignItems: "flex-end" }]}>
              <Text style={styles.fusszeileLabel}>Geschäftsführung</Text>
              <Text style={styles.fusszeileText}>{FIRMA.geschaeftsfuehrer}</Text>
              <Text style={styles.fusszeileText}>{FIRMA.telefon}</Text>
              <Text style={styles.fusszeileText}>{FIRMA.email}</Text>
            </View>
          </View>
          <Text style={styles.seitenZahl}>Rechnung {rechnung.nummer} · Erstellt am {new Date().toLocaleDateString("de-DE")}</Text>
        </View>
      </Page>
    </Document>
  )

  const pdfBuffer = await renderToBuffer(dokument)
  let finalPdfBytes: Uint8Array = pdfBuffer
  let zugferdEmbedded = false
  try {
    const zugferdData = rechnungToZUGFeRDData(rechnung, {
      name: FIRMA.name, strasse: FIRMA.strasse, plz: FIRMA.plz, ort: FIRMA.ort,
      land: "DE", steuernummer: FIRMA.steuernummer, ustIdNr: FIRMA.ustIdNr,
      iban: FIRMA.iban, bic: FIRMA.bic, bank: FIRMA.bank,
    })
    const zugferdXml = generateZUGFeRDXml(zugferdData)
    finalPdfBytes = await embedZUGFeRDXml(new Uint8Array(pdfBuffer), zugferdXml)
    zugferdEmbedded = true
  } catch (error) {
    console.error("[A8-PDF] ZUGFeRD-Einbettung fehlgeschlagen, liefere PDF ohne XML:", error)
    finalPdfBytes = pdfBuffer
  }

  const dateiname = `Rechnung_${rechnung.nummer.replace(/[^a-zA-Z0-9-]/g, "_")}_ZUGFeRD.pdf`

  return {
    bytes: finalPdfBytes,
    dateiname,
    nummer: rechnung.nummer,
    brutto,
    kundenName: rechnung.auftrag?.waldbesitzer ?? "Kunde",
    kundenEmail: rechnung.auftrag?.waldbesitzerEmail ?? null,
    zugferdEmbedded,
  }
}
