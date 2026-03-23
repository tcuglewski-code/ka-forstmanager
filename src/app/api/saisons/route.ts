import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const saisons = await prisma.saison.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(saisons)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const data = await req.json()
    const saison = await prisma.saison.create({ data })
    return NextResponse.json(saison, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
