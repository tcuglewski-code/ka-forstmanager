/**
 * DSGVO Art. 20 Datenexport für Mitarbeiter
 * GET /api/mitarbeiter/:id/export
 * Query: ?format=json (default) | ?format=csv
 * 
 * Exportiert alle personenbezogenen Daten eines Mitarbeiters
 * Nur für Admin/Verwaltung zugänglich
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/api-handler"


// Helper: Flatten object for CSV
function flattenForCSV(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key
    if (value === null || value === undefined) {
      result[newKey] = ""
    } else if (value instanceof Date) {
      result[newKey] = value.toISOString()
    } else if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenForCSV(value as Record<string, unknown>, newKey))
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value)
    } else {
      result[newKey] = String(value)
    }
  }
  return result
}

// Helper: Convert array of objects to CSV
function toCSV(data: Record<string, unknown>[], sectionName: string): string {
  if (data.length === 0) return `\n--- ${sectionName} ---\nKeine Daten\n`
  
  const flattened = data.map(d => flattenForCSV(d))
  const headers = [...new Set(flattened.flatMap(Object.keys))]
  
  const csvRows = [
    `\n--- ${sectionName} ---`,
    headers.join(";"),
    ...flattened.map(row => 
      headers.map(h => {
        const val = row[h] || ""
        // Escape semicolons and quotes
        if (val.includes(";") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(";")
    )
  ]
  
  return csvRows.join("\n")
}

export const GET = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  // Auth check
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Role check: nur Admin oder Verwaltung darf exportieren
  const userRole = (session.user as { role?: string })?.role
  if (!userRole || !["admin", "verwaltung"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden - Admin/Verwaltung required" }, { status: 403 })
  }

  const { id } = await params
  const format = req.nextUrl.searchParams.get("format") || "json"

  // Mitarbeiter mit allen Relationen laden
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id },
    include: {
      qualifikationenRel: {
        include: { qualifikation: true }
      },
      schulungen: {
        include: { schulung: true }
      },
      stundeneintraege: true,
      lohneintraege: true,
      vorschuesse: true,
      abwesenheiten: true,
      dokumente: {
        where: { deletedAt: null } // Nur aktive Dokumente
      },
      saisonAnmeldungen: {
        include: { saison: true }
      },
      gruppen: {
        include: { gruppe: true }
      },
    }
  })

  if (!mitarbeiter) {
    return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 })
  }

  // Export-Daten strukturieren
  const exportData = {
    exportInfo: {
      exportDatum: new Date().toISOString(),
      dsgvoArtikel: "Art. 20 DSGVO - Recht auf Datenübertragbarkeit",
      mitarbeiterId: id,
      formatVersion: "1.0"
    },
    stammdaten: {
      id: mitarbeiter.id,
      vorname: mitarbeiter.vorname,
      nachname: mitarbeiter.nachname,
      email: mitarbeiter.email,
      telefon: mitarbeiter.telefon,
      mobil: mitarbeiter.mobil,
      adresse: mitarbeiter.adresse,
      plz: mitarbeiter.plz,
      ort: mitarbeiter.ort,
      geburtsdatum: mitarbeiter.geburtsdatum,
      eintrittsdatum: mitarbeiter.eintrittsdatum,
      austrittsdatum: mitarbeiter.austrittsdatum,
      rolle: mitarbeiter.rolle,
      status: mitarbeiter.status,
      createdAt: mitarbeiter.createdAt,
    },
    qualifikationen: mitarbeiter.qualifikationenRel.map(q => ({
      qualifikation: q.qualifikation.name,
      erworbenAm: q.erworbenAm,
      ablaufDatum: q.ablaufDatum,
      notiz: q.notiz
    })),
    schulungen: mitarbeiter.schulungen.map(s => ({
      schulung: s.schulung.titel,
      typ: s.schulung.typ,
      datum: s.schulung.datum,
      status: s.status,
      abgeschlossenAm: s.abgeschlossenAm
    })),
    stunden: mitarbeiter.stundeneintraege.map(s => ({
      datum: s.datum,
      stunden: s.stunden,
      notiz: s.notiz,
      typ: s.typ,
      auftragId: s.auftragId,
      genehmigt: s.genehmigt
    })),
    lohneintraege: mitarbeiter.lohneintraege.map(l => ({
      monat: l.monat,
      jahr: l.jahr,
      stunden: l.stunden,
      stundenlohn: l.stundenlohn,
      brutto: l.brutto,
      netto: l.netto,
      ausgezahlt: l.ausgezahlt,
      ausgezahltAm: l.ausgezahltAm
    })),
    vorschuesse: mitarbeiter.vorschuesse.map(v => ({
      betrag: v.betrag,
      datum: v.datum,
      grund: v.grund,
      genehmigt: v.genehmigt,
      zurueckgezahlt: v.zurueckgezahlt
    })),
    abwesenheiten: mitarbeiter.abwesenheiten.map(a => ({
      von: a.von,
      bis: a.bis,
      typ: a.typ,
      notiz: a.notiz,
      genehmigt: a.genehmigt
    })),
    dokumente: mitarbeiter.dokumente.map(d => ({
      name: d.name,
      typ: d.typ,
      kategorie: d.kategorie,
      jahr: d.jahr,
      ablaufDatum: d.ablaufDatum,
      createdAt: d.createdAt
      // URL/Pfad bewusst nicht exportiert (Sicherheit)
    })),
    saisonAnmeldungen: mitarbeiter.saisonAnmeldungen.map(sa => ({
      saison: sa.saison.name,
      saisonTyp: sa.saison.typ,
      status: sa.status,
      anmeldeDatum: sa.createdAt
    })),
    gruppenMitgliedschaften: mitarbeiter.gruppen.map(g => ({
      gruppe: g.gruppe.name,
      rolle: g.rolle
    })),
    notfallkontakt: {
      name: mitarbeiter.notfallName || mitarbeiter.notfallkontakt,
      telefon: mitarbeiter.notfallTelefon || mitarbeiter.notfalltelefon,
      beziehung: mitarbeiter.notfallBeziehung
    },
    bankdaten: {
      bankname: mitarbeiter.bankname,
      iban: mitarbeiter.iban
    },
    verguetung: {
      stundenlohn: mitarbeiter.stundenlohn,
      vollkostenSatz: mitarbeiter.vollkostenSatz,
      maschinenbonusIndividuell: mitarbeiter.maschinenbonusIndividuell
    }
  }

  // CSV Format
  if (format === "csv") {
    const csvParts = [
      `DSGVO Datenexport - Art. 20 Datenübertragbarkeit`,
      `Export-Datum: ${exportData.exportInfo.exportDatum}`,
      `Mitarbeiter-ID: ${id}`,
      `Format-Version: 1.0`,
      "",
      toCSV([exportData.stammdaten], "STAMMDATEN"),
      toCSV(exportData.qualifikationen, "QUALIFIKATIONEN"),
      toCSV(exportData.schulungen, "SCHULUNGEN"),
      toCSV(exportData.stunden, "STUNDEN"),
      toCSV(exportData.lohneintraege, "LOHNEINTRÄGE"),
      toCSV(exportData.vorschuesse, "VORSCHÜSSE"),
      toCSV(exportData.abwesenheiten, "ABWESENHEITEN"),
      toCSV(exportData.dokumente, "DOKUMENTE"),
      toCSV(exportData.saisonAnmeldungen, "SAISONANMELDUNGEN"),
      toCSV(exportData.gruppenMitgliedschaften, "GRUPPENMITGLIEDSCHAFTEN"),
      toCSV([exportData.notfallkontakt], "NOTFALLKONTAKT"),
      toCSV([exportData.bankdaten], "BANKDATEN"),
      toCSV([exportData.verguetung], "VERGÜTUNG"),
    ]

    const filename = `mitarbeiter-export-${mitarbeiter.vorname}-${mitarbeiter.nachname}-${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csvParts.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  // JSON Format (default)
  const filename = `mitarbeiter-export-${mitarbeiter.vorname}-${mitarbeiter.nachname}-${new Date().toISOString().split("T")[0]}.json`
  
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
})
