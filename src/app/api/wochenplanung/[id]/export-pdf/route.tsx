// Sprint AO: Wochenplan PDF-Export (DIN A4 Querformat)

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// Dienstleistungstyp-Labels
const DIENSTLEISTUNG_LABELS: Record<string, string> = {
  pflanzung: "🌱 Pflanzung",
  flaechenvorbereitung: "🔧 Flächenvorbereitung",
  kulturpflege: "✂️ Kulturpflege",
  kulturschutz: "🛡️ Kulturschutz",
  saatguternte: "🌾 Saatguternte",
  sonstiges: "📋 Sonstiges",
}

// Dienstleistungstyp-Farben (Hintergrund)
const DIENSTLEISTUNG_FARBEN: Record<string, string> = {
  pflanzung: "#1a4a1a",
  flaechenvorbereitung: "#3a2a0a",
  kulturpflege: "#1a2a4a",
  kulturschutz: "#2a1a4a",
  saatguternte: "#4a3a0a",
  sonstiges: "#2a2a2a",
}

// PDF-Stile (A4 Querformat)
const styles = StyleSheet.create({
  seite: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#2C3A1C",
  },
  firmaName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#2C3A1C",
  },
  planTitel: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  planUntertitel: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  tabelle: {
    width: "100%",
  },
  tabelleKopf: {
    flexDirection: "row",
    backgroundColor: "#2C3A1C",
    color: "#fff",
    padding: "6 6",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  zeile: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    minHeight: 28,
  },
  zeileAlternativ: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f8f9f8",
    minHeight: 28,
  },
  zelle: {
    padding: "5 6",
    fontSize: 8,
  },
  zelleKopf: {
    padding: "5 6",
    fontSize: 8,
    color: "#fff",
    fontFamily: "Helvetica-Bold",
  },
  // Spaltenbreiten (Querformat A4 = ~297mm - 48mm Rand = ~249mm)
  col_nr: { width: "4%" },
  col_typ: { width: "14%" },
  col_datum: { width: "10%" },
  col_flaeche: { width: "14%" },
  col_details: { width: "28%" },
  col_gps: { width: "15%" },
  col_status: { width: "8%" },
  col_notizen: { width: "17%" },

  typBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
  },
  statusBadge: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
  },
  legende: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
  },
  legendeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendeBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  fusszeile: {
    position: "absolute",
    bottom: 12,
    left: 24,
    right: 24,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 4,
    fontSize: 7,
    color: "#999",
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

function fmtDatum(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
}

function statusFarbe(status: string): string {
  const map: Record<string, string> = {
    geplant: "#4a90e2",
    in_arbeit: "#f5a623",
    abgeschlossen: "#7ed321",
  }
  return map[status] ?? "#999"
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    geplant: "Geplant",
    in_arbeit: "Aktiv",
    abgeschlossen: "Fertig",
  }
  return map[status] ?? status
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params

  const wochenplan = await prisma.wochenplan.findUnique({
    where: { id },
    include: {
      gruppe: { select: { name: true } },
      positionen: {
        orderBy: [{ datum: "asc" }, { dienstleistungstyp: "asc" }],
      },
    },
  })

  if (!wochenplan) {
    return NextResponse.json({ error: "Wochenplan nicht gefunden" }, { status: 404 })
  }

  // PDF aufbauen (DIN A4 Querformat)
  const dokument = (
    <Document
      title={`Wochenplan KW ${wochenplan.kalenderwoche}/${wochenplan.jahr}`}
      author="Koch Aufforstung GmbH"
    >
      <Page size="A4" orientation="landscape" style={styles.seite}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.firmaName}>🌲 Koch Aufforstung GmbH</Text>
            <Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
              Professionelle Forstwirtschaft
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.planTitel}>
              WOCHENPLAN KW {wochenplan.kalenderwoche}/{wochenplan.jahr}
            </Text>
            <Text style={styles.planUntertitel}>
              {wochenplan.gruppe?.name ? `Gruppe: ${wochenplan.gruppe.name}` : "Alle Gruppen"}{" "}
              · Status: {wochenplan.status.toUpperCase()}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: "#666" }}>
              Erstellt: {new Date().toLocaleDateString("de-DE")}
            </Text>
            <Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
              Positionen: {wochenplan.positionen.length}
            </Text>
          </View>
        </View>

        {/* Tabelle */}
        <View style={styles.tabelle}>
          {/* Tabellen-Kopf */}
          <View style={styles.tabelleKopf}>
            <Text style={[styles.zelleKopf, styles.col_nr]}>#</Text>
            <Text style={[styles.zelleKopf, styles.col_typ]}>Dienstleistung</Text>
            <Text style={[styles.zelleKopf, styles.col_datum]}>Datum</Text>
            <Text style={[styles.zelleKopf, styles.col_flaeche]}>Fläche</Text>
            <Text style={[styles.zelleKopf, styles.col_details]}>Details</Text>
            <Text style={[styles.zelleKopf, styles.col_gps]}>GPS / Treffpunkt</Text>
            <Text style={[styles.zelleKopf, styles.col_status]}>Status</Text>
            <Text style={[styles.zelleKopf, styles.col_notizen]}>Notizen</Text>
          </View>

          {/* Tabellenzeilen */}
          {wochenplan.positionen.length === 0 ? (
            <View style={[styles.zeile, { justifyContent: "center", padding: 10 }]}>
              <Text style={{ color: "#999", fontSize: 9 }}>Keine Positionen im Wochenplan</Text>
            </View>
          ) : (
            wochenplan.positionen.map((pos, i) => {
              const typ = pos.dienstleistungstyp
              const farbe = DIENSTLEISTUNG_FARBEN[typ] ?? "#2a2a2a"
              const istAlternativ = i % 2 !== 0

              // Detail-Text je nach Typ zusammenbauen
              let detailText = ""
              if (typ === "pflanzung") {
                const teile = []
                if (pos.baumart) teile.push(`Baumart: ${pos.baumart}`)
                if (pos.stueckzahl) teile.push(`Stück: ${pos.stueckzahl.toLocaleString("de-DE")}`)
                detailText = teile.join(" · ")
              } else if (typ === "saatguternte") {
                const teile = []
                if (pos.baumart) teile.push(`Art: ${pos.baumart}`)
                if (pos.herkunftscode) teile.push(`HKG: ${pos.herkunftscode}`)
                if (pos.zielkg) teile.push(`Ziel: ${pos.zielkg} kg`)
                if (pos.gesammelteKg) teile.push(`Gest.: ${pos.gesammelteKg} kg`)
                detailText = teile.join(" · ")
              }

              return (
                <View key={pos.id} style={istAlternativ ? styles.zeileAlternativ : styles.zeile}>
                  <Text style={[styles.zelle, styles.col_nr, { color: "#999" }]}>{i + 1}</Text>
                  <View style={[styles.col_typ, { padding: "4 4" }]}>
                    <View style={[styles.typBadge, { backgroundColor: farbe }]}>
                      <Text style={{ color: "#fff", fontSize: 7 }}>
                        {DIENSTLEISTUNG_LABELS[typ] ?? typ}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.zelle, styles.col_datum]}>
                    {fmtDatum(pos.datum)}
                  </Text>
                  <Text style={[styles.zelle, styles.col_flaeche]}>
                    {pos.flaeche ?? "—"}
                  </Text>
                  <Text style={[styles.zelle, styles.col_details, { fontSize: 7.5 }]}>
                    {detailText || "—"}
                  </Text>
                  <Text style={[styles.zelle, styles.col_gps, { fontSize: 7 }]}>
                    {[pos.treffpunkt, pos.gpsPosition].filter(Boolean).join("\n") || "—"}
                  </Text>
                  <View style={[styles.col_status, { padding: "4 4" }]}>
                    <View style={[styles.statusBadge, { backgroundColor: statusFarbe(pos.status) }]}>
                      <Text style={{ color: "#fff", fontSize: 6.5 }}>
                        {statusLabel(pos.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.zelle, styles.col_notizen, { fontSize: 7 }]}>
                    {pos.notizen ?? "—"}
                  </Text>
                </View>
              )
            })
          )}
        </View>

        {/* Legende */}
        <View style={styles.legende}>
          <Text style={{ fontSize: 7.5, color: "#666", fontFamily: "Helvetica-Bold" }}>Legende: </Text>
          {Object.entries(DIENSTLEISTUNG_LABELS).map(([key, label]) => (
            <View key={key} style={styles.legendeItem}>
              <View style={[styles.legendeBox, { backgroundColor: DIENSTLEISTUNG_FARBEN[key] }]} />
              <Text style={{ fontSize: 7, color: "#555" }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Notizen */}
        {wochenplan.notizen && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#444" }}>
              Notizen:
            </Text>
            <Text style={{ fontSize: 7.5, color: "#666", marginTop: 2 }}>
              {wochenplan.notizen}
            </Text>
          </View>
        )}

        {/* Fußzeile */}
        <View style={styles.fusszeile}>
          <Text>Koch Aufforstung GmbH · Wochenplan KW {wochenplan.kalenderwoche}/{wochenplan.jahr}</Text>
          <Text>
            {wochenplan.gruppe?.name ? `Gruppe: ${wochenplan.gruppe.name} · ` : ""}
            Erstellt: {new Date().toLocaleDateString("de-DE")}
          </Text>
        </View>
      </Page>
    </Document>
  )

  const pdfBuffer = await renderToBuffer(dokument)

  const dateiname = `Wochenplan_KW${wochenplan.kalenderwoche}_${wochenplan.jahr}${wochenplan.gruppe?.name ? `_${wochenplan.gruppe.name.replace(/\s+/g, "_")}` : ""}.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  })
}
