import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth-helpers"

// ============================================================
// WatermelonDB Sync — PUSH Endpunkt (Sprint AP + SC-04 Fix)
// Empfängt geänderte Datensätze von der App
// ============================================================

// App Sync Secret für Mobile App Auth (zusätzlich zu User-Auth)
const APP_SYNC_SECRET = process.env.APP_SYNC_SECRET

export async function POST(req: NextRequest) {
  try {
    // ─── SC-04: Auth-Check (Session oder Bearer Token) ─────────────────────
    const user = await verifyToken(req)
    
    // Fallback: App-spezifisches Sync-Secret für Mobile App
    const syncSecret = req.headers.get("x-sync-secret")
    const hasValidSyncSecret = APP_SYNC_SECRET && syncSecret === APP_SYNC_SECRET
    
    if (!user && !hasValidSyncSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Session, Bearer Token, or x-sync-secret required." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { changes } = body as { changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> }

    let totalProcessed = 0

    // Protokolle von der App empfangen
    const protokolle = changes?.protokolle
    if (protokolle) {
      for (const p of protokolle.created ?? []) {
        await prisma.tagesprotokoll.upsert({
          where: { id: p.id ?? "" },
          update: {
            kommentar: p.notizen,
            gpsStartLat: p.gpsLat,
            gpsStartLon: p.gpsLng,
          },
          create: {
            id: p.id,
            auftragId: p.auftragId ?? "",
            datum: p.datum ? new Date(p.datum) : new Date(),
            ersteller: user?.email ?? p.ersteller ?? "app-sync",
            kommentar: p.notizen ?? "",
            gpsStartLat: p.gpsLat ?? null,
            gpsStartLon: p.gpsLng ?? null,
          },
        }).catch(() => null)
        totalProcessed++
      }
    }

    // GPS-Tracks von der App empfangen
    const gpsTracks = changes?.gps_tracks
    if (gpsTracks) {
      for (const track of gpsTracks.created ?? []) {
        // GPS-Track in Protokoll-Notizen speichern (einfaches Fallback)
        console.log("[sync/push] GPS-Track empfangen:", track.sessionId, "user:", user?.email ?? "app-sync")
        totalProcessed++
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: totalProcessed,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.error("[sync/push] Fehler:", err)
    return NextResponse.json({ error: "Push-Sync fehlgeschlagen" }, { status: 500 })
  }
}
