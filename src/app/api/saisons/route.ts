import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeStrings } from "@/lib/sanitize"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const wantPagination = searchParams.has("page")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const skip = (page - 1) * limit

    const items = await prisma.saison.findMany({
      orderBy: { createdAt: "desc" },
      ...(wantPagination ? { skip, take: limit } : {}),
    })

    // Ohne expliziten page-Parameter: plain Array zurückgeben (Abwärtskompatibilität)
    if (!wantPagination) {
      return NextResponse.json(items)
    }

    const total = await prisma.saison.count()
    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Fehler beim Laden der Saisons" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const data = sanitizeStrings(await req.json())
    const saison = await prisma.saison.create({ data })
    return NextResponse.json(saison, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
