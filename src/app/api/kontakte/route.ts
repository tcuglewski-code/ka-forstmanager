import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { stripHtml } from "@/lib/sanitize"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const typ = searchParams.get("typ")
  const search = searchParams.get("search")

  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  const where = {
    ...(typ ? { typ } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { forstamt: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.kontakt.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.kontakt.count({ where }),
  ])
  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const kontakt = await prisma.kontakt.create({
      data: {
        name: stripHtml(body.name),
        typ: body.typ ?? "sonstig",
        telefon: body.telefon ?? null,
        email: body.email ?? null,
        forstamt: stripHtml(body.forstamt) || null,
        revier: stripHtml(body.revier) || null,
        adresse: stripHtml(body.adresse) || null,
        notizen: stripHtml(body.notizen) || null,
      },
    })
    return NextResponse.json(kontakt, { status: 201 })
  } catch (error) {
    console.error("[Kontakte POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
