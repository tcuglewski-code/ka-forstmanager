/**
 * IMPL-RP-05: Cold Storage Archivierung
 * 
 * Quartals-Cron: Verschiebt Daten >3 Jahre aus aktiven Tabellen ins Archiv
 * - Aufträge (abgeschlossen)
 * - Tagesprotokolle
 * - Rechnungen
 * - Dokumente
 * - Lohndaten (Stunden, Abrechnungen)
 * 
 * GoBD-Konformität: Rechnungen werden archiviert, nicht gelöscht (10J Aufbewahrung)
 * Schedule: Quartalsweise (1. Jan, 1. Apr, 1. Jul, 1. Okt um 03:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// 3 Jahre in Millisekunden
const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

// Archivierungs-Batch-Größe (um Timeouts zu vermeiden)
const BATCH_SIZE = 100;

interface ArchiveResult {
  entityType: string;
  count: number;
  success: boolean;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Auth-Check (Vercel Cron oder CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Vercel Cron sendet den CRON_SECRET im Authorization Header
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = randomUUID();
  const cutoffDate = new Date(Date.now() - THREE_YEARS_MS);
  const results: ArchiveResult[] = [];

  console.log(`[archive-cold-storage] Run ${runId} started. Cutoff: ${cutoffDate.toISOString()}`);

  try {
    // 1. AUFTRÄGE archivieren (nur abgeschlossene: status IN ['abgeschlossen', 'abgebrochen', 'storniert'])
    results.push(await archiveAuftraege(runId, cutoffDate));

    // 2. TAGESPROTOKOLLE archivieren
    results.push(await archiveTagesprotokolle(runId, cutoffDate));

    // 3. RECHNUNGEN archivieren (alle status, GoBD-relevant)
    results.push(await archiveRechnungen(runId, cutoffDate));

    // 4. DOKUMENTE archivieren
    results.push(await archiveDokumente(runId, cutoffDate));

    // 5. LOHNDATEN archivieren (Stundeneinträge, Lohnabrechnungen)
    results.push(await archiveLohndaten(runId, cutoffDate));

    const totalArchived = results.reduce((sum, r) => sum + (r.success ? r.count : 0), 0);
    const hasErrors = results.some(r => !r.success);

    console.log(`[archive-cold-storage] Run ${runId} completed. Total: ${totalArchived}, Errors: ${hasErrors}`);

    return NextResponse.json({
      success: !hasErrors,
      runId,
      cutoffDate: cutoffDate.toISOString(),
      totalArchived,
      results
    });

  } catch (error) {
    console.error(`[archive-cold-storage] Run ${runId} failed:`, error);
    
    return NextResponse.json({
      success: false,
      runId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Archiviert abgeschlossene Aufträge >3 Jahre
 */
async function archiveAuftraege(runId: string, cutoffDate: Date): Promise<ArchiveResult> {
  const entityType = 'ArchivedAuftrag';
  
  try {
    // Log starten
    await prisma.archiveLog.create({
      data: { runId, entityType, entityCount: 0, cutoffDate, status: 'RUNNING' }
    });

    // Aufträge finden (abgeschlossen + alt)
    const auftraege = await prisma.auftrag.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ['abgeschlossen', 'abgebrochen', 'storniert'] },
        deletedAt: null // Nicht bereits soft-deleted
      },
      include: {
        abnahmen: true,
        protokolle: true,
        rechnungen: true,
        dokumente: true,
        logs: true,
        angebote: true
      },
      take: BATCH_SIZE
    });

    let archived = 0;

    for (const auftrag of auftraege) {
      // Ins Archiv verschieben
      await prisma.archivedAuftrag.create({
        data: {
          id: auftrag.id,
          originalCreatedAt: auftrag.createdAt,
          archiveReason: 'COLD_STORAGE_3Y',
          titel: auftrag.titel,
          typ: auftrag.typ,
          status: auftrag.status,
          beschreibung: auftrag.beschreibung,
          flaeche_ha: auftrag.flaeche_ha,
          standort: auftrag.standort,
          bundesland: auftrag.bundesland,
          waldbesitzer: auftrag.waldbesitzer,
          waldbesitzerEmail: auftrag.waldbesitzerEmail,
          waldbesitzerTelefon: auftrag.waldbesitzerTelefon,
          baumarten: auftrag.baumarten,
          zeitraum: auftrag.zeitraum,
          notizen: auftrag.notizen,
          nummer: auftrag.nummer,
          startDatum: auftrag.startDatum,
          endDatum: auftrag.endDatum,
          lat: auftrag.lat,
          lng: auftrag.lng,
          fullSnapshot: auftrag as object
        }
      });

      // Original aus aktiver Tabelle löschen (Cascade löscht auch Relationen)
      await prisma.auftrag.delete({ where: { id: auftrag.id } });
      archived++;
    }

    // Log abschließen
    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { entityCount: archived, completedAt: new Date(), status: 'SUCCESS' }
    });

    return { entityType, count: archived, success: true };

  } catch (error) {
    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown' }
    });
    return { entityType, count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' };
  }
}

