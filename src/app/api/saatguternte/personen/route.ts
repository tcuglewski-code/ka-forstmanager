import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const personen = await prisma.erntePerson.findMany({
      where: { aktiv: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, nationalitaet: true, stundenlohn: true },
    })
    return NextResponse.json(personen)
  } catch (error) {
    console.error("GET /api/saatguternte/personen error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}
