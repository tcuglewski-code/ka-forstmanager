// KI-1: WP-Sync Merge-Strategie
// POST /api/sync/wp — Synchronisiert Aufträge zwischen WordPress und ForstManager
// Strategie: Last-Write-Wins via Timestamp-Vergleich

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface WPAuftrag {
  wpProjektId: string
  titel: string
  typ: string
  status: string
  waldbesitzer?: string
  waldbesitzerEmail?: string
  waldbesitzerTelefon?: string
  standort?: string
  bundesland?: string
  flaeche_ha?: number
  wizardDaten?: Record<string, unknown>
  wpUpdatedAt: string // ISO Date String
}

interface SyncResult {
  wpProjektId: string
  action: "created" | "updated_from_wp" | "kept_local" | "conflict" | "skipped"
  auftragId?: string
  reason?: string
}

export async function POST(req: NextRequest) {
  try {
    await auth()
    
    const body = await req.json()
    const wpAuftraege: WPAuftrag[] = body.auftraege || []
    
    if (!Array.isArray(wpAuftraege)) {
      return NextResponse.json({ error: "auftraege Array erforderlich" }, { status: 400 })
    }

    const results: SyncResult[] = []

    for (const wpAuftrag of wpAuftraege) {
      if (!wpAuftrag.wpProjektId) {
        results.push({
          wpProjektId: wpAuftrag.wpProjektId || "unknown",
          action: "skipped",
          reason: "Keine wpProjektId",
        })
        continue
      }

      // Bestehenden Auftrag in FM suchen
      const existing = await prisma.auftrag.findUnique({
        where: { wpProjektId: wpAuftrag.wpProjektId },
        select: {
          id: true,
          localUpdatedAt: true,
          wpSyncedAt: true,
          syncStatus: true,
        },
      })

      const wpUpdatedAt = new Date(wpAuftrag.wpUpdatedAt)

      if (!existing) {
        // Neuer Auftrag — aus WP erstellen
        const created = await prisma.auftrag.create({
          data: {
            titel: wpAuftrag.titel,
            typ: wpAuftrag.typ || "pflanzung",
            status: wpAuftrag.status || "anfrage",
            waldbesitzer: wpAuftrag.waldbesitzer,
            waldbesitzerEmail: wpAuftrag.waldbesitzerEmail,
            waldbesitzerTelefon: wpAuftrag.waldbesitzerTelefon,
            standort: wpAuftrag.standort,
            bundesland: wpAuftrag.bundesland,
            flaeche_ha: wpAuftrag.flaeche_ha,
            wizardDaten: wpAuftrag.wizardDaten || null,
            wpProjektId: wpAuftrag.wpProjektId,
            wpErstelltAm: wpUpdatedAt,
            wpSyncedAt: new Date(),
            syncStatus: "synced",
          },
        })

        results.push({
          wpProjektId: wpAuftrag.wpProjektId,
          action: "created",
          auftragId: created.id,
        })
        continue
      }

      // Bestehender Auftrag — Merge-Strategie anwenden
      const localUpdatedAt = existing.localUpdatedAt || new Date(0)

      // Last-Write-Wins Vergleich
      if (wpUpdatedAt > localUpdatedAt) {
        // WP ist neuer — FM überschreiben
        await prisma.auftrag.update({
          where: { id: existing.id },
          data: {
            titel: wpAuftrag.titel,
            typ: wpAuftrag.typ,
            status: wpAuftrag.status,
            waldbesitzer: wpAuftrag.waldbesitzer,
            waldbesitzerEmail: wpAuftrag.waldbesitzerEmail,
            waldbesitzerTelefon: wpAuftrag.waldbesitzerTelefon,
            standort: wpAuftrag.standort,
            bundesland: wpAuftrag.bundesland,
            flaeche_ha: wpAuftrag.flaeche_ha,
            wizardDaten: wpAuftrag.wizardDaten || null,
            wpSyncedAt: new Date(),
            syncStatus: "synced",
          },
        })

        results.push({
          wpProjektId: wpAuftrag.wpProjektId,
          action: "updated_from_wp",
          auftragId: existing.id,
        })
      } else if (localUpdatedAt > wpUpdatedAt) {
        // FM ist neuer — lokale Änderungen behalten, markieren für Push zu WP
        await prisma.auftrag.update({
          where: { id: existing.id },
          data: {
            wpSyncedAt: new Date(),
            syncStatus: "local_changes",
          },
        })

        results.push({
          wpProjektId: wpAuftrag.wpProjektId,
          action: "kept_local",
          auftragId: existing.id,
          reason: "Lokale Änderungen sind neuer",
        })
      } else {
        // Gleicher Timestamp — als synchronisiert markieren
        await prisma.auftrag.update({
          where: { id: existing.id },
          data: {
            wpSyncedAt: new Date(),
            syncStatus: "synced",
          },
        })

        results.push({
          wpProjektId: wpAuftrag.wpProjektId,
          action: "skipped",
          auftragId: existing.id,
          reason: "Bereits synchronisiert",
        })
      }
    }

    // Statistiken
    const stats = {
      total: results.length,
      created: results.filter(r => r.action === "created").length,
      updated_from_wp: results.filter(r => r.action === "updated_from_wp").length,
      kept_local: results.filter(r => r.action === "kept_local").length,
      skipped: results.filter(r => r.action === "skipped").length,
    }

    return NextResponse.json({
      success: true,
      stats,
      results,
    })
  } catch (error) {
    console.error("[WP-Sync] Fehler:", error)
    return NextResponse.json(
      { error: "Sync fehlgeschlagen", details: error instanceof Error ? error.message : "Unbekannt" },
      { status: 500 }
    )
  }
}

// GET — Aufträge mit lokalem Änderungen abrufen (für Push zu WP)
export async function GET(req: NextRequest) {
  try {
    await auth()
    
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || "local_changes"

    const auftraege = await prisma.auftrag.findMany({
      where: {
        wpProjektId: { not: null },
        syncStatus: status,
      },
      select: {
        id: true,
        wpProjektId: true,
        titel: true,
        typ: true,
        status: true,
        waldbesitzer: true,
        waldbesitzerEmail: true,
        waldbesitzerTelefon: true,
        standort: true,
        bundesland: true,
        flaeche_ha: true,
        wizardDaten: true,
        localUpdatedAt: true,
        wpSyncedAt: true,
        syncStatus: true,
      },
    })

    return NextResponse.json({
      count: auftraege.length,
      auftraege,
    })
  } catch (error) {
    console.error("[WP-Sync GET] Fehler:", error)
    return NextResponse.json({ error: "Abruf fehlgeschlagen" }, { status: 500 })
  }
}
