import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const monat = searchParams.get("monat")
  const jahr = searchParams.get("jahr")
  const heute = new Date()
  const m = monat ? parseInt(monat) : heute.getMonth() + 1
  const y = jahr ? parseInt(jahr) : heute.getFullYear()
  const von = new Date(y, m - 1, 1)
  const bis = new Date(y, m, 1)
  const stunden = await prisma.stundeneintrag.findMany({
    where: { datum: { gte: von, lt: bis } },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true, stundenlohn: true } } },
  })
  // Group by Mitarbeiter
  const grouped: Record<string, { mitarbeiter: { vorname: string; nachname: string; stundenlohn: number | null }; stunden: number; brutto: number }> = {}
  for (const s of stunden) {
    const key = s.mitarbeiterId
    if (!grouped[key]) {
      grouped[key] = { mitarbeiter: s.mitarbeiter, stunden: 0, brutto: 0 }
    }
    grouped[key].stunden += s.stunden
    grouped[key].brutto += s.stunden * (s.mitarbeiter.stundenlohn ?? 0)
  }
  return NextResponse.json({ monat: m, jahr: y, mitarbeiter: Object.values(grouped) })
}
