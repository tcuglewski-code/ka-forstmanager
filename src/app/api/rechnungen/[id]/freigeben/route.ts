/**
 * A8 Rechnungs-Agent — Freigabe durch Vorgesetzten (REC-013)
 *
 * POST /api/rechnungen/:id/freigeben
 *
 * Setzt die GoBD-Unveränderlichkeit (lockedAt) und markiert die Rechnung als
 * freigegeben. Ab hier sind keine inhaltlichen Änderungen mehr zulässig —
 * Korrekturen nur via Storno/Gegenbuchung (REC-019).
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdminOrGF } from "@/lib/permissions"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const rechnung = await prisma.rechnung.findUnique({
    where: { id },
    select: { id: true, nummer: true, status: true, lockedAt: true, deletedAt: true, freigegebenAm: true },
  })
  if (!rechnung) return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
  if (rechnung.deletedAt) return NextResponse.json({ error: "Rechnung ist gelöscht" }, { status: 400 })
  if (rechnung.status === "storniert") return NextResponse.json({ error: "Stornierte Rechnung kann nicht freigegeben werden" }, { status: 400 })
  if (rechnung.freigegebenAm) {
    return NextResponse.json({ error: "Rechnung ist bereits freigegeben", freigegebenAm: rechnung.freigegebenAm }, { status: 409 })
  }

  const userId = session.user?.id ?? null
  const userName = session.user?.name ?? null
  const jetzt = new Date()

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.rechnung.update({
        where: { id },
        data: {
          status: "freigegeben",
          freigegebenVon: userId,
          freigegebenAm: jetzt,
          lockedAt: rechnung.lockedAt ?? jetzt, // GoBD-Lock setzen, falls noch offen
          lockedBy: rechnung.lockedAt ? undefined : (userId ?? "SYSTEM"),
          lockReason: rechnung.lockedAt ? undefined : "GoBD-Compliance: Freigabe durch Vorgesetzten",
        },
      })

      await tx.rechnungAuditLog.create({
        data: {
          rechnungId: id,
          action: "FREIGABE",
          field: "status",
          oldValue: JSON.stringify(rechnung.status),
          newValue: JSON.stringify({ status: "freigegeben", lockedAt: r.lockedAt }),
          userId,
          userName,
        },
      })

      return r
    })

    return NextResponse.json({ ok: true, rechnung: { id: updated.id, nummer: updated.nummer, status: updated.status, freigegebenAm: updated.freigegebenAm, lockedAt: updated.lockedAt } })
  } catch (error) {
    console.error("[A8-FREIGEBEN]", error)
    return NextResponse.json({ error: "Fehler bei der Freigabe" }, { status: 500 })
  }
}
