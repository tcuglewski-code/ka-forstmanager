import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const suche = searchParams.get("suche") || searchParams.get("search") || ""
  const rolle = searchParams.get("rolle") || ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    where: {
      AND: [
        suche
          ? {
              OR: [
                { vorname: { contains: suche, mode: "insensitive" } },
                { nachname: { contains: suche, mode: "insensitive" } },
                { email: { contains: suche, mode: "insensitive" } },
              ],
            }
          : {},
        rolle ? { rolle } : {},
      ],
    },
    orderBy: { nachname: "asc" },
    take: limit,
  })

  return NextResponse.json(mitarbeiter)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    // Pflichtfeld-Validierung (Sprint P)
    if (!body.vorname?.trim() || !body.nachname?.trim()) {
      return NextResponse.json({ error: "vorname und nachname sind Pflichtfelder" }, { status: 400 })
    }

    const mitarbeiter = await prisma.mitarbeiter.create({ data: body })
    return NextResponse.json(mitarbeiter, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
