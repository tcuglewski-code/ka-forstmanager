import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * MB: Zeiterfassung Anomalie-Detection (Cron)
 *
 * GET /api/cron/check-zeiterfassung-anomalien
 * Prüft Stundeneinträge der letzten 7 Tage auf Anomalien:
 * - stunden < 4 ohne Notiz (ungewöhnlich kurzer Tag ohne Begründung)
 * - stunden > 12 (überlanger Arbeitstag)
 * - stunden > 6 ohne Pause-Eintrag am selben Tag (Arbeitszeitgesetz-Verstoß)
 *
 * Anomalien werden als ActivityLog mit action "ZEITERFASSUNG_ANOMALIE" gespeichert.
 * Läuft täglich via Vercel Cron: 0 6 * * * (06:00 UTC)
 */

interface Anomalie {
  mitarbeiterId: string
  mitarbeiterName: string
  datum: string
  typ: "ZU_WENIG_STUNDEN" | "ZU_VIELE_STUNDEN" | "KEINE_PAUSE"
  details: string
  stundeneintragId: string
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Alle Arbeit-Stundeneinträge der letzten 7 Tage laden
    const eintraege = await prisma.stundeneintrag.findMany({
      where: {
        datum: { gte: sevenDaysAgo, lte: now },
        typ: "arbeit",
      },
      include: {
        mitarbeiter: {
          select: { id: true, vorname: true, nachname: true },
        },
      },
      orderBy: { datum: "desc" },
    })

    // Pause-Einträge der letzten 7 Tage laden (für Pause-Check)
    const pauseEintraege = await prisma.stundeneintrag.findMany({
      where: {
        datum: { gte: sevenDaysAgo, lte: now },
        typ: "pause",
      },
      select: {
        mitarbeiterId: true,
        datum: true,
      },
    })

    // Index: mitarbeiterId + datum-string → hat Pause
    const pauseIndex = new Set(
      pauseEintraege.map(
        (p) =>
          `${p.mitarbeiterId}_${new Date(p.datum).toISOString().slice(0, 10)}`
      )
    )

    const anomalien: Anomalie[] = []

    for (const eintrag of eintraege) {
      const datumStr = new Date(eintrag.datum).toISOString().slice(0, 10)
      const name = `${eintrag.mitarbeiter.vorname} ${eintrag.mitarbeiter.nachname}`

      // Anomalie 1: Weniger als 4 Stunden ohne Notiz
      if (eintrag.stunden < 4 && !eintrag.notiz) {
        anomalien.push({
          mitarbeiterId: eintrag.mitarbeiterId,
          mitarbeiterName: name,
          datum: datumStr,
          typ: "ZU_WENIG_STUNDEN",
          details: `${eintrag.stunden}h ohne Begründung (Notiz fehlt)`,
          stundeneintragId: eintrag.id,
        })
      }

      // Anomalie 2: Mehr als 12 Stunden
      if (eintrag.stunden > 12) {
        anomalien.push({
          mitarbeiterId: eintrag.mitarbeiterId,
          mitarbeiterName: name,
          datum: datumStr,
          typ: "ZU_VIELE_STUNDEN",
          details: `${eintrag.stunden}h überschreitet 12h-Grenze`,
          stundeneintragId: eintrag.id,
        })
      }

      // Anomalie 3: Mehr als 6 Stunden ohne Pause-Eintrag
      if (eintrag.stunden > 6) {
        const pauseKey = `${eintrag.mitarbeiterId}_${datumStr}`
        if (!pauseIndex.has(pauseKey)) {
          anomalien.push({
            mitarbeiterId: eintrag.mitarbeiterId,
            mitarbeiterName: name,
            datum: datumStr,
            typ: "KEINE_PAUSE",
            details: `${eintrag.stunden}h ohne Pause-Eintrag (ArbZG §4)`,
            stundeneintragId: eintrag.id,
          })
        }
      }
    }

    // Anomalien als ActivityLog speichern
    if (anomalien.length > 0) {
      await prisma.activityLog.createMany({
        data: anomalien.map((a) => ({
          action: "ZEITERFASSUNG_ANOMALIE",
          entityType: "Stundeneintrag",
          entityId: a.stundeneintragId,
          entityName: `${a.mitarbeiterName} — ${a.datum}`,
          metadata: JSON.stringify({
            typ: a.typ,
            details: a.details,
            mitarbeiterId: a.mitarbeiterId,
            datum: a.datum,
          }),
        })),
      })
    }

    console.log(
      `[Cron check-zeiterfassung-anomalien] ${anomalien.length} Anomalien gefunden (${eintraege.length} Einträge geprüft)`
    )

    return NextResponse.json({
      success: true,
      zeitraum: {
        von: sevenDaysAgo.toISOString().slice(0, 10),
        bis: now.toISOString().slice(0, 10),
      },
      geprüft: eintraege.length,
      anomalien: anomalien.length,
      details: {
        zuWenigStunden: anomalien.filter((a) => a.typ === "ZU_WENIG_STUNDEN")
          .length,
        zuVieleStunden: anomalien.filter((a) => a.typ === "ZU_VIELE_STUNDEN")
          .length,
        keinePause: anomalien.filter((a) => a.typ === "KEINE_PAUSE").length,
      },
    })
  } catch (error) {
    console.error("[Cron check-zeiterfassung-anomalien] Fehler:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Interner Fehler bei Anomalie-Prüfung",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
