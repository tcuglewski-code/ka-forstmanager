import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { stripHtml } from "@/lib/sanitize"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const baumschuleId = searchParams.get("baumschuleId")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  const where = {
    aktiv: true,
    ...(baumschuleId ? { baumschuleId } : {}),
    ...(search
      ? {
          OR: [
            { baumart: { contains: search, mode: "insensitive" as const } },
            { kategorie: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.produkt.findMany({
      where,
      include: { varianten: { where: { verfuegbar: true } } },
      orderBy: { baumart: "asc" },
      take: limit,
      skip,
    }),
    prisma.produkt.count({ where }),
  ])

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { varianten, ...data } = body

    const produkt = await prisma.produkt.create({
      data: {
        baumart: stripHtml(data.baumart),
        kategorie: data.kategorie || null,
        beschreibung: data.beschreibung ? stripHtml(data.beschreibung) : null,
        baumschuleId: data.baumschuleId || null,
        varianten:
          varianten?.length > 0
            ? {
                create: varianten.map(
                  (v: { name: string; hoehe?: string; qualitaet?: string; preisProStueck?: number; minBestellung?: number }) => ({
                    name: stripHtml(v.name),
                    hoehe: v.hoehe || null,
                    qualitaet: v.qualitaet || null,
                    preisProStueck: v.preisProStueck || null,
                    minBestellung: v.minBestellung || null,
                  })
                ),
              }
            : undefined,
      },
      include: { varianten: true },
    })

    return NextResponse.json(produkt, { status: 201 })
  } catch (error) {
    console.error("[Produkte POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
