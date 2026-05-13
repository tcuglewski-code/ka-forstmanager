import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { stringIdToNumber } from "@/lib/urlaub-helper"

/**
 * Findet eine Abwesenheit über den numerischen Hash-ID-Wert,
 * den der mapAbwesenheitToDTO an die App zurückgegeben hat.
 * Falls die ID direkt ein cuid ist, wird sie direkt verwendet.
 */
async function findAbwesenheitByApiId(apiId: string) {
  // Direct cuid match
  const direct = await prisma.abwesenheit.findUnique({ where: { id: apiId } })
  if (direct) return direct

  const numericId = Number(apiId)
  if (!Number.isFinite(numericId)) return null

  const all = await prisma.abwesenheit.findMany({
    where: { typ: "urlaub" },
    select: { id: true },
    take: 1000,
  })
  const match = all.find((a: { id: string }) => stringIdToNumber(a.id) === numericId)
  if (!match) return null
  return prisma.abwesenheit.findUnique({ where: { id: match.id } })
}

// PATCH /api/urlaub/[id] — Status setzen (Admin)
// Body: { status: 'genehmigt'|'abgelehnt', admin_kommentar? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const target = await findAbwesenheitByApiId(id)
    if (!target) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }

    // 'abgelehnt' → löschen (mangels separater Status-Spalte)
    if (body.status === "abgelehnt") {
      await prisma.abwesenheit.delete({ where: { id: target.id } })
      return NextResponse.json({ success: true })
    }

    await prisma.abwesenheit.update({
      where: { id: target.id },
      data: {
        ...(body.status === "genehmigt" && { genehmigt: true }),
        ...(body.admin_kommentar !== undefined && { notiz: body.admin_kommentar }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[/api/urlaub/[id] PATCH] Error:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 }
    )
  }
}

// DELETE /api/urlaub/[id] — Antrag zurückziehen (nur beantragt)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const target = await findAbwesenheitByApiId(id)
    if (!target) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    if (target.genehmigt) {
      return NextResponse.json(
        { error: "Bereits genehmigte Anträge können nicht gelöscht werden" },
        { status: 400 }
      )
    }
    await prisma.abwesenheit.delete({ where: { id: target.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[/api/urlaub/[id] DELETE] Error:", error)
    return NextResponse.json(
      { error: "Fehler beim Löschen" },
      { status: 500 }
    )
  }
}
