import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// F-7: Autofill Waldbesitzer-Kontaktdaten aus bisherigen Aufträgen
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")

  if (!name || name.length < 2) {
    return NextResponse.json([])
  }

  // Search previous Aufträge for matching waldbesitzer names
  const auftraege = await prisma.auftrag.findMany({
    where: {
      waldbesitzer: { contains: name, mode: "insensitive" },
      deletedAt: null,
    },
    select: {
      waldbesitzer: true,
      waldbesitzerEmail: true,
      waldbesitzerTelefon: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  })

  // Deduplicate by waldbesitzer name, keep the most recent data
  const seen = new Map<string, typeof auftraege[0]>()
  for (const a of auftraege) {
    if (!a.waldbesitzer) continue
    const key = a.waldbesitzer.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, a)
    }
  }

  return NextResponse.json(Array.from(seen.values()))
}
