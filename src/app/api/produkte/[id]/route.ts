import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { stripHtml } from "@/lib/sanitize"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const produkt = await prisma.produkt.findUnique({
    where: { id },
    include: { varianten: true },
  })

  if (!produkt) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(produkt)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { varianten, ...data } = body

    if (varianten) {
      await prisma.produktVariante.deleteMany({ where: { produktId: id } })
    }

    const produkt = await prisma.produkt.update({
      where: { id },
      data: {
        ...(data.baumart !== undefined ? { baumart: stripHtml(data.baumart) } : {}),
        ...(data.kategorie !== undefined ? { kategorie: data.kategorie } : {}),
        ...(data.beschreibung !== undefined ? { beschreibung: data.beschreibung ? stripHtml(data.beschreibung) : null } : {}),
        ...(data.aktiv !== undefined ? { aktiv: data.aktiv } : {}),
        ...(varianten
          ? {
              varianten: {
                create: varianten.map(
                  (v: { name: string; hoehe?: string; qualitaet?: string; preisProStueck?: number; minBestellung?: number; verfuegbar?: boolean }) => ({
                    name: stripHtml(v.name),
                    hoehe: v.hoehe || null,
                    qualitaet: v.qualitaet || null,
                    preisProStueck: v.preisProStueck || null,
                    minBestellung: v.minBestellung || null,
                    verfuegbar: v.verfuegbar ?? true,
                  })
                ),
              },
            }
          : {}),
      },
      include: { varianten: true },
    })

    return NextResponse.json(produkt)
  } catch (error) {
    console.error("[Produkte PUT]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.produkt.update({ where: { id }, data: { aktiv: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Produkte DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
