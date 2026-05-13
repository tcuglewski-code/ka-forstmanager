import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import {
  mapLagerToPflanzgut,
  pflanzgutIdToNumber,
} from "@/lib/pflanzgut-helper"

async function findArtikelByApiId(apiId: string) {
  const direct = await prisma.lagerArtikel.findUnique({ where: { id: apiId } })
  if (direct && direct.kategorie === "pflanzgut") return direct

  const numericId = Number(apiId)
  if (!Number.isFinite(numericId)) return null

  const all = await prisma.lagerArtikel.findMany({
    where: { kategorie: "pflanzgut", deletedAt: null },
    select: { id: true },
    take: 1000,
  })
  const match = all.find((a: { id: string }) => pflanzgutIdToNumber(a.id) === numericId)
  if (!match) return null
  return prisma.lagerArtikel.findUnique({ where: { id: match.id } })
}

// GET /api/pflanzgut/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const a = await findArtikelByApiId(id)
    if (!a) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    return NextResponse.json(mapLagerToPflanzgut(a))
  } catch (error) {
    console.error("[/api/pflanzgut/[id] GET] Error:", error)
    return NextResponse.json({ error: "Fehler" }, { status: 500 })
  }
}

// PATCH /api/pflanzgut/[id]
// Body: { bestand_ist?, mindestbestand?, lagerort?, name?, ... }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const target = await findArtikelByApiId(id)
    if (!target) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }

    const updated = await prisma.lagerArtikel.update({
      where: { id: target.id },
      data: {
        ...(body.bestand_ist !== undefined && { bestand: Number(body.bestand_ist) }),
        ...(body.mindestbestand !== undefined && {
          mindestbestand: Number(body.mindestbestand),
        }),
        ...(body.lagerort !== undefined && { lagerort: body.lagerort }),
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.einheit !== undefined && { einheit: String(body.einheit) }),
      },
    })

    return NextResponse.json(mapLagerToPflanzgut(updated))
  } catch (error) {
    console.error("[/api/pflanzgut/[id] PATCH] Error:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

// DELETE /api/pflanzgut/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const target = await findArtikelByApiId(id)
    if (!target) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    await prisma.lagerArtikel.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[/api/pflanzgut/[id] DELETE] Error:", error)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