/**
 * Archiviert Tagesprotokolle >3 Jahre (auch von aktiven Aufträgen)
 */
async function archiveTagesprotokolle(runId: string, cutoffDate: Date): Promise<ArchiveResult> {
  const entityType = 'ArchivedTagesprotokoll';
  
  try {
    await prisma.archiveLog.create({
      data: { runId, entityType, entityCount: 0, cutoffDate, status: 'RUNNING' }
    });

    const protokolle = await prisma.tagesprotokoll.findMany({
      where: {
        createdAt: { lt: cutoffDate }
      },
      take: BATCH_SIZE
    });

    let archived = 0;

    for (const protokoll of protokolle) {
      await prisma.archivedTagesprotokoll.create({
        data: {
          id: protokoll.id,
          auftragId: protokoll.auftragId,
          originalCreatedAt: protokoll.createdAt,
          archiveReason: 'COLD_STORAGE_3Y',
          datum: protokoll.datum,
          ersteller: protokoll.ersteller,
          gruppeId: protokoll.gruppeId,
          status: protokoll.status,
          fullSnapshot: protokoll as object
        }
      });

      await prisma.tagesprotokoll.delete({ where: { id: protokoll.id } });
      archived++;
    }

    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { entityCount: archived, completedAt: new Date(), status: 'SUCCESS' }
    });

    return { entityType, count: archived, success: true };

  } catch (error) {
    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown' }
    });
    return { entityType, count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' };
  }
}

/**
 * Archiviert Rechnungen >3 Jahre (GoBD: 10 Jahre aufbewahren, daher NUR archivieren)
 */
async function archiveRechnungen(runId: string, cutoffDate: Date): Promise<ArchiveResult> {
  const entityType = 'ArchivedRechnung';
  
  try {
    await prisma.archiveLog.create({
      data: { runId, entityType, entityCount: 0, cutoffDate, status: 'RUNNING' }
    });

    const rechnungen = await prisma.rechnung.findMany({
      where: {
        createdAt: { lt: cutoffDate }
      },
      include: {
        positionen: true,
        auditLog: true,
        versionen: true
      },
      take: BATCH_SIZE
    });

    let archived = 0;

    for (const rechnung of rechnungen) {
      await prisma.archivedRechnung.create({
        data: {
          id: rechnung.id,
          originalCreatedAt: rechnung.createdAt,
          archiveReason: 'COLD_STORAGE_3Y',
          nummer: rechnung.nummer,
          auftragId: rechnung.auftragId,
          betrag: rechnung.betrag,
          bruttoBetrag: rechnung.bruttoBetrag,
          mwst: rechnung.mwst,
          status: rechnung.status,
          rechnungsDatum: rechnung.rechnungsDatum,
          fullSnapshot: rechnung as object // Inkl. Positionen + AuditLog
        }
      });

      // Rechnung aus aktiver Tabelle entfernen (Daten sind im Archiv)
      await prisma.rechnung.delete({ where: { id: rechnung.id } });
      archived++;
    }

    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { entityCount: archived, completedAt: new Date(), status: 'SUCCESS' }
    });

    return { entityType, count: archived, success: true };

  } catch (error) {
    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown' }
    });
    return { entityType, count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' };
  }
}

