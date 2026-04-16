// Sprint Q036: Rechnungs-PDF Export mit QR-Code, IBAN/BIC, Steuernummer
// Sprint Q037: ZUGFeRD 2.3 / Factur-X E-Rechnung (EN 16931, gesetzeskonform ab 2025)
// Generiert ein professionelles PDF-Dokument für Rechnungen mit eingebettetem XML

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"
import QRCode from "qrcode"
import { generateZUGFeRDXml, embedZUGFeRDXml, rechnungToZUGFeRDData } from "@/lib/zugferd"
import path from "path"

// NotoSans Font registrieren für PDF/A-3b Font-Embedding Compliance
Font.register({
  family: "NotoSans",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"), fontWeight: "normal" as const },
    { src: path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"), fontWeight: "bold" as const },
  ],
})

// Firmendaten (Koch Aufforstung GmbH) - ZUGFeRD-relevant aus ENV
const FIRMA = {
  name: "Koch Aufforstung GmbH",
  strasse: "Hauptstraße 42",
  plz: "54290",
  ort: "Trier",
  land: "Deutschland",
  telefon: "+49 651 12345678",
  email: "info@koch-aufforstung.de",
  web: "https://peru-otter-113714.hostingersite.com",
  iban: process.env.COMPANY_IBAN || "DE89 3704 0044 0532 0130 00",
  bic: process.env.COMPANY_BIC || "COBADEFFXXX",
  bank: "Commerzbank Trier",
  steuernummer: "22/123/45678",
  ustIdNr: process.env.COMPANY_VAT_ID || "DE123456789",
  handelsregister: "HRB 12345, Amtsgericht Trier",
  geschaeftsfuehrer: "Sebastian Koch",
}

// PDF-Stile (DIN A4, professionell)
const styles = StyleSheet.create({
  seite: {
    padding: 40,
    fontFamily: "NotoSans",
    fontSize: 10,
    color: "#1a1a1a",
    position: "relative",
  },
  // Briefkopf
  briefkopf: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2C3A1C",
    paddingBottom: 12,
  },
  firmaBlock: {
    maxWidth: "60%",
  },
  firmaName: {
    fontSize: 18,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    color: "#2C3A1C",
  },
  firmaUntertitel: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  firmaKontakt: {
    fontSize: 8,
    color: "#666",
    marginTop: 4,
  },
  rechnungBlock: {
    alignItems: "flex-end",
  },
  rechnungTitel: {
    fontSize: 22,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    color: "#1a1a1a",
    marginBottom: 6,
  },
  rechnungMeta: {
    fontSize: 9,
    color: "#666",
    textAlign: "right",
  },
  rechnungMetaBold: {
    fontSize: 10,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    textAlign: "right",
  },
  // Empfänger
  empfaengerBox: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  empfaengerLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 4,
  },
  empfaengerName: {
    fontSize: 11,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    marginBottom: 2,
  },
  empfaengerDetails: {
    fontSize: 10,
    color: "#333",
  },
  // Tabelle
  tabelle: {
    marginTop: 8,
    marginBottom: 16,
  },
  tabelleKopf: {
    flexDirection: "row",
    backgroundColor: "#2C3A1C",
    color: "#fff",
    padding: "8 6",
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    fontSize: 9,
  },
  tabelleZeile: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: "6 6",
    fontSize: 9,
  },
  tabelleZeileAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: "6 6",
    fontSize: 9,
    backgroundColor: "#fafafa",
  },
  spaltePos: { width: "8%", textAlign: "center" },
  spalteBeschr: { width: "42%" },
  spalteMenge: { width: "12%", textAlign: "right" },
  spalteEinheit: { width: "10%", textAlign: "center" },
  spaltePreis: { width: "14%", textAlign: "right" },
  spalteGesamt: { width: "14%", textAlign: "right" },
  // Summen
  summenBlock: {
    marginTop: 8,
    alignSelf: "flex-end",
    width: "50%",
  },
  summenZeile: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  summenZeileLabel: {
    fontSize: 9,
    color: "#666",
  },
  summenZeileWert: {
    fontSize: 9,
    textAlign: "right",
  },
  summenZeileRabatt: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
    color: "#c00",
  },
  gesamtZeile: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#2C3A1C",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 4,
    backgroundColor: "#f4f4f4",
  },
  gesamtLabel: {
    fontSize: 12,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    color: "#2C3A1C",
  },
  gesamtWert: {
    fontSize: 14,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    color: "#2C3A1C",
  },
  // Zahlungshinweis-Box
  zahlungsBox: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2C3A1C",
    borderRadius: 4,
    backgroundColor: "#f0f4e8",
  },
  zahlungsBoxTitel: {
    fontSize: 11,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    color: "#2C3A1C",
    marginBottom: 8,
  },
  zahlungsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  zahlungsSpalte: {
    width: "48%",
  },
  zahlungsZeile: {
    flexDirection: "row",
    marginBottom: 4,
  },
  zahlungsLabel: {
    fontSize: 9,
    color: "#666",
    width: "40%",
  },
  zahlungsWert: {
    fontSize: 9,
    fontFamily: "NotoSans", fontWeight: "bold" as const,
    width: "60%",
  },
  // QR-Code
  qrCodeBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 10,
  },
  qrCodeImage: {
    width: 80,
    height: 80,
  },
  qrCodeHinweis: {
    fontSize: 7,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  // Hinweise
  hinweisBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fff9e6",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#f5a623",
  },
  hinweisText: {
    fontSize: 8,
    color: "#856404",
  },
  // Fußzeile
  fusszeile: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 8,
  },
  fusszeileGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fusszeileSpalte: {
    width: "30%",
  },
  fusszeileLabel: {
    fontSize: 7,
    color: "#999",
    marginBottom: 2,
  },
  fusszeileText: {
    fontSize: 7,
    color: "#666",
  },
  fusszeileMitte: {
    width: "40%",
    textAlign: "center",
  },
  seitenZahl: {
    fontSize: 7,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
})

