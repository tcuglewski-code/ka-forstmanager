// Sprint AF: Lohnabrechnung PDF-Export
// Erstellt ein PDF-Dokument für eine Lohnabrechnung anhand der Lohnabrechnung-ID

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// PDF-Stile (DIN A4)
const styles = StyleSheet.create({
  seite: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  briefkopf: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2C3A1C",
    paddingBottom: 12,
  },
  firmaName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#2C3A1C",
  },
  firmaUntertitel: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  dokumentTitel: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  datumText: {
    fontSize: 9,
    color: "#666",
  },
  abschnittTitel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f4f4f4",
    padding: "6 8",
    marginBottom: 6,
    marginTop: 16,
  },
  rasterZeile: {
    flexDirection: "row",
    marginBottom: 4,
  },
  etikett: {
    width: "40%",
    color: "#666",
  },
  wert: {
    width: "60%",
    fontFamily: "Helvetica-Bold",
  },
  tabelle: {
    marginTop: 4,
  },
  tabelleKopf: {
    flexDirection: "row",
    backgroundColor: "#2C3A1C",
    color: "#fff",
    padding: "5 4",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tabelleZeile: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: "4 4",
    fontSize: 9,
  },
  tabelleZeileAlternativ: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: "4 4",
    fontSize: 9,
    backgroundColor: "#f9f9f9",
  },
  spalte1: { width: "15%" },
  spalte2: { width: "10%", textAlign: "right" },
  spalte3: { width: "15%" },
  spalte4: { width: "35%" },
  spalte5: { width: "15%", textAlign: "right" },
  spalte6: { width: "10%", textAlign: "right" },
  berechnungZeile: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  berechnungZeileRot: {
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  gesamtText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#2C3A1C",
  },
  unterschriftBereich: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 50,
  },
  unterschriftBlock: {
    width: "42%",
  },
  unterschriftLinie: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginTop: 40,
    marginBottom: 4,
  },
  unterschriftText: {
    fontSize: 8,
    color: "#666",
  },
  fusszeile: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 6,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
})

