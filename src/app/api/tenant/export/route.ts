/**
 * API: /api/tenant/export
 * Sprint OE: IMPL-CHURN-05 - Tenant Datenexport
 * 
 * DSGVO Art. 20 Datenportabilität:
 * - POST: Export anfordern (generiert ZIP asynchron)
 * - GET: Status aller Exports abrufen
 * 
 * Exportiert alle Tenant-Daten als ZIP mit JSON/CSV:
 * - Aufträge, Protokolle, Rechnungen
 * - Mitarbeiter, Gruppen, Zeiterfassung
 * - Dokumente (Metadaten + Links)
 * 
 * Download-Link gültig für 7 Tage
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAdmin } from "@/lib/auth-helpers";
import archiver from "archiver";

// Tenant-ID aus Config (für Single-Tenant Setup)
const TENANT_ID = process.env.TENANT_ID || "koch-aufforstung";

// Welche Daten werden exportiert
const EXPORT_TYPES = [
  "auftraege",
  "tagesprotokolle", 
  "rechnungen",
  "mitarbeiter",
  "gruppen",
  "zeiterfassung",
  "abwesenheiten",
  "dokumente",
  "fahrzeuge",
  "geraete",
  "kontakte",
  "angebote",
  "lager",
] as const;

// POST: Export anfordern
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    // Nur Admins können Exports anfordern
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    // Prüfe ob bereits ein aktiver Export läuft
    const activeExport = await prisma.exportRequest.findFirst({
      where: {
        tenantId: TENANT_ID,
        status: { in: ["pending", "processing"] },
      },
    });

    if (activeExport) {
      return NextResponse.json({
        error: "Export bereits aktiv",
        existingId: activeExport.id,
        status: activeExport.status,
      }, { status: 409 });
    }

    // Neuen Export erstellen
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig

    const exportRequest = await prisma.exportRequest.create({
      data: {
        tenantId: TENANT_ID,
        requestedBy: user.id,
        status: "pending",
        expiresAt,
        exportedTypes: [...EXPORT_TYPES],
      },
    });

    // Asynchron den Export starten (in Produktion: Queue/Background Job)
    // Hier synchron für MVP
    generateExport(exportRequest.id).catch(console.error);

    return NextResponse.json({
      success: true,
      exportId: exportRequest.id,
      token: exportRequest.token,
      expiresAt: exportRequest.expiresAt,
      downloadUrl: `/api/tenant/export/${exportRequest.token}`,
      message: "Export gestartet. Download-Link 7 Tage gültig.",
    }, { status: 201 });

  } catch (error) {
    console.error("Export-Fehler:", error);
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });
  }
}

// GET: Liste aller Exports
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const exports = await prisma.exportRequest.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        fileSize: true,
        recordCount: true,
        createdAt: true,
        completedAt: true,
        expiresAt: true,
        downloadedAt: true,
        token: true,
        exportedTypes: true,
        errorMessage: true,
      },
    });

    // Abgelaufene als expired markieren
    const now = new Date();
    const updatedExports = exports.map((exp) => ({
      ...exp,
      status: exp.expiresAt < now && exp.status === "completed" ? "expired" : exp.status,
      downloadUrl: exp.status === "completed" && exp.expiresAt >= now 
        ? `/api/tenant/export/${exp.token}` 
        : null,
    }));

    return NextResponse.json({ exports: updatedExports });

  } catch (error) {
    console.error("Export-Liste Fehler:", error);
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });
  }
}

// Helper: Export generieren (async)
async function generateExport(exportId: string) {
  const startTime = Date.now();
  
  try {
    // Status auf processing setzen
    await prisma.exportRequest.update({
      where: { id: exportId },
      data: { status: "processing", startedAt: new Date() },
    });

    const recordCounts: Record<string, number> = {};

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

    recordCounts.auftraege = auftraege.length;
    recordCounts.protokolle = protokolle.length;
    recordCounts.rechnungen = rechnungen.length;
    recordCounts.mitarbeiter = mitarbeiter.length;
    recordCounts.gruppen = gruppen.length;
    recordCounts.zeiterfassung = zeiterfassung.length;
    recordCounts.abwesenheiten = abwesenheiten.length;
    recordCounts.dokumente = dokumente.length;
    recordCounts.fahrzeuge = fahrzeuge.length;
    recordCounts.geraete = geraete.length;
    recordCounts.kontakte = kontakte.length;
    recordCounts.angebote = angebote.length;
    recordCounts.lager = lager.length;

    // ZIP erstellen (als Buffer für DB-Storage in MVP)
    // In Produktion: S3/Blob Storage
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    
    archive.on("data", (chunk) => chunks.push(chunk));
    
    // JSON-Dateien hinzufügen
    archive.append(JSON.stringify({ exportedAt: new Date().toISOString(), tenant: TENANT_ID, recordCounts }, null, 2), { name: "manifest.json" });
    archive.append(JSON.stringify(auftraege, null, 2), { name: "auftraege.json" });
    archive.append(JSON.stringify(protokolle, null, 2), { name: "tagesprotokolle.json" });
    archive.append(JSON.stringify(rechnungen, null, 2), { name: "rechnungen.json" });
    archive.append(JSON.stringify(mitarbeiter, null, 2), { name: "mitarbeiter.json" });
    archive.append(JSON.stringify(gruppen, null, 2), { name: "gruppen.json" });
    archive.append(JSON.stringify(zeiterfassung, null, 2), { name: "zeiterfassung.json" });
    archive.append(JSON.stringify(abwesenheiten, null, 2), { name: "abwesenheiten.json" });
    archive.append(JSON.stringify(dokumente, null, 2), { name: "dokumente.json" });
    archive.append(JSON.stringify(fahrzeuge, null, 2), { name: "fahrzeuge.json" });
    archive.append(JSON.stringify(geraete, null, 2), { name: "geraete.json" });
    archive.append(JSON.stringify(kontakte, null, 2), { name: "kontakte.json" });
    archive.append(JSON.stringify(angebote, null, 2), { name: "angebote.json" });
    archive.append(JSON.stringify(lager, null, 2), { name: "lager.json" });

    // CSV für einfachere Weiterverarbeitung
    archive.append(convertToCSV(auftraege), { name: "auftraege.csv" });
    archive.append(convertToCSV(mitarbeiter), { name: "mitarbeiter.csv" });
    archive.append(convertToCSV(rechnungen), { name: "rechnungen.csv" });

    await archive.finalize();
    
    // Warte auf alle Chunks
    await new Promise<void>((resolve) => archive.on("end", resolve));
    
    const zipBuffer = Buffer.concat(chunks);
    const fileSize = zipBuffer.length;

    // Speichere ZIP temporär als Base64 in DB (MVP)
    // In Produktion: S3/Blob Storage
    // Hier speichern wir nur die Metadaten, ZIP wird on-demand regeneriert
    
    await prisma.exportRequest.update({
      where: { id: exportId },
      data: {
        status: "completed",
        completedAt: new Date(),
        fileSize,
        recordCount: recordCounts,
      },
    });

    console.log(`Export ${exportId} fertig: ${fileSize} Bytes, ${Object.values(recordCounts).reduce((a, b) => a + b, 0)} Records, ${Date.now() - startTime}ms`);

  } catch (error) {
    console.error(`Export ${exportId} fehlgeschlagen:`, error);
    await prisma.exportRequest.update({
      where: { id: exportId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
    });
  }
}

// Helper: JSON zu CSV konvertieren
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return "";
  
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val).replace(/"/g, '""');
      return String(val).replace(/"/g, '""');
    }).map((v) => `"${v}"`).join(",")
  );
  
  return [headers.join(","), ...rows].join("\n");
}