// Hilfsfunktionen
function formatEuro(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

function formatDatum(d: Date | string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("de-DE")
}

// EPC-QR-Code (GiroCode) generieren für SEPA-Überweisungen
async function generateEpcQrCode(
  empfaenger: string,
  iban: string,
  bic: string,
  betrag: number,
  verwendungszweck: string
): Promise<string> {
  // EPC-QR-Code Format (Version 002)
  const epcData = [
    "BCD",                           // Service Tag
    "002",                           // Version
    "1",                             // Encoding (UTF-8)
    "SCT",                           // SEPA Credit Transfer
    bic.replace(/\s/g, ""),          // BIC
    empfaenger.substring(0, 70),     // Empfänger (max 70 Zeichen)
    iban.replace(/\s/g, ""),         // IBAN
    `EUR${betrag.toFixed(2)}`,       // Betrag
    "",                              // Purpose (leer)
    verwendungszweck.substring(0, 140), // Verwendungszweck (max 140 Zeichen)
    "",                              // Hint (leer)
  ].join("\n")

  // QR-Code als Data-URL generieren
  const qrDataUrl = await QRCode.toDataURL(epcData, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 200,
    color: {
      dark: "#2C3A1C",
      light: "#ffffff",
    },
  })

  return qrDataUrl
}

