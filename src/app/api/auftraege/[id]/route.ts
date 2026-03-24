import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: {
      saison: true,
      gruppe: true,
      abnahmen: true,
      protokolle: true,
      rechnungen: true,
    },
  })
  if (!auftrag) return NextResponse.json({ error: "Not found" }, { status: 404 })
  // wizardDaten is already included via findUnique (no select restriction)
  return NextResponse.json(auftrag)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    // Build update data, only include fields that are present in the body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}

    const allowedFields = [
      "titel", "typ", "status", "beschreibung", "standort", "bundesland",
      "waldbesitzer", "waldbesitzerEmail", "waldbesitzerTelefon",
      "baumarten", "zeitraum", "notizen", "neuFlag",
      "saisonId", "gruppeId",
    ]

    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field]
      }
    }

    if ("flaeche_ha" in body) {
      data.flaeche_ha = body.flaeche_ha != null ? parseFloat(body.flaeche_ha) : null
    }
    if ("startDatum" in body) {
      data.startDatum = body.startDatum ? new Date(body.startDatum) : null
    }
    if ("endDatum" in body) {
      data.endDatum = body.endDatum ? new Date(body.endDatum) : null
    }

    const auftrag = await prisma.auftrag.update({
      where: { id },
      data,
      include: {
        saison: { select: { id: true, name: true } },
        gruppe: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(auftrag)
  } catch (error) {
    console.error("[Auftraege PATCH]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.auftrag.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Auftraege DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
