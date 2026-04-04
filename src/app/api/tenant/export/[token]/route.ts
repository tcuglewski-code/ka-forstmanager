/**
 * API: /api/tenant/export/[token]
 * Sprint OE: IMPL-CHURN-05 - Tenant Datenexport Download
 * 
 * GET: ZIP-Datei herunterladen (regeneriert on-demand)
 * 
 * Token ist 7 Tage gültig, danach 404
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import archiver from "archiver";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// Tenant-ID aus Config
const TENANT_ID = process.env.TENANT_ID || "koch-aufforstung";

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;

    // Export-Request finden
    const exportRequest = await prisma.exportRequest.findUnique({
      where: { token },
    });

    if (!exportRequest) {
      return NextResponse.json({ error: "Export nicht gefunden" }, { status: 404 });
    }

    // Prüfe ob abgelaufen
    if (new Date() > exportRequest.expiresAt) {
      await prisma.exportRequest.update({
        where: { id: exportRequest.id },
        data: { status: "expired" },
      });
      return NextResponse.json({ error: "Download-Link abgelaufen" }, { status: 410 });
    }

    // Prüfe Status
    if (exportRequest.status === "pending" || exportRequest.status === "processing") {
      return NextResponse.json({
        error: "Export noch nicht fertig",
        status: exportRequest.status,
        message: "Bitte warten Sie bis der Export abgeschlossen ist.",
      }, { status: 202 });
    }

    if (exportRequest.status === "failed") {
      return NextResponse.json({
        error: "Export fehlgeschlagen",
        message: exportRequest.errorMessage,
      }, { status: 500 });
    }

    if (exportRequest.status !== "completed") {
      return NextResponse.json({ error: "Ungültiger Export-Status" }, { status: 400 });
    }

    // ZIP regenerieren (on-demand für Speichereffizienz)
    const zipBuffer = await generateZipBuffer();

    // Download als erfolgt markieren
    await prisma.exportRequest.update({
      where: { id: exportRequest.id },
      data: { downloadedAt: new Date() },
    });

    // ZIP als Download zurückgeben
    const filename = `tenant-export-${TENANT_ID}-${new Date().toISOString().split("T")[0]}.zip`;
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error("Export-Download Fehler:", error);
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });
  }
}

// Helper: ZIP on-demand generieren
async function generateZipBuffer(): Promise<Buffer> {
  // Daten sammeln
  const [
    auftraege,
    protokolle,
    rechnungen,
    mitarbeiter,
    gruppen,
    zeiterfassung,
    abwesenheiten,
    dokumente,
    fahrzeuge,
    geraete,
    kontakte,
    angebote,
    lager,
  ] = await Promise.all([
    prisma.auftrag.findMany({ where: { deletedAt: null } }),
    prisma.tagesprotokoll.findMany({ where: { deletedAt: null } }),
    prisma.rechnung.findMany({ where: { deletedAt: null } }),
    prisma.mitarbeiter.findMany({ where: { deletedAt: null } }),
    prisma.gruppe.findMany({}),
    prisma.stundeneintrag.findMany({}),
    prisma.abwesenheit.findMany({}),
    prisma.dokument.findMany({ where: { deletedAt: null } }),
    prisma.fahrzeug.findMany({}),
    prisma.geraet.findMany({}),
    prisma.kontakt.findMany({}),
    prisma.angebot.findMany({}),
    prisma.lagerArtikel.findMany({}),
  ]);

  const recordCounts = {
    auftraege: auftraege.length,
    protokolle: protokolle.length,
    rechnungen: rechnungen.length,
    mitarbeiter: mitarbeiter.length,
    gruppen: gruppen.length,
    zeiterfassung: zeiterfassung.length,
    abwesenheiten: abwesenheiten.length,
    dokumente: dokumente.length,
    fahrzeuge: fahrzeuge.length,
    geraete: geraete.length,
    kontakte: kontakte.length,
    angebote: angebote.length,
    lager: lager.length,
  };

  // ZIP erstellen
  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  
  archive.on("data", (chunk) => chunks.push(chunk));

  // Manifest
  archive.append(
    JSON.stringify({
      exportedAt: new Date().toISOString(),
      tenant: TENANT_ID,
      recordCounts,
      version: "1.0",
      format: "JSON + CSV",
    }, null, 2),
    { name: "manifest.json" }
  );

  // JSON-Dateien
  archive.append(JSON.stringify(auftraege, null, 2), { name: "data/auftraege.json" });
  archive.append(JSON.stringify(protokolle, null, 2), { name: "data/tagesprotokolle.json" });
  archive.append(JSON.stringify(rechnungen, null, 2), { name: "data/rechnungen.json" });
  archive.append(JSON.stringify(mitarbeiter, null, 2), { name: "data/mitarbeiter.json" });
  archive.append(JSON.stringify(gruppen, null, 2), { name: "data/gruppen.json" });
  archive.append(JSON.stringify(zeiterfassung, null, 2), { name: "data/zeiterfassung.json" });
  archive.append(JSON.stringify(abwesenheiten, null, 2), { name: "data/abwesenheiten.json" });
  archive.append(JSON.stringify(dokumente, null, 2), { name: "data/dokumente.json" });
  archive.append(JSON.stringify(fahrzeuge, null, 2), { name: "data/fahrzeuge.json" });
  archive.append(JSON.stringify(geraete, null, 2), { name: "data/geraete.json" });
  archive.append(JSON.stringify(kontakte, null, 2), { name: "data/kontakte.json" });
  archive.append(JSON.stringify(angebote, null, 2), { name: "data/angebote.json" });
  archive.append(JSON.stringify(lager, null, 2), { name: "data/lager.json" });

  // CSV-Dateien
  archive.append(convertToCSV(auftraege), { name: "csv/auftraege.csv" });
  archive.append(convertToCSV(mitarbeiter), { name: "csv/mitarbeiter.csv" });
  archive.append(convertToCSV(rechnungen), { name: "csv/rechnungen.csv" });
  archive.append(convertToCSV(protokolle), { name: "csv/tagesprotokolle.csv" });
  archive.append(convertToCSV(kontakte), { name: "csv/kontakte.csv" });

  // README
  archive.append(
    `# Tenant-Datenexport

Exportiert am: ${new Date().toISOString()}
Tenant: ${TENANT_ID}

## Inhalt

- /data/ - Alle Daten als JSON (vollständig)
- /csv/ - Wichtigste Tabellen als CSV (für Excel/Sheets)
- manifest.json - Export-Metadaten

## Datentypen

${Object.entries(recordCounts).map(([k, v]) => `- ${k}: ${v} Einträge`).join("\n")}

## Format

JSON-Dateien enthalten alle Felder. 
CSV-Dateien sind für einfache Weiterverarbeitung.

## Aufbewahrung

Dieser Export-Link ist 7 Tage gültig.
Bitte sichern Sie die Daten lokal.

---
Generiert von ForstManager DSGVO Export
`,
    { name: "README.md" }
  );

  await archive.finalize();
  
  // Warte auf alle Chunks
  await new Promise<void>((resolve) => archive.on("end", resolve));
  
  return Buffer.concat(chunks);
}

// Helper: JSON zu CSV
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return "";
  
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (val instanceof Date) return val.toISOString();
      if (typeof val === "object") return JSON.stringify(val).replace(/"/g, '""');
      return String(val).replace(/"/g, '""');
    }).map((v) => `"${v}"`).join(",")
  );
  
  return [headers.join(","), ...rows].join("\n");
}
