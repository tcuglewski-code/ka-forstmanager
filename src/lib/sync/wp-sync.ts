import { prisma } from "@/lib/prisma"

// WP Credentials aus ENV
const WP_BASE_URL = process.env.WP_BASE_URL || "https://peru-otter-113714.hostingersite.com/wp-json"
const WP_USER = process.env.WP_USER || "openclaw"
const WP_PASSWORD = process.env.WP_PASSWORD || ""

interface SyncResult {
  success: boolean
  entityType: string
  entityId: string
  direction: "WP_TO_FM" | "FM_TO_WP"
  error?: string
  data?: Record<string, unknown>
}

interface WPAuftrag {
  id: number
  title: { rendered: string }
  status: string
  meta: {
    ka_wizard_daten?: Record<string, unknown>
    ka_status?: string
    ka_waldbesitzer?: string
    ka_email?: string
    ka_telefon?: string
    ka_flaeche?: string
    ka_standort?: string
    ka_bundesland?: string
    ka_angelegt?: number
  }
}

/**
 * WP-Sync Engine für bidirektionale Synchronisation
 * ForstManager ↔ WordPress
 */
export class WPSyncEngine {
  private authHeader: string

  constructor() {
    // Basic Auth für WP REST API
    const credentials = Buffer.from(`${WP_USER}:${WP_PASSWORD}`).toString("base64")
    this.authHeader = `Basic ${credentials}`
  }

