import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ============================================================
// WatermelonDB Sync — PULL Endpunkt (Sprint AP)
// Liefert geänderte Datensätze seit lastPulledAt
// App ruft diesen Endpunkt beim Offline-Sync auf
// ============================================================

export async function GET(req: Request) {
  const url = new URL(req.url)
  const lastPulledAt = parseInt(url.searchParams.get("lastPulledAt") ?? "0")
  const sinceDate = new Date(lastPulledAt)

  try {
    const [auftraege, protokolle] = await Promise.all([
      prisma.auftrag.findMany({
        where: { updatedAt: { gte: sinceDate } },
        select: {
          id: true, titel: true, status: true, flaeche_ha: true,
          baumarten: true, updatedAt: true, createdAt: true,
        },
        take: 500,
      }),
      prisma.tagesprotokoll.findMany({
        where: { updatedAt: { gte: sinceDate } },
        select: {
          id: true, auftragId: true, datum: true, kommentar: true,
          gpsStartLat: true, gpsStartLon: true, updatedAt: true, createdAt: true,
        },
        take: 500,
      }).catch(() => []),
    ])

    const timestamp = Date.now()

    return NextResponse.json({
      changes: {
        auftraege: {
          created: auftraege.filter(a => a.createdAt >= sinceDate).map(a => ({
            id: String(a.id), titel: a.titel, status: a.status,
            flaeche: a.flaeche_ha, baumarten: a.baumarten,
          })),
          updated: auftraege.filter(a => a.createdAt < sinceDate).map(a => ({
            id: String(a.id), titel: a.titel, status: a.status,
          })),
          deleted: [],
        },
        protokolle: {
          created: protokolle.filter(p => p.createdAt >= sinceDate).map(p => ({
            id: String(p.id), auftragId: String(p.auftragId ?? ""),
            datum: p.datum?.toISOString() ?? null, notizen: p.kommentar ?? "",
            gpsLat: p.gpsStartLat, gpsLng: p.gpsStartLon,
          })),
          updated: [],
          deleted: [],
        },
      },
      timestamp,
    })
  } catch (err) {
    console.error("[sync/pull] Fehler:", err)
    return NextResponse.json({ error: "Sync fehlgeschlagen" }, { status: 500 })
  }
}
