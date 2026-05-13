import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import {
  mapAbwesenheitToDTO,
  resolveMitarbeiterId,
} from "@/lib/urlaub-helper"

// GET /api/urlaub — Admin: alle Urlaubsanträge
// Query: ?status=beantragt|genehmigt|abgelehnt|alle
export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const status = req.nextUrl.searchParams.get("status")
    const where: { typ: string; genehmigt?: boolean } = { typ: "urlaub" }
    if (status === "genehmigt") where.genehmigt = true
    else if (status === "beantragt") where.genehmigt = false
    // 'abgelehnt' wird nicht persistiert (stub) — gibt leere Liste zurück
    if (status === "abgelehnt") {
      return NextResponse.json([])
    }

    const items = await prisma.abwesenheit.findMany({
      where,
      include: {
        mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      },
      orderBy: { von: "desc" },
      take: 200,
    })

    return NextResponse.json(items.map(mapAbwesenheitToDTO))
  } catch (error) {
    console.error("[/api/urlaub GET] Error:", error)
    return NextResponse.json([])
  }
}

// POST /api/urlaub — Neuer Urlaubsantrag
// Body: { von, bis, bemerkung? }
export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const von = body.von ? new Date(body.von) : null
    const bis = body.bis ? new Date(body.bis) : null

    if (!von || !bis || isNaN(von.getTime()) || isNaN(bis.getTime())) {
      return NextResponse.json(
        { error: "Gültiges von/bis Datum erforderlich" },
        { status: 400 }
      )
    }

    const mitarbeiterId = await resolveMitarbeiterId(
      appUser as Record<string, unknown>
    )
    if (!mitarbeiterId) {
      return NextResponse.json(
        { error: "Kein Mitarbeiter-Profil gefunden" },
        { status: 404 }
      )
    }

    const entry = await prisma.abwesenheit.create({
      data: {
        mitarbeiterId,
        von,
        bis,
        typ: "urlaub",
        notiz: body.bemerkung ?? null,
        genehmigt: false,
      },
    })

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 })
  } catch (error) {
    console.error("[/api/urlaub POST] Error:", error)
    return NextResponse.json(
      { error: "Fehler beim Anlegen des Urlaubsantrags" },
      { status: 500 }
    )
  }
}
