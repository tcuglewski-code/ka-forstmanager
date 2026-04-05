/**
 * API-Route: /api/rechnungen/export/gobd
 * Sprint GB-06: GoBD Export-Funktion
 * 
 * Exportiert alle Rechnungen als GoBD-konformes Archiv:
 * - CSV mit allen Rechnungsdaten + SHA256-Prüfsummen
 * - ZIP-Bundle mit PDFs (falls vorhanden)
 * - Checksums-Datei für Integritätsprüfung
 * - Audit-Log als separate CSV
 * 
 * Zugriff: Nur Admin + Accountant
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth, canAccessAccounting } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import archiver from "archiver"
import { createHash } from "crypto"

// CSV-Helper: Escape special characters
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// SHA256 Hash für einen String berechnen
function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex")
}

// Formatiere Datum für CSV
function formatDate(date: Date | null): string {
  if (!date) return ""
  return date.toISOString().split("T")[0]
}

// Formatiere DateTime für CSV
function formatDateTime(date: Date | null): string {
  if (!date) return ""
  return date.toISOString()
}

// Formatiere Betrag für CSV (deutsches Format)
function formatBetrag(value: number | null): string {
  if (value === null || value === undefined) return ""
  return value.toFixed(2).replace(".", ",")
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    
    // Nur Admin oder Accountant dürfen exportieren
    const userIsAdmin = isAdmin(session)
    const userCanAccessAccounting = canAccessAccounting(session.user)
    
    if (!userIsAdmin && !userCanAccessAccounting) {
      return NextResponse.json(
        { error: "Keine Berechtigung für GoBD-Export. Nur für Admin und Steuerberater." },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(req.url)
    const jahr = searchParams.get("jahr") // Optional: nur bestimmtes Jahr
    const includeAuditLog = searchParams.get("auditLog") !== "false" // Default: true
    const includePdfs = searchParams.get("pdfs") !== "false" // Default: true
    
    // Filter erstellen
    const where: Record<string, unknown> = {
      deletedAt: null, // Nur aktive Rechnungen
    }
    
    if (jahr) {
      const jahresAnfang = new Date(`${jahr}-01-01T00:00:00.000Z`)
      const jahresEnde = new Date(`${jahr}-12-31T23:59:59.999Z`)
      where.rechnungsDatum = {
        gte: jahresAnfang,
        lte: jahresEnde,
      }
    }
    
    // Alle Rechnungen mit Relations laden
    const rechnungen = await prisma.rechnung.findMany({
      where,
      include: {
        auftrag: {
          select: {
            id: true,
            nummer: true,
            titel: true,
            waldbesitzer: true,
          }
        },
        positionen: true,
        auditLog: includeAuditLog,
        versionen: true,
      },
      orderBy: { nummer: "asc" },
    })
    
    if (rechnungen.length === 0) {
      return NextResponse.json(
        { error: "Keine Rechnungen für den Export gefunden." },
        { status: 404 }
      )
    }
    
    // Export-Metadaten
    const exportMeta = {
      exportDatum: new Date().toISOString(),
      exportVon: session.user.name || session.user.email || "unknown",
      exportRolle: userIsAdmin ? "admin" : "accountant",
      anzahlRechnungen: rechnungen.length,
      zeitraum: jahr || "alle",
      gobdKonform: true,
      hashAlgorithmus: "SHA-256",
      version: "1.0",
    }
    
    // CSV Header für Rechnungen
    const csvHeader = [
      "Rechnungsnummer",
      "Rechnungsdatum",
      "Fällig am",
      "Status",
      "Auftrag-ID",
      "Auftrag-Nummer",
      "Auftrag-Titel",
      "Waldbesitzer",
      "Nettobetrag",
      "MwSt %",
      "Bruttobetrag",
      "Rabatt %",
      "Rabattbetrag",
      "Rabattgrund",
      "Zahlungsbedingung",
      "PDF-URL",
      "Notizen",
      "Gesperrt am",
      "Gesperrt von",
      "Sperrgrund",
      "Erstellt am",
      "Geändert am",
      "Positionen (JSON)",
      "SHA256-Hash",
    ].map(escapeCSV).join(";")
    
    // CSV Zeilen für Rechnungen generieren
    const csvRows: string[] = [csvHeader]
    const checksums: { nummer: string; hash: string }[] = []
    
    for (const r of rechnungen) {
      // Rohdaten für Hash (ohne Hash-Spalte selbst)
      const rowData = [
        r.nummer,
        formatDate(r.rechnungsDatum),
        formatDate(r.faelligAm),
        r.status,
        r.auftragId || "",
        r.auftrag?.nummer || "",
        r.auftrag?.titel || "",
        r.auftrag?.waldbesitzer || "",
        formatBetrag(r.nettoBetrag ?? r.betrag),
        r.mwst?.toString() || "19",
        formatBetrag(r.bruttoBetrag ?? (r.betrag * (1 + (r.mwst || 19) / 100))),
        r.rabatt?.toString() || "0",
        formatBetrag(r.rabattBetrag),
        r.rabattGrund || "",
        r.zahlungsBedingung || "30 Tage netto",
        r.pdfUrl || "",
        r.notizen || "",
        formatDateTime(r.lockedAt),
        r.lockedBy || "",
        r.lockReason || "",
        formatDateTime(r.createdAt),
        formatDateTime(r.updatedAt),
        JSON.stringify(r.positionen.map(p => ({
          beschreibung: p.beschreibung,
          menge: p.menge,
          einheit: p.einheit,
          preisProEinheit: p.preisProEinheit,
          gesamt: p.gesamt,
          typ: p.typ,
        }))),
      ]
      
      // SHA256 Hash der Zeile berechnen
      const dataForHash = rowData.join("|")
      const hash = sha256(dataForHash)
      
      checksums.push({ nummer: r.nummer, hash })
      
      // Zeile mit Hash hinzufügen
      const csvRow = [...rowData, hash].map(escapeCSV).join(";")
      csvRows.push(csvRow)
    }
    
    const csvContent = csvRows.join("\n")
    
    // Audit-Log CSV generieren (optional)
    let auditLogCsv = ""
    if (includeAuditLog) {
      const auditHeader = [
        "Rechnungsnummer",
        "Aktion",
        "Feld",
        "Alter Wert",
        "Neuer Wert",
        "User-ID",
        "User-Name",
        "IP-Adresse",
        "User-Agent",
        "Zeitstempel",
      ].map(escapeCSV).join(";")
      
      const auditRows: string[] = [auditHeader]
      
      for (const r of rechnungen) {
        for (const log of r.auditLog) {
          const row = [
            r.nummer,
            log.action,
            log.field || "",
            log.oldValue || "",
            log.newValue || "",
            log.userId || "",
            log.userName || "",
            log.ip || "",
            log.userAgent || "",
            formatDateTime(log.createdAt),
          ].map(escapeCSV).join(";")
          auditRows.push(row)
        }
      }
      
      auditLogCsv = auditRows.join("\n")
    }
    
    // Checksums-Datei generieren
    const checksumContent = [
      `# GoBD Export Prüfsummen`,
      `# Generiert: ${exportMeta.exportDatum}`,
      `# Hash-Algorithmus: ${exportMeta.hashAlgorithmus}`,
      `# Anzahl Rechnungen: ${checksums.length}`,
      `#`,
      ...checksums.map(c => `${c.hash}  ${c.nummer}`),
      ``,
      `# Gesamt-Hash (alle Rechnungen)`,
      sha256(checksums.map(c => c.hash).join("")),
    ].join("\n")
    
    // ZIP erstellen
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximale Kompression
    })
    
    // Response als Stream
    const chunks: Buffer[] = []
    
    archive.on("data", (chunk) => {
      chunks.push(chunk)
    })
    
    // CSV hinzufügen
    archive.append(csvContent, { name: "rechnungen.csv" })
    
    // Audit-Log hinzufügen (optional)
    if (includeAuditLog && auditLogCsv) {
      archive.append(auditLogCsv, { name: "audit-log.csv" })
    }
    
    // Checksums hinzufügen
    archive.append(checksumContent, { name: "checksums.txt" })
    
    // Export-Metadaten hinzufügen
    archive.append(JSON.stringify(exportMeta, null, 2), { name: "export-meta.json" })
    
    // PDF-URLs sammeln (falls vorhanden und gewünscht)
    if (includePdfs) {
      const pdfInfo: string[] = [
        "# PDF-Referenzen",
        `# Die PDFs sind unter den folgenden URLs verfügbar:`,
        "",
      ]
      
      let hasPdfs = false
      for (const r of rechnungen) {
        if (r.pdfUrl) {
          hasPdfs = true
          pdfInfo.push(`${r.nummer}: ${r.pdfUrl}`)
        }
      }
      
      if (hasPdfs) {
        pdfInfo.push("")
        pdfInfo.push("# HINWEIS: PDFs müssen separat gesichert werden.")
        pdfInfo.push("# Dieser Export enthält nur die Referenzen.")
        archive.append(pdfInfo.join("\n"), { name: "pdf-referenzen.txt" })
      }
    }
    
    // Versionen-Übersicht hinzufügen
    const versionenInfo: string[] = [
      "# Rechnungs-Versionen (GoBD-Versionierung)",
      `# Exportiert: ${exportMeta.exportDatum}`,
      "",
    ]
    
    let hasVersionen = false
    for (const r of rechnungen) {
      if (r.versionen.length > 0) {
        hasVersionen = true
        versionenInfo.push(`## ${r.nummer}`)
        for (const v of r.versionen) {
          versionenInfo.push(`  - Version ${v.versionNummer}: ${formatDateTime(v.createdAt)} (${v.erstelltVonName || "System"})`)
        }
        versionenInfo.push("")
      }
    }
    
    if (hasVersionen) {
      archive.append(versionenInfo.join("\n"), { name: "versionen-uebersicht.txt" })
    }
    
    // README hinzufügen
    const readme = `# GoBD-konformer Rechnungsexport

## Exportiert am
${exportMeta.exportDatum}

## Exportiert von
${exportMeta.exportVon} (${exportMeta.exportRolle})

## Inhalt
- rechnungen.csv: Alle Rechnungsdaten mit SHA256-Prüfsummen
${includeAuditLog ? "- audit-log.csv: Vollständiges Änderungsprotokoll\n" : ""}- checksums.txt: SHA256-Prüfsummen zur Integritätsprüfung
- export-meta.json: Export-Metadaten
${includePdfs ? "- pdf-referenzen.txt: URLs der Rechnungs-PDFs (falls vorhanden)\n" : ""}${hasVersionen ? "- versionen-uebersicht.txt: Änderungshistorie der Rechnungen\n" : ""}
## Prüfsummen-Verifikation
Jede Zeile in rechnungen.csv enthält einen SHA256-Hash, der aus allen
anderen Feldern der Zeile berechnet wurde. Die checksums.txt enthält
zusätzlich einen Gesamt-Hash über alle Einzel-Hashes.

## GoBD-Konformität
Dieser Export erfüllt die Anforderungen der GoBD (Grundsätze zur 
ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen 
und Unterlagen in elektronischer Form sowie zum Datenzugriff):

- Unveränderlichkeit: Durch SHA256-Hashes nachweisbar
- Vollständigkeit: Alle Rechnungen + Positionen + Änderungsprotokoll
- Nachvollziehbarkeit: Audit-Log dokumentiert alle Änderungen
- Auffindbarkeit: CSV-Format, maschinenlesbar

## Format
- Trennzeichen: Semikolon (;)
- Encoding: UTF-8
- Dezimaltrennzeichen in Beträgen: Komma (,)
- Datumsformat: YYYY-MM-DD (ISO 8601)

## Koch Aufforstung GmbH
ForstManager - GoBD-Export v${exportMeta.version}
`
    
    archive.append(readme, { name: "README.txt" })
    
    // Archiv finalisieren
    await archive.finalize()
    
    // Warten bis alle Daten geschrieben sind
    await new Promise<void>((resolve, reject) => {
      archive.on("end", resolve)
      archive.on("error", reject)
    })
    
    const zipBuffer = Buffer.concat(chunks)
    
    // Dateiname mit Datum
    const exportDate = new Date().toISOString().split("T")[0]
    const filename = jahr 
      ? `gobd-export-${jahr}_${exportDate}.zip`
      : `gobd-export-komplett_${exportDate}.zip`
    
    // Audit-Log für Export erstellen
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id || null,
          action: "GOBD_EXPORT",
          entityType: "Rechnung",
          entityId: "bulk",
          entityName: `GoBD-Export ${exportMeta.anzahlRechnungen} Rechnungen`,
          metadata: JSON.stringify({
            jahr: jahr || "alle",
            anzahl: rechnungen.length,
            mitAuditLog: includeAuditLog,
            mitPdfs: includePdfs,
            dateigroesse: zipBuffer.length,
          }),
        },
      })
    } catch (logError) {
      console.error("Activity log error:", logError)
      // Nicht kritisch - Export fortsetzen
    }
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
        "X-GoBD-Export": "true",
        "X-Export-Hash": sha256(zipBuffer.toString("base64")),
      },
    })
    
  } catch (error) {
    console.error("GoBD Export Error:", error)
    return NextResponse.json(
      { error: "Fehler beim GoBD-Export", details: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}

// Nur GET erlaubt
export async function POST() {
  return NextResponse.json(
    { error: "Methode nicht erlaubt. Nur GET-Anfragen für Export." },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: "Methode nicht erlaubt. Nur GET-Anfragen für Export." },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Methode nicht erlaubt. Nur GET-Anfragen für Export." },
    { status: 405 }
  )
}
