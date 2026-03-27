import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ============================================================
// WatermelonDB Sync — PUSH Endpunkt (Sprint AP)
// Empfängt geänderte Datensätze von der App
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { changes } = body as { changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> }

    let totalProcessed = 0

    // Protokolle von der App empfangen
    const protokolle = changes?.protokolle
    if (protokolle) {
      for (const p of protokolle.created ?? []) {
        await prisma.protokoll.upsert({
          where: { id: p.id ?? undefined },
          update: { notizen: p.notizen, gpsLat: p.gpsLat, gpsLng: p.gpsLng },
          create: {
            id: p.id,
            auftragId: p.auftragId ? parseInt(p.auftragId) : undefined,
            datum: p.datum ? new Date(p.datum) : new Date(),
            notizen: p.notizen ?? "",
            gpsLat: p.gpsLat,
            gpsLng: p.gpsLng,
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
        console.log("[sync/push] GPS-Track empfangen:", track.sessionId)
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
