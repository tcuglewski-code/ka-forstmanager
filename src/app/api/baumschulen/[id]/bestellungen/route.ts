import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Pflanzanfragen (Aufträge) die Baumarten aus dem Sortiment der Baumschule enthalten
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, name: true, userId: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const userRole = (session.user as any).role
  if (userRole === "baumschule" && baumschule.userId !== session.user.id) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  // Sortiment-Baumarten laden
  const sortiment = await prisma.baumschulPreisliste.findMany({
    where: { baumschuleId, verfuegbar: true },
    select: { baumart: true },
  })

  const baumarten = sortiment.map((s) => s.baumart.toLowerCase())

  if (baumarten.length === 0) {
    return NextResponse.json({ pflanzanfragen: [] })
  }

  // Alle aktiven Aufträge laden und clientseitig nach Baumarten-Match filtern
  // (wizardDaten ist ein JSON-Feld, daher kein direkter DB-Filter möglich)
  const auftraege = await prisma.auftrag.findMany({
    where: {
      deletedAt: null,
      status: { not: "storniert" },
    },
    orderBy: { createdAt: "desc" },
  })

  // Filter: Aufträge deren baumarten-Feld oder wizardDaten passende Baumarten enthalten
  const pflanzanfragen = auftraege.filter((a) => {
    // Check baumarten text field
    if (a.baumarten) {
      const auftragBaumarten = a.baumarten.toLowerCase()
      if (baumarten.some((b) => auftragBaumarten.includes(b))) return true
    }

    // Check wizardDaten JSON for baumarten
    if (a.wizardDaten && typeof a.wizardDaten === "object") {
      const wd = a.wizardDaten as Record<string, unknown>
      const wdStr = JSON.stringify(wd).toLowerCase()
      if (baumarten.some((b) => wdStr.includes(b))) return true
    }

    return false
  })

  // Map to a clean response format
  const result = pflanzanfragen.map((a) => ({
    id: a.id,
    titel: a.titel,
    typ: a.typ,
    status: a.status,
    flaeche_ha: a.flaeche_ha,
    standort: a.standort,
    bundesland: a.bundesland,
    waldbesitzer: a.waldbesitzer,
    baumarten: a.baumarten,
    zeitraum: a.zeitraum,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }))

  return NextResponse.json({ pflanzanfragen: result })
}