  /**
   * Einzelnen Auftrag zu WordPress synchronisieren
   */
  async syncAuftrag(auftragId: string): Promise<SyncResult> {
    try {
      const auftrag = await prisma.auftrag.findUnique({
        where: { id: auftragId },
        include: {
          abnahmen: { take: 1, orderBy: { createdAt: "desc" } },
          rechnungen: { take: 1, orderBy: { createdAt: "desc" } }
        }
      })

      if (!auftrag) {
        return this.logSync("Auftrag", auftragId, "FM_TO_WP", false, "Auftrag nicht gefunden")
      }

      if (!auftrag.wpProjektId) {
        return this.logSync("Auftrag", auftragId, "FM_TO_WP", false, "Keine WP-Projekt-ID vorhanden")
      }

      // Status-Mapping FM → WP
      const wpStatus = this.mapStatusToWP(auftrag.status)

      // Update an WP senden
      const response = await fetch(`${WP_BASE_URL}/ka/v1/projekte/${auftrag.wpProjektId}`, {
        method: "PATCH",
        headers: {
          "Authorization": this.authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: wpStatus,
          meta: {
            ka_fm_status: auftrag.status,
            ka_fm_id: auftrag.id,
            ka_last_sync: new Date().toISOString(),
            ka_abnahme_status: auftrag.abnahmen[0]?.status || null,
            ka_rechnung_status: auftrag.rechnungen[0]?.status || null
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return this.logSync("Auftrag", auftragId, "FM_TO_WP", false, `WP-Fehler: ${response.status} - ${errorText}`)
      }

      // Sync-Timestamp aktualisieren
      await prisma.auftrag.update({
        where: { id: auftragId },
        data: { 
          wpSyncedAt: new Date(),
          syncStatus: "synced"
        }
      })

      return this.logSync("Auftrag", auftragId, "FM_TO_WP", true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler"
      return this.logSync("Auftrag", auftragId, "FM_TO_WP", false, message)
    }
  }

  /**
   * Alle Aufträge mit lokalen Änderungen synchronisieren
   */
  async syncAlle(): Promise<SyncResult[]> {
    const results: SyncResult[] = []

    // Aufträge mit lokalen Änderungen finden
    const auftraege = await prisma.auftrag.findMany({
      where: {
        wpProjektId: { not: null },
        OR: [
          { syncStatus: "local_changes" },
          { 
            localUpdatedAt: { not: null },
            wpSyncedAt: null 
          }
        ]
      },
      select: { id: true }
    })

    for (const auftrag of auftraege) {
      const result = await this.syncAuftrag(auftrag.id)
      results.push(result)
      
      // Rate-Limiting: 500ms zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return results
  }

  /**
   * Daten von WordPress holen (neue Anfragen)
   */
  async pullFromWP(wpId: number): Promise<void> {
    try {
      const response = await fetch(`${WP_BASE_URL}/ka/v1/projekte/${wpId}`, {
        headers: {
          "Authorization": this.authHeader
        }
      })

      if (!response.ok) {
        throw new Error(`WP-Fehler: ${response.status}`)
      }

      const wpData: WPAuftrag = await response.json()

      // Prüfen ob Auftrag bereits existiert
      const existing = await prisma.auftrag.findUnique({
        where: { wpProjektId: String(wpId) }
      })

      if (existing) {
        // Konflikt prüfen
        const conflict = await this.resolveConflict(existing, wpData)
        if (conflict.useLocal) {
          // Lokale Version behalten
          await this.logSync("Auftrag", existing.id, "WP_TO_FM", true, "Lokale Version beibehalten (Konflikt)")
          return
        }
      }

      // Auftrag erstellen oder aktualisieren
      const auftragData = {
        titel: wpData.title.rendered,
        typ: "anfrage",
        status: this.mapStatusFromWP(wpData.meta.ka_status || "anfrage"),
        waldbesitzer: wpData.meta.ka_waldbesitzer || null,
        waldbesitzerEmail: wpData.meta.ka_email || null,
        waldbesitzerTelefon: wpData.meta.ka_telefon || null,
        flaeche_ha: wpData.meta.ka_flaeche ? parseFloat(wpData.meta.ka_flaeche) : null,
        standort: wpData.meta.ka_standort || null,
        bundesland: wpData.meta.ka_bundesland || null,
        wizardDaten: wpData.meta.ka_wizard_daten || null,
        wpProjektId: String(wpId),
        wpErstelltAm: wpData.meta.ka_angelegt ? new Date(wpData.meta.ka_angelegt * 1000) : null,
        wpSyncedAt: new Date(),
        syncStatus: "synced"
      }

      if (existing) {
        await prisma.auftrag.update({
          where: { id: existing.id },
          data: auftragData
        })
        await this.logSync("Auftrag", existing.id, "WP_TO_FM", true)
      } else {
        const created = await prisma.auftrag.create({
          data: auftragData
        })
        await this.logSync("Auftrag", created.id, "WP_TO_FM", true)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler"
      await this.logSync("Auftrag", String(wpId), "WP_TO_FM", false, message)
      throw error
    }
  }

  /**
   * Konflikt-Auflösung: Last-Write-Wins
   */
  private resolveConflict(local: { localUpdatedAt: Date | null; wpSyncedAt: Date | null }, remote: WPAuftrag): { useLocal: boolean } {
    // Wenn keine lokalen Änderungen, Remote verwenden
    if (!local.localUpdatedAt) {
      return { useLocal: false }
    }

    // Wenn Remote neuer, Remote verwenden
    const remoteTimestamp = remote.meta.ka_angelegt 
      ? new Date(remote.meta.ka_angelegt * 1000)
      : new Date(0)
    
    if (remoteTimestamp > local.localUpdatedAt) {
      return { useLocal: false }
    }

    // Sonst lokale Version behalten
    return { useLocal: true }
  }

  /**
   * Status-Mapping FM → WP
   */
  private mapStatusToWP(fmStatus: string): string {
    const mapping: Record<string, string> = {
      "anfrage": "pending",
      "in_bearbeitung": "processing",
      "aktiv": "active",
      "abgeschlossen": "completed",
      "storniert": "cancelled"
    }
    return mapping[fmStatus] || "pending"
  }

  /**
   * Status-Mapping WP → FM
   */
  private mapStatusFromWP(wpStatus: string): string {
    const mapping: Record<string, string> = {
      "pending": "anfrage",
      "processing": "in_bearbeitung",
      "active": "aktiv",
      "completed": "abgeschlossen",
      "cancelled": "storniert"
    }
    return mapping[wpStatus] || "anfrage"
  }

  /**
   * Sync-Log erstellen
   */
  private async logSync(
    entityType: string,
    entityId: string,
    direction: "WP_TO_FM" | "FM_TO_WP",
    success: boolean,
    error?: string
  ): Promise<SyncResult> {
    await prisma.syncLog.create({
      data: {
        entityType,
        entityId,
        direction,
        status: success ? "OK" : "ERROR",
        error: error || null
      }
    })

    return {
      success,
      entityType,
      entityId,
      direction,
      error
    }
  }
}

// Singleton-Export
export const wpSyncEngine = new WPSyncEngine()
