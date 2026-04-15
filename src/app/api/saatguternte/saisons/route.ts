import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const saisons = await prisma.ernteSaison.findMany({
      orderBy: { jahr: "desc" },
      select: { id: true, jahr: true, gruppenFuehrer: true },
    })
    return NextResponse.json(saisons)
  } catch (error) {
    console.error("GET /api/saatguternte/saisons error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}
