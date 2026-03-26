import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
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
