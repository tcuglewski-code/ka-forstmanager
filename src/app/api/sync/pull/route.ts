import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, getGruppenIdsForUser } from "@/lib/auth-helpers"

// ============================================================
// WatermelonDB Sync — PULL Endpunkt (Sprint AP + SC-04 Fix)
// Liefert geänderte Datensätze seit lastPulledAt
// App ruft diesen Endpunkt beim Offline-Sync auf
// ============================================================

// App Sync Secret für Mobile App Auth (zusätzlich zu User-Auth)
const APP_SYNC_SECRET = process.env.APP_SYNC_SECRET

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url)
  const lastPulledAt = parseInt(url.searchParams.get("lastPulledAt") ?? "0")
  const sinceDate = new Date(lastPulledAt)

  try {
    // Role-based filtering: GF/MA only see their own group's data
    const userRole = (user as { role?: string } | null)?.role
    const userEmail = (user as { email?: string } | null)?.email
    const gruppenIds = user
      ? await getGruppenIdsForUser(userEmail, userRole)
      : [] // sync-secret: full access (server-to-server)

    const hasRestriction = gruppenIds.length > 0
    const auftragWhere = {
      updatedAt: { gte: sinceDate },
      ...(hasRestriction ? { gruppeId: { in: gruppenIds } } : {}),
    }

    const [auftraege, protokolle] = await Promise.all([
      prisma.auftrag.findMany({
        where: auftragWhere,
        select: {
          id: true, titel: true, status: true, flaeche_ha: true,
          baumarten: true, updatedAt: true, createdAt: true,
        },
        take: 500,
      }),
      prisma.tagesprotokoll.findMany({
        where: {
          updatedAt: { gte: sinceDate },
          ...(hasRestriction
            ? { auftrag: { gruppeId: { in: gruppenIds } } }
            : {}),
        },
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