// Hilfsfunktion: Zahl als Euro-Betrag formatieren
function fmt(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

// Hilfsfunktion: Datum formatieren
function fmtDatum(d: Date | string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("de-DE")
}

// Hilfsfunktion: Stundentyp übersetzen
function typLabel(typ: string): string {
  const map: Record<string, string> = {
    arbeit: "Arbeit",
    maschine: "Maschine",
    urlaub: "Urlaub",
    krank: "Krank",
    sonstiges: "Sonstiges",
  }
  return map[typ] ?? typ
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Authentifizierung prüfen
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const { id } = await params

  // Lohnabrechnung laden
  const abrechnung = await prisma.lohnabrechnung.findUnique({
    where: { id },
    include: {
      mitarbeiter: true,
      saison: { select: { id: true, name: true, startDatum: true, endDatum: true } },
    },
  })

  if (!abrechnung) {
    return NextResponse.json({ error: "Lohnabrechnung nicht gefunden" }, { status: 404 })
  }

  // Stundeneinträge im Abrechnungszeitraum laden
  const stundeneintraege = await prisma.stundeneintrag.findMany({
    where: {
      mitarbeiterId: abrechnung.mitarbeiterId,
      datum: {
        gte: abrechnung.zeitraumVon,
        lte: abrechnung.zeitraumBis,
      },
    },
    include: {
      auftrag: { select: { nummer: true, titel: true } },
    },
    orderBy: { datum: "asc" },
  })

  // Vorschüsse im Abrechnungszeitraum laden
  const vorschuesse = await prisma.vorschuss.findMany({
    where: {
      mitarbeiterId: abrechnung.mitarbeiterId,
      datum: {
        gte: abrechnung.zeitraumVon,
        lte: abrechnung.zeitraumBis,
      },
    },
    orderBy: { datum: "asc" },
  })

  // Stunden-Berechnungen
  const regularStunden = stundeneintraege
    .filter((e) => e.typ !== "maschine")
    .reduce((s, e) => s + e.stunden, 0)

  const maschinenEintraege = stundeneintraege.filter(
    (e) => e.typ === "maschine" || (e.maschinenzuschlag != null && e.maschinenzuschlag > 0)
  )
  const maschinenStunden = maschinenEintraege.reduce((s, e) => s + e.stunden, 0)

  const stundenlohn =
    abrechnung.stunden > 0
      ? abrechnung.bruttoLohn / abrechnung.stunden
      : (abrechnung.mitarbeiter.stundenlohn ?? 0)

  const maschinenzuschlagSatz =
    maschinenEintraege.length > 0
      ? maschinenEintraege.reduce((s, e) => s + (e.maschinenzuschlag ?? 0), 0) /
        maschinenEintraege.length
      : 0

  // PDF-Dokument aufbauen
  const dokument = (
    <Document
      title={`Lohnabrechnung ${abrechnung.mitarbeiter.vorname} ${abrechnung.mitarbeiter.nachname}`}
      author="Koch Aufforstung GmbH"
    >
      <Page size="A4" style={styles.seite}>
        {/* ── Briefkopf ─────────────────────────────────────────── */}
        <View style={styles.briefkopf}>
          <View>
            <Text style={styles.firmaName}>Koch Aufforstung GmbH</Text>
            <Text style={styles.firmaUntertitel}>Professionelle Forstwirtschaft</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.dokumentTitel}>LOHNABRECHNUNG</Text>
            <Text style={styles.datumText}>
              Erstellt am: {new Date().toLocaleDateString("de-DE")}
            </Text>
          </View>
        </View>

        {/* ── Mitarbeiterdaten ───────────────────────────────────── */}
        <Text style={styles.abschnittTitel}>Mitarbeiterdaten</Text>
        <View style={{ paddingHorizontal: 8 }}>
          <View style={styles.rasterZeile}>
            <Text style={styles.etikett}>Name:</Text>
            <Text style={styles.wert}>
              {abrechnung.mitarbeiter.vorname} {abrechnung.mitarbeiter.nachname}
            </Text>
          </View>
          {abrechnung.mitarbeiter.adresse && (
            <View style={styles.rasterZeile}>
              <Text style={styles.etikett}>Adresse:</Text>
              <Text style={styles.wert}>
                {abrechnung.mitarbeiter.adresse}
                {abrechnung.mitarbeiter.plz ? `, ${abrechnung.mitarbeiter.plz}` : ""}
                {abrechnung.mitarbeiter.ort ? ` ${abrechnung.mitarbeiter.ort}` : ""}
              </Text>
            </View>
          )}
          {abrechnung.mitarbeiter.iban && (
            <View style={styles.rasterZeile}>
              <Text style={styles.etikett}>IBAN:</Text>
              <Text style={styles.wert}>{abrechnung.mitarbeiter.iban}</Text>
            </View>
          )}
          <View style={styles.rasterZeile}>
            <Text style={styles.etikett}>Saison:</Text>
            <Text style={styles.wert}>{abrechnung.saison?.name ?? "—"}</Text>
          </View>
          <View style={styles.rasterZeile}>
            <Text style={styles.etikett}>Abrechnungszeitraum:</Text>
            <Text style={styles.wert}>
              {fmtDatum(abrechnung.zeitraumVon)} – {fmtDatum(abrechnung.zeitraumBis)}
            </Text>
          </View>
          <View style={styles.rasterZeile}>
            <Text style={styles.etikett}>Status:</Text>
            <Text style={styles.wert}>{abrechnung.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Stundenübersicht ───────────────────────────────────── */}
        <Text style={styles.abschnittTitel}>Tätigkeiten & Stunden</Text>
        <View style={styles.tabelle}>
          <View style={styles.tabelleKopf}>
            <Text style={styles.spalte1}>Datum</Text>
            <Text style={styles.spalte2}>Std</Text>
            <Text style={styles.spalte3}>Typ</Text>
            <Text style={styles.spalte4}>Auftrag / Tätigkeit</Text>
            <Text style={styles.spalte5}>Zuschlag</Text>
            <Text style={styles.spalte6}>Notiz</Text>
          </View>
          {stundeneintraege.length === 0 ? (
            <View style={[styles.tabelleZeile, { justifyContent: "center" }]}>
              <Text style={{ color: "#999", fontStyle: "italic" }}>
                Keine Stundeneinträge im Abrechnungszeitraum
              </Text>
            </View>
          ) : (
            stundeneintraege.map((e, i) => (
              <View
                key={e.id}
                style={i % 2 === 0 ? styles.tabelleZeile : styles.tabelleZeileAlternativ}
              >
                <Text style={styles.spalte1}>{fmtDatum(e.datum)}</Text>
                <Text style={styles.spalte2}>{e.stunden.toFixed(1)}</Text>
                <Text style={styles.spalte3}>{typLabel(e.typ)}</Text>
                <Text style={styles.spalte4}>
                  {e.auftrag?.nummer ?? e.auftrag?.titel ?? "—"}
                </Text>
                <Text style={styles.spalte5}>
                  {e.maschinenzuschlag && e.maschinenzuschlag > 0
                    ? `${e.maschinenzuschlag.toFixed(2)} €/h`
                    : "—"}
                </Text>
                <Text style={styles.spalte6}>{e.notiz ? e.notiz.substring(0, 20) : "—"}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Stundenübersicht Zusammenfassung ──────────────────── */}
        <View style={{ paddingHorizontal: 8, marginTop: 8 }}>
          <View style={styles.rasterZeile}>
            <Text style={styles.etikett}>Reguläre Stunden:</Text>
            <Text style={styles.wert}>{regularStunden.toFixed(1)} Std</Text>
          </View>
          {maschinenStunden > 0 && (
            <View style={styles.rasterZeile}>
              <Text style={styles.etikett}>Maschinenstunden:</Text>
              <Text style={styles.wert}>{maschinenStunden.toFixed(1)} Std</Text>
            </View>
          )}
          <View style={styles.rasterZeile}>
            <Text style={styles.etikett}>Stundenlohn:</Text>
            <Text style={styles.wert}>{fmt(stundenlohn)}</Text>
          </View>
          {maschinenzuschlagSatz > 0 && (
            <View style={styles.rasterZeile}>
              <Text style={styles.etikett}>Ø Maschinenzuschlag:</Text>
              <Text style={styles.wert}>{fmt(maschinenzuschlagSatz)}/Std</Text>
            </View>
          )}
        </View>

        {/* ── Lohnberechnung ────────────────────────────────────── */}
        <Text style={styles.abschnittTitel}>Lohnberechnung</Text>
        <View style={{ paddingHorizontal: 0 }}>
          <View style={styles.berechnungZeile}>
            <Text>
              Grundlohn ({regularStunden.toFixed(1)} Std × {fmt(stundenlohn)}):
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{fmt(abrechnung.bruttoLohn)}</Text>
          </View>
          {abrechnung.maschinenBonus > 0 && (
            <View style={styles.berechnungZeile}>
              <Text>
                Maschinenzuschlag ({maschinenStunden.toFixed(1)} Std × {fmt(maschinenzuschlagSatz)}):
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>+ {fmt(abrechnung.maschinenBonus)}</Text>
            </View>
          )}
          {abrechnung.vorschuesse > 0 && (
            <View style={styles.berechnungZeileRot}>
              <Text>Vorschüsse:</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>− {fmt(abrechnung.vorschuesse)}</Text>
            </View>
          )}
          <View style={styles.gesamtZeile}>
            <Text style={styles.gesamtText}>GESAMTLOHN / AUSZAHLUNG:</Text>
            <Text style={styles.gesamtText}>{fmt(abrechnung.auszahlung)}</Text>
          </View>
        </View>

        {/* ── Vorschüsse Detail ──────────────────────────────────── */}
        {vorschuesse.length > 0 && (
          <>
            <Text style={styles.abschnittTitel}>Vorschüsse (Übersicht)</Text>
            <View style={styles.tabelle}>
              <View style={styles.tabelleKopf}>
                <Text style={{ width: "25%" }}>Datum</Text>
                <Text style={{ width: "25%", textAlign: "right" }}>Betrag</Text>
                <Text style={{ width: "50%" }}>Grund</Text>
              </View>
              {vorschuesse.map((v, i) => (
                <View
                  key={v.id}
                  style={i % 2 === 0 ? styles.tabelleZeile : styles.tabelleZeileAlternativ}
                >
                  <Text style={{ width: "25%", fontSize: 9 }}>{fmtDatum(v.datum)}</Text>
                  <Text style={{ width: "25%", textAlign: "right", fontSize: 9 }}>
                    {fmt(v.betrag)}
                  </Text>
                  <Text style={{ width: "50%", fontSize: 9 }}>{v.grund ?? "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Notizen ───────────────────────────────────────────── */}
        {abrechnung.notizen && (
          <>
            <Text style={styles.abschnittTitel}>Notizen</Text>
            <View style={{ paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 9, color: "#444" }}>{abrechnung.notizen}</Text>
            </View>
          </>
        )}

        {/* ── Unterschriften ────────────────────────────────────── */}
        <View style={styles.unterschriftBereich}>
          <View style={styles.unterschriftBlock}>
            <View style={styles.unterschriftLinie} />
            <Text style={styles.unterschriftText}>
              Unterschrift Arbeitgeber, Datum
            </Text>
            <Text style={[styles.unterschriftText, { marginTop: 2, fontFamily: "Helvetica-Bold" }]}>
              Koch Aufforstung GmbH
            </Text>
          </View>
          <View style={styles.unterschriftBlock}>
            <View style={styles.unterschriftLinie} />
            <Text style={styles.unterschriftText}>
              Unterschrift Arbeitnehmer, Datum
            </Text>
            <Text style={[styles.unterschriftText, { marginTop: 2, fontFamily: "Helvetica-Bold" }]}>
              {abrechnung.mitarbeiter.vorname} {abrechnung.mitarbeiter.nachname}
            </Text>
          </View>
        </View>

        {/* ── Fußzeile ──────────────────────────────────────────── */}
        <Text style={styles.fusszeile}>
          Koch Aufforstung GmbH · Lohnabrechnung ·{" "}
          {fmtDatum(abrechnung.zeitraumVon)} – {fmtDatum(abrechnung.zeitraumBis)} ·
          Erstellt am {new Date().toLocaleDateString("de-DE")}
        </Text>
      </Page>
    </Document>
  )

  // PDF als Buffer rendern
  const pdfBuffer = await renderToBuffer(dokument)

  // PDF-Dateiname
  const dateiname = `Lohnabrechnung_${abrechnung.mitarbeiter.nachname}_${abrechnung.mitarbeiter.vorname}_${new Date(abrechnung.zeitraumVon).toLocaleDateString("de-DE").replace(/\./g, "-")}.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  })
}
