// Sprint FV (E3): Mangel als behoben markieren
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

interface Mangel {
  beschreibung: string
  prioritaet: string
  erledigtAm: string | null
}

// POST /api/abnahmen/[id]/maengel/behoben — Einzelnen Mangel als behoben markieren
// body: { index: number } — Index des Mangels in der Liste
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { index } = await req.json()

  const abnahme = await prisma.abnahme.findUnique({
    where: { id },
    select: { haengelListe: true, auftragId: true },
  })

  if (!abnahme) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  const maengel = (abnahme.haengelListe as Mangel[]) || []
  
  if (index < 0 || index >= maengel.length) {
    return NextResponse.json({ error: "Ungültiger Index" }, { status: 400 })
  }

  // Mangel als behoben markieren
  maengel[index].erledigtAm = new Date().toISOString()

  // Prüfen ob alle Mängel erledigt sind
  const alleErledigt = maengel.every(m => m.erledigtAm !== null)
  const neuerStatus = alleErledigt ? "abnahme" : "mängel"

  const updated = await prisma.abnahme.update({
    where: { id },
    data: {
      haengelListe: maengel,
      status: neuerStatus,
    },
  })

  // Auftrag-Status aktualisieren
  if (abnahme.auftragId) {
    await prisma.auftrag.update({
      where: { id: abnahme.auftragId },
      data: { status: alleErledigt ? "abnahme" : "maengel_offen" },
    })
  }

  return NextResponse.json({
    abnahme: updated,
    alleErledigt,
    nachricht: alleErledigt
      ? "Alle Mängel behoben — Abnahme kann fortgesetzt werden"
      : "Mangel als behoben markiert",
  })
}
