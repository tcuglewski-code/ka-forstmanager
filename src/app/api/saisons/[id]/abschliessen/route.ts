import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const saison = await prisma.saison.findUnique({ where: { id } })
  if (!saison) return NextResponse.json({ error: "Saison nicht gefunden" }, { status: 404 })

  if (saison.status === "abgeschlossen") {
    return NextResponse.json({ error: "Saison ist bereits abgeschlossen" }, { status: 400 })
  }

  // Statistiken für Abschluss-Report sammeln
  const auftraege = await prisma.auftrag.findMany({ where: { saisonId: id } })
  const auftragIds = auftraege.map((a) => a.id)

  const [stunden, rechnungen] = await Promise.all([
    auftragIds.length > 0
      ? prisma.stundeneintrag.findMany({ where: { auftragId: { in: auftragIds } } })
      : [],
    auftragIds.length > 0
      ? prisma.rechnung.findMany({ where: { auftragId: { in: auftragIds } } })
      : [],
  ])

  const gesamtStunden = (stunden as { stunden: number }[]).reduce((s, e) => s + (e.stunden ?? 0), 0)
  const gesamtUmsatz = (rechnungen as { betrag: number; status: string }[]).reduce((s, r) => s + (r.betrag ?? 0), 0)

  // Saison als abgeschlossen markieren
  const updatedSaison = await prisma.saison.update({
    where: { id },
    data: { status: "abgeschlossen" },
  })

  return NextResponse.json({
    saison: updatedSaison,
    report: {
      auftraege: auftraege.length,
      abgeschlossen: auftraege.filter((a) => a.status === "abgeschlossen").length,
      gesamtStunden,
      gesamtUmsatz,
      offeneRechnungen: (rechnungen as { status: string }[]).filter((r) => r.status === "offen").length,
    },
  })
}