// Laufende Rechnungsnummer extrahieren/validieren
function parseRechnungsnummer(nummer: string): { jahr: number; laufend: number } | null {
  // Format: RE-2026-0001 oder ähnlich
  const match = nummer.match(/(\d{4})[^\d]*(\d+)/)
  if (match) {
    return {
      jahr: parseInt(match[1], 10),
      laufend: parseInt(match[2], 10),
    }
  }
  return null
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Authentifizierung
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }
  if (!isAdminOrGF(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const { id } = await params

  // Rechnung laden mit Positionen und Auftrag
  const rechnung = await prisma.rechnung.findUnique({
    where: { id },
    include: {
      auftrag: {
        select: {
          titel: true,
          waldbesitzer: true,
          waldbesitzerEmail: true,
          waldbesitzerTelefon: true,
          standort: true,
          flaeche_ha: true,
          bundesland: true,
        },
      },
      positionen: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!rechnung) {
    return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
  }

  // Beträge berechnen
  const mwstSatz = rechnung.mwst ?? 19
  const netto = rechnung.nettoBetrag ?? rechnung.betrag
  const rabattProzent = rechnung.rabatt ?? 0
  const rabattAbsolut = rechnung.rabattBetrag ?? (netto * rabattProzent) / 100
  const nettoNachRabatt = netto - rabattAbsolut
  const mwstBetrag = (nettoNachRabatt * mwstSatz) / 100
  const brutto = rechnung.bruttoBetrag ?? nettoNachRabatt + mwstBetrag

  // Verwendungszweck für QR-Code
  const verwendungszweck = `Rechnung ${rechnung.nummer}`

  // QR-Code generieren
  let qrCodeDataUrl: string | null = null
  try {
    qrCodeDataUrl = await generateEpcQrCode(
      FIRMA.name,
      FIRMA.iban,
      FIRMA.bic,
      brutto,
      verwendungszweck
    )
  } catch (error) {
    console.error("QR-Code Generierung fehlgeschlagen:", error)
  }

  // Rechnungsnummer-Info
  const nummerInfo = parseRechnungsnummer(rechnung.nummer)

  // PDF-Dokument erstellen
  const dokument = (
    <Document
      title={`Rechnung ${rechnung.nummer}`}
      author={FIRMA.name}
      subject={`Rechnung für ${rechnung.auftrag?.waldbesitzer ?? "Kunde"}`}
    >
      <Page size="A4" style={styles.seite}>
        {/* ── Briefkopf ────────────────────────────────────────────── */}
        <View style={styles.briefkopf}>
          <View style={styles.firmaBlock}>
            <Text style={styles.firmaName}>{FIRMA.name}</Text>
            <Text style={styles.firmaUntertitel}>Professionelle Forstwirtschaft & Aufforstung</Text>
            <Text style={styles.firmaKontakt}>
              {FIRMA.strasse} · {FIRMA.plz} {FIRMA.ort}
            </Text>
            <Text style={styles.firmaKontakt}>
              Tel: {FIRMA.telefon} · {FIRMA.email}
            </Text>
          </View>
          <View style={styles.rechnungBlock}>
            <Text style={styles.rechnungTitel}>RECHNUNG</Text>
            <Text style={styles.rechnungMetaBold}>Nr. {rechnung.nummer}</Text>
            <Text style={styles.rechnungMeta}>
              Rechnungsdatum: {formatDatum(rechnung.rechnungsDatum)}
            </Text>
            {rechnung.faelligAm && (
              <Text style={styles.rechnungMeta}>
                Fällig bis: {formatDatum(rechnung.faelligAm)}
              </Text>
            )}
            {nummerInfo && (
              <Text style={[styles.rechnungMeta, { marginTop: 4 }]}>
                Lfd. Nr. {nummerInfo.laufend}/{nummerInfo.jahr}
              </Text>
            )}
          </View>
        </View>

        {/* ── Empfänger ────────────────────────────────────────────── */}
        <View style={styles.empfaengerBox}>
          <Text style={styles.empfaengerLabel}>Rechnungsempfänger</Text>
          <Text style={styles.empfaengerName}>
            {rechnung.auftrag?.waldbesitzer ?? "Kunde"}
          </Text>
          {rechnung.auftrag?.standort && (
            <Text style={styles.empfaengerDetails}>
              {rechnung.auftrag.standort}
              {rechnung.auftrag.bundesland ? `, ${rechnung.auftrag.bundesland}` : ""}
            </Text>
          )}
          {rechnung.auftrag?.waldbesitzerEmail && (
            <Text style={styles.empfaengerDetails}>
              {rechnung.auftrag.waldbesitzerEmail}
            </Text>
          )}
        </View>

        {/* ── Leistungstabelle ─────────────────────────────────────── */}
        <View style={styles.tabelle}>
          <View style={styles.tabelleKopf}>
            <Text style={styles.spaltePos}>Pos.</Text>
            <Text style={styles.spalteBeschr}>Beschreibung</Text>
            <Text style={styles.spalteMenge}>Menge</Text>
            <Text style={styles.spalteEinheit}>Einheit</Text>
            <Text style={styles.spaltePreis}>Einzelpreis</Text>
            <Text style={styles.spalteGesamt}>Gesamt</Text>
          </View>
          {rechnung.positionen.length > 0 ? (
            rechnung.positionen.map((pos, i) => (
              <View
                key={pos.id}
                style={i % 2 === 0 ? styles.tabelleZeile : styles.tabelleZeileAlt}
              >
                <Text style={styles.spaltePos}>{i + 1}</Text>
                <Text style={styles.spalteBeschr}>{pos.beschreibung}</Text>
                <Text style={styles.spalteMenge}>{pos.menge.toFixed(2)}</Text>
                <Text style={styles.spalteEinheit}>{pos.einheit}</Text>
                <Text style={styles.spaltePreis}>{formatEuro(pos.preisProEinheit)}</Text>
                <Text style={styles.spalteGesamt}>{formatEuro(pos.gesamt)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tabelleZeile}>
              <Text style={styles.spaltePos}>1</Text>
              <Text style={styles.spalteBeschr}>
                {rechnung.notizen ?? rechnung.auftrag?.titel ?? "Forstdienstleistung"}
              </Text>
              <Text style={styles.spalteMenge}>1,00</Text>
              <Text style={styles.spalteEinheit}>pauschal</Text>
              <Text style={styles.spaltePreis}>{formatEuro(netto)}</Text>
              <Text style={styles.spalteGesamt}>{formatEuro(netto)}</Text>
            </View>
          )}
        </View>

        {/* ── Summenblock ──────────────────────────────────────────── */}
        <View style={styles.summenBlock}>
          <View style={styles.summenZeile}>
            <Text style={styles.summenZeileLabel}>Nettobetrag:</Text>
            <Text style={styles.summenZeileWert}>{formatEuro(netto)}</Text>
          </View>
          {rabattAbsolut > 0 && (
            <View style={styles.summenZeileRabatt}>
              <Text>
                Rabatt{rabattProzent > 0 ? ` (${rabattProzent}%)` : ""}:
              </Text>
              <Text>− {formatEuro(rabattAbsolut)}</Text>
            </View>
          )}
          {rabattAbsolut > 0 && (
            <View style={styles.summenZeile}>
              <Text style={styles.summenZeileLabel}>Netto nach Rabatt:</Text>
              <Text style={styles.summenZeileWert}>{formatEuro(nettoNachRabatt)}</Text>
            </View>
          )}
          <View style={styles.summenZeile}>
            <Text style={styles.summenZeileLabel}>MwSt. ({mwstSatz}%):</Text>
            <Text style={styles.summenZeileWert}>{formatEuro(mwstBetrag)}</Text>
          </View>
          <View style={styles.gesamtZeile}>
            <Text style={styles.gesamtLabel}>Gesamtbetrag:</Text>
            <Text style={styles.gesamtWert}>{formatEuro(brutto)}</Text>
          </View>
        </View>

        {/* ── Zahlungshinweis-Box mit QR-Code ──────────────────────── */}
        <View style={styles.zahlungsBox}>
          <Text style={styles.zahlungsBoxTitel}>💳 Zahlungsinformationen</Text>
          <View style={styles.zahlungsGrid}>
            <View style={styles.zahlungsSpalte}>
              <View style={styles.zahlungsZeile}>
                <Text style={styles.zahlungsLabel}>Empfänger:</Text>
                <Text style={styles.zahlungsWert}>{FIRMA.name}</Text>
              </View>
              <View style={styles.zahlungsZeile}>
                <Text style={styles.zahlungsLabel}>IBAN:</Text>
                <Text style={styles.zahlungsWert}>{FIRMA.iban}</Text>
              </View>
              <View style={styles.zahlungsZeile}>
                <Text style={styles.zahlungsLabel}>BIC:</Text>
                <Text style={styles.zahlungsWert}>{FIRMA.bic}</Text>
              </View>
              <View style={styles.zahlungsZeile}>
                <Text style={styles.zahlungsLabel}>Bank:</Text>
                <Text style={styles.zahlungsWert}>{FIRMA.bank}</Text>
              </View>
              <View style={styles.zahlungsZeile}>
                <Text style={styles.zahlungsLabel}>Verwendung:</Text>
                <Text style={styles.zahlungsWert}>{verwendungszweck}</Text>
              </View>
              <View style={[styles.zahlungsZeile, { marginTop: 8 }]}>
                <Text style={styles.zahlungsLabel}>Betrag:</Text>
                <Text style={[styles.zahlungsWert, { fontSize: 11 }]}>{formatEuro(brutto)}</Text>
              </View>
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

        {/* ── Zahlungshinweis ──────────────────────────────────────── */}
        <View style={styles.hinweisBox}>
          <Text style={styles.hinweisText}>
            {rechnung.zahlungsBedingung
              ? `Zahlungsbedingung: ${rechnung.zahlungsBedingung}`
              : "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 30 Tagen nach Rechnungserhalt."}
          </Text>
          {rechnung.faelligAm && (
            <Text style={[styles.hinweisText, { marginTop: 2 }]}>
              Bei Zahlung bis {formatDatum(rechnung.faelligAm)} vermeiden Sie Mahngebühren.
            </Text>
          )}
        </View>

        {/* ── Notizen ──────────────────────────────────────────────── */}
        {rechnung.notizen && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 8, color: "#666", fontFamily: "NotoSans", fontWeight: "bold" as const }}>
              Anmerkungen:
            </Text>
            <Text style={{ fontSize: 8, color: "#444", marginTop: 2 }}>
              {rechnung.notizen}
            </Text>
          </View>
        )}

        {/* ── Fußzeile ─────────────────────────────────────────────── */}
        <View style={styles.fusszeile}>
          <View style={styles.fusszeileGrid}>
            <View style={styles.fusszeileSpalte}>
              <Text style={styles.fusszeileLabel}>Firmensitz</Text>
              <Text style={styles.fusszeileText}>{FIRMA.name}</Text>
              <Text style={styles.fusszeileText}>{FIRMA.strasse}</Text>
              <Text style={styles.fusszeileText}>
                {FIRMA.plz} {FIRMA.ort}
              </Text>
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
          <Text style={styles.seitenZahl}>
            Rechnung {rechnung.nummer} · Erstellt am {new Date().toLocaleDateString("de-DE")}
          </Text>
        </View>
      </Page>
    </Document>
  )

  // PDF als Buffer rendern
  const pdfBuffer = await renderToBuffer(dokument)

  // ── ZUGFeRD 2.3 / Factur-X XML einbetten ──────────────────────────
  let finalPdfBytes: Uint8Array = pdfBuffer

  try {
    // Rechnung in ZUGFeRD-Datenformat konvertieren
    const zugferdData = rechnungToZUGFeRDData(rechnung, {
      name: FIRMA.name,
      strasse: FIRMA.strasse,
      plz: FIRMA.plz,
      ort: FIRMA.ort,
      land: "DE",
      steuernummer: FIRMA.steuernummer,
      ustIdNr: FIRMA.ustIdNr,
      iban: FIRMA.iban,
      bic: FIRMA.bic,
      bank: FIRMA.bank,
    })

    // XML generieren
    const zugferdXml = generateZUGFeRDXml(zugferdData)

    // XML in PDF einbetten
    finalPdfBytes = await embedZUGFeRDXml(
      new Uint8Array(pdfBuffer),
      zugferdXml
    )

    console.log(`[ZUGFeRD] XML eingebettet für Rechnung ${rechnung.nummer}`)
  } catch (error) {
    console.error("[ZUGFeRD] Fehler beim Einbetten:", error)
    console.error("[ZUGFeRD] WARNUNG: PDF wurde OHNE ZUGFeRD XML ausgeliefert!")
    // Fallback: Original-PDF ohne ZUGFeRD zurückgeben
    finalPdfBytes = pdfBuffer
  }

  const zugferdEmbedded = finalPdfBytes !== pdfBuffer

  // Dateiname generieren (mit ZUGFeRD-Hinweis)
  const dateiname = `Rechnung_${rechnung.nummer.replace(/[^a-zA-Z0-9-]/g, "_")}_ZUGFeRD_${formatDatum(rechnung.rechnungsDatum).replace(/\./g, "-")}.pdf`

  return new NextResponse(finalPdfBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
      "Content-Length": finalPdfBytes.length.toString(),
      "X-ZUGFeRD-Status": zugferdEmbedded ? "embedded" : "error",
    },
  })
}
