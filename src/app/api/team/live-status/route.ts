/**
 * Team Live Status API — SSE Endpoint
 * 
 * Liefert Echtzeit-Status aller aktiven Mitarbeiter:
 * - 🟢 ok: Check-In aktuell, keine Probleme
 * - 🟡 overdue: Check-In überfällig (Alleinarbeit)
 * - 🔴 sos: Aktiver SOS-Alarm
 * 
 * GET /api/team/live-status — SSE-Stream
 * GET /api/team/live-status?snapshot=true — Einzelabfrage
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mitarbeiter-Status-Typ
export type TeamMemberStatus = "ok" | "overdue" | "sos" | "offline"

export interface TeamMemberLive {
  id: string
  name: string
  rolle: string
  telefon: string | null
  status: TeamMemberStatus
  // GPS
  latitude: number | null
  longitude: number | null
  gpsTimestamp: string | null
  gpsAccuracy: number | null
  // Kontext
  aktiverEinsatzId: string | null
  aktiverEinsatzName: string | null
  // Alleinarbeit
  alleinarbeitAktiv: boolean
  checkIntervalMin: number | null
  lastCheckIn: string | null
  nextCheckDue: string | null
  // SOS
  aktiverSOSEventId: string | null
  sosAusgeloestAt: string | null
}

// Hole alle aktiven Mitarbeiter mit Live-Status
async function getTeamLiveStatus(): Promise<TeamMemberLive[]> {
  const now = new Date()

  // 1. Aktive Mitarbeiter holen
  const mitarbeiter = await prisma.mitarbeiter.findMany({
    where: {
      status: "aktiv",
      deletedAt: null,
    },
    select: {
      id: true,
      vorname: true,
      nachname: true,
      rolle: true,
      telefon: true,
      mobil: true,
    },
  })

  // 2. Aktive Alleinarbeit-Sessions holen (mit letzter GPS-Position)
  const alleinarbeitSessions = await prisma.alleinarbeitSession.findMany({
    where: {
      status: "active",
    },
    select: {
      mitarbeiterId: true,
      sessionId: true,
      einsatzId: true,
      einsatzName: true,
      checkIntervalMin: true,
      lastCheckIn: true,
      nextCheckDue: true,
      latitude: true,
      longitude: true,
    },
  })

  // 3. Aktive SOS-Events holen (nicht resolved)
  const sosEvents = await prisma.sOSEvent.findMany({
    where: {
      status: { in: ["pending", "sent", "acknowledged"] },
    },
    select: {
      mitarbeiterId: true,
      eventId: true,
      gpsLatitude: true,
      gpsLongitude: true,
      gpsAccuracy: true,
      gpsTimestamp: true,
      aktiverEinsatzId: true,
      aktiverEinsatzName: true,
      ausgeloestAt: true,
      status: true,
    },
  })

  // 4. Letzte Check-Ins für GPS-Positionen (letzte 4 Stunden)
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)
  const recentCheckIns = await prisma.checkIn.findMany({
    where: {
      createdAt: { gte: fourHoursAgo },
      latitude: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      mitarbeiterId: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
  })

  // Maps für schnelleren Zugriff
  const alleinarbeitMap = new Map(
    alleinarbeitSessions.map((a) => [String(a.mitarbeiterId), a])
  )
  const sosMap = new Map(
    sosEvents.map((s) => [s.mitarbeiterId, s])
  )
  const gpsMap = new Map<string, { latitude: number | null; longitude: number | null; createdAt: Date }>()
  for (const checkIn of recentCheckIns) {
    const maId = String(checkIn.mitarbeiterId)
    if (!gpsMap.has(maId)) {
      gpsMap.set(maId, {
        latitude: checkIn.latitude,
        longitude: checkIn.longitude,
        createdAt: checkIn.createdAt,
      })
    }
  }

  // 5. Status für jeden Mitarbeiter berechnen
  const teamMembers: TeamMemberLive[] = mitarbeiter.map((m) => {
    const alleinarbeit = alleinarbeitMap.get(m.id)
    const sos = sosMap.get(m.id)
    const lastGPS = gpsMap.get(m.id)

    // Status-Logik: SOS > Overdue > OK > Offline
    let status: TeamMemberStatus = "offline"
    let latitude: number | null = null
    let longitude: number | null = null
    let gpsTimestamp: string | null = null
    let gpsAccuracy: number | null = null

    // SOS hat höchste Priorität
    if (sos) {
      status = "sos"
      latitude = sos.gpsLatitude
      longitude = sos.gpsLongitude
      gpsTimestamp = sos.gpsTimestamp?.toISOString() || sos.ausgeloestAt.toISOString()
      gpsAccuracy = sos.gpsAccuracy
    } else if (alleinarbeit) {
      // Alleinarbeit aktiv
      latitude = alleinarbeit.latitude
      longitude = alleinarbeit.longitude
      
      // Prüfen ob Check-In überfällig
      if (alleinarbeit.nextCheckDue && new Date(alleinarbeit.nextCheckDue) < now) {
        status = "overdue"
      } else {
        status = "ok"
      }
      
      // GPS von letztem Check-In verwenden wenn aktueller
      if (lastGPS && alleinarbeit.lastCheckIn) {
        if (lastGPS.createdAt > new Date(alleinarbeit.lastCheckIn)) {
          latitude = lastGPS.latitude
          longitude = lastGPS.longitude
          gpsTimestamp = lastGPS.createdAt.toISOString()
          gpsAccuracy = null // Check-In hat keine Accuracy
        }
      }
    } else if (lastGPS) {
      // Hat kürzlich Check-In mit GPS → OK
      status = "ok"
      latitude = lastGPS.latitude
      longitude = lastGPS.longitude
      gpsTimestamp = lastGPS.createdAt.toISOString()
      gpsAccuracy = null
    }

    return {
      id: m.id,
      name: `${m.vorname} ${m.nachname}`,
      rolle: m.rolle,
      telefon: m.mobil || m.telefon,
      status,
      latitude,
      longitude,
      gpsTimestamp,
      gpsAccuracy,
      aktiverEinsatzId: alleinarbeit?.einsatzId?.toString() || sos?.aktiverEinsatzId || null,
      aktiverEinsatzName: alleinarbeit?.einsatzName || sos?.aktiverEinsatzName || null,
      alleinarbeitAktiv: !!alleinarbeit,
      checkIntervalMin: alleinarbeit?.checkIntervalMin || null,
      lastCheckIn: alleinarbeit?.lastCheckIn?.toISOString() || null,
      nextCheckDue: alleinarbeit?.nextCheckDue?.toISOString() || null,
      aktiverSOSEventId: sos?.eventId || null,
      sosAusgeloestAt: sos?.ausgeloestAt?.toISOString() || null,
    }
  })

  // Sortieren: SOS > Overdue > OK > Offline
  const statusOrder: Record<TeamMemberStatus, number> = {
    sos: 0,
    overdue: 1,
    ok: 2,
    offline: 3,
  }
  teamMembers.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return teamMembers
}

// SSE Encoder
function createSSEMessage(data: object, eventType: string = "message"): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
}

// GET Handler — SSE oder Snapshot
export async function GET(req: NextRequest) {
  // Auth prüfen
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Nur Admins und Gruppenführer
  const userRole = (session.user as any)?.role || ""
  const allowedRoles = ["ka_admin", "ka_gruppenführer", "admin"]
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const isSnapshot = searchParams.get("snapshot") === "true"

  // Snapshot-Modus: Einmalabfrage
  if (isSnapshot) {
    try {
      const team = await getTeamLiveStatus()
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        team,
        stats: {
          total: team.length,
          sos: team.filter((t) => t.status === "sos").length,
          overdue: team.filter((t) => t.status === "overdue").length,
          ok: team.filter((t) => t.status === "ok").length,
          offline: team.filter((t) => t.status === "offline").length,
        },
      })
    } catch (error) {
      console.error("[TeamLiveStatus] Error:", error)
      return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
  }

  // SSE-Modus: Stream
  const encoder = new TextEncoder()
  let isConnected = true

  const stream = new ReadableStream({
    async start(controller) {
      // Initial data
      try {
        const team = await getTeamLiveStatus()
        const initMsg = createSSEMessage({ type: "init", team }, "team-status")
        controller.enqueue(encoder.encode(initMsg))
      } catch (error) {
        console.error("[TeamLiveStatus SSE] Init error:", error)
      }

      // Poll every 10 seconds
      const pollInterval = setInterval(async () => {
        if (!isConnected) {
          clearInterval(pollInterval)
          return
        }

        try {
          const team = await getTeamLiveStatus()
          const updateMsg = createSSEMessage({ type: "update", team }, "team-status")
          controller.enqueue(encoder.encode(updateMsg))
        } catch (error) {
          console.error("[TeamLiveStatus SSE] Poll error:", error)
        }
      }, 10000)

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        if (!isConnected) {
          clearInterval(heartbeat)
          return
        }
        controller.enqueue(encoder.encode(": heartbeat\n\n"))
      }, 30000)

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        isConnected = false
        clearInterval(pollInterval)
        clearInterval(heartbeat)
        controller.close()
      })
    },
    cancel() {
      isConnected = false
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
