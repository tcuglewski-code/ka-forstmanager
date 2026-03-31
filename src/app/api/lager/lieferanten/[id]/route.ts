// KL-2: Einzelner Lieferant API
// GET /api/lager/lieferanten/[id] — Lieferant abrufen
// PATCH /api/lager/lieferanten/[id] — Lieferant aktualisieren
// DELETE /api/lager/lieferanten/[id] — Lieferant löschen

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Einzelnen Lieferanten abrufen
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await auth()
    
    const { id } = await params

    const lieferant = await prisma.lieferant.findUnique({
      where: { id },
      include: {
        artikel: {
          select: { id: true, name: true, artikelnummer: true },
        },
      },
    })

    if (!lieferant) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(lieferant)
  } catch (error) {
    console.error("[Lieferant GET] Fehler:", error)
    return NextResponse.json({ error: "Abruf fehlgeschlagen" }, { status: 500 })
  }
}

// PATCH — Lieferant aktualisieren
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await auth()
    
    const { id } = await params
    const body = await req.json()

    const lieferant = await prisma.lieferant.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        email: body.email !== undefined ? body.email : undefined,
        telefon: body.telefon !== undefined ? body.telefon : undefined,
        website: body.website !== undefined ? body.website : undefined,
        adresse: body.adresse !== undefined ? body.adresse : undefined,
        plz: body.plz !== undefined ? body.plz : undefined,
        ort: body.ort !== undefined ? body.ort : undefined,
        land: body.land !== undefined ? body.land : undefined,
        notizen: body.notizen !== undefined ? body.notizen : undefined,
        aktiv: body.aktiv !== undefined ? body.aktiv : undefined,
      },
    })

    return NextResponse.json(lieferant)
  } catch (error) {
    console.error("[Lieferant PATCH] Fehler:", error)
    return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 })
  }
}

// DELETE — Lieferant löschen
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await auth()
    
    const { id } = await params

    await prisma.lieferant.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Lieferant DELETE] Fehler:", error)
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 })
  }
}
