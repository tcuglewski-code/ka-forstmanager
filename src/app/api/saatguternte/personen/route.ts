import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
