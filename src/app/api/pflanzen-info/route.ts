import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")

  const where = search
    ? {
        OR: [
          { baumart: { contains: search, mode: "insensitive" as const } },
          { lateinischName: { contains: search, mode: "insensitive" as const } },
          { beschreibung: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const items = await prisma.pflanzenInfo.findMany({
    where,
    orderBy: { baumart: "asc" },
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.baumart?.trim()) {
      return NextResponse.json({ error: "baumart ist erforderlich" }, { status: 400 })
    }

    const item = await prisma.pflanzenInfo.create({ data: body })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (String(error).includes("Unique constraint")) {
      return NextResponse.json({ error: "Baumart existiert bereits" }, { status: 409 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