/**
 * Archiviert Dokumente >3 Jahre (Dateien bleiben in Nextcloud)
 */
async function archiveDokumente(runId: string, cutoffDate: Date): Promise<ArchiveResult> {
  const entityType = 'ArchivedDokument';
  
  try {
    await prisma.archiveLog.create({
      data: { runId, entityType, entityCount: 0, cutoffDate, status: 'RUNNING' }
    });

    const dokumente = await prisma.dokument.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        deletedAt: null
      },
      take: BATCH_SIZE
    });

    let archived = 0;

    for (const dokument of dokumente) {
      await prisma.archivedDokument.create({
        data: {
          id: dokument.id,
          originalCreatedAt: dokument.createdAt,
          archiveReason: 'COLD_STORAGE_3Y',
          name: dokument.name,
          typ: dokument.typ,
          nextcloudPath: dokument.nextcloudPath,
          auftragId: dokument.auftragId,
          mitarbeiterId: dokument.mitarbeiterId,
          fullSnapshot: dokument as object
        }
      });

      await prisma.dokument.delete({ where: { id: dokument.id } });
      archived++;
    }

    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { entityCount: archived, completedAt: new Date(), status: 'SUCCESS' }
    });

    return { entityType, count: archived, success: true };

  } catch (error) {
    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown' }
    });
    return { entityType, count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' };
  }
}

/**
 * Archiviert Lohndaten >3 Jahre (Stundeneinträge, Lohnabrechnungen)
 */
async function archiveLohndaten(runId: string, cutoffDate: Date): Promise<ArchiveResult> {
  const entityType = 'ArchivedLohndaten';
  
  try {
    await prisma.archiveLog.create({
      data: { runId, entityType, entityCount: 0, cutoffDate, status: 'RUNNING' }
    });

    let archived = 0;

    // 1. Stundeneinträge archivieren
    const stundeneintraege = await prisma.stundeneintrag.findMany({
      where: { createdAt: { lt: cutoffDate } },
      take: BATCH_SIZE / 2
    });

    for (const eintrag of stundeneintraege) {
      const datum = new Date(eintrag.datum);
      const zeitraum = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`;
      
      await prisma.archivedLohndaten.create({
        data: {
          entityType: 'Stundeneintrag',
          entityId: eintrag.id,
          mitarbeiterId: eintrag.mitarbeiterId,
          originalCreatedAt: eintrag.createdAt,
          archiveReason: 'COLD_STORAGE_3Y',
          zeitraum,
          betrag: eintrag.stunden,
          fullSnapshot: eintrag as object
        }
      });

      await prisma.stundeneintrag.delete({ where: { id: eintrag.id } });
      archived++;
    }

    // 2. Lohnabrechnungen archivieren
    const lohnabrechnungen = await prisma.lohnabrechnung.findMany({
      where: { createdAt: { lt: cutoffDate } },
      take: BATCH_SIZE / 2
    });

    for (const abrechnung of lohnabrechnungen) {
      const zeitraumVon = new Date(abrechnung.zeitraumVon);
      const zeitraum = `${zeitraumVon.getFullYear()}-Q${Math.ceil((zeitraumVon.getMonth() + 1) / 3)}`;
      
      await prisma.archivedLohndaten.create({
        data: {
          entityType: 'Lohnabrechnung',
          entityId: abrechnung.id,
          mitarbeiterId: abrechnung.mitarbeiterId,
          originalCreatedAt: abrechnung.createdAt,
          archiveReason: 'COLD_STORAGE_3Y',
          zeitraum,
          betrag: abrechnung.bruttoLohn,
          fullSnapshot: abrechnung as object
        }
      });

      await prisma.lohnabrechnung.delete({ where: { id: abrechnung.id } });
      archived++;
    }

    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { entityCount: archived, completedAt: new Date(), status: 'SUCCESS' }
    });

    return { entityType, count: archived, success: true };

  } catch (error) {
    await prisma.archiveLog.updateMany({
      where: { runId, entityType, status: 'RUNNING' },
      data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown' }
    });
    return { entityType, count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' };
  }
}
