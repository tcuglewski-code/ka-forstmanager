import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// POST /api/abnahmen/[id]/maengel — Mängel hinzufügen/aktualisieren
// body: { maengel: [{beschreibung, priorität: "hoch"|"mittel"|"niedrig", erledigtAm?: null}], frist?: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { maengel, frist } = await req.json()

  const updated = await prisma.abnahme.update({
    where: { id },
    data: {
      haengelListe: maengel,
      maengelFrist: frist ? new Date(frist) : null,
      status: "mängel",
    },
  })

  // Sprint FV (E3): Auftrag-Status auf "maengel_offen" setzen
  if (updated.auftragId) {
    await prisma.auftrag.update({
      where: { id: updated.auftragId },
      data: { status: "maengel_offen" },
    })
  }

  return NextResponse.json(updated)
}

// GET /api/abnahmen/[id]/maengel — Aktuelle Mängelliste abrufen
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const abnahme = await prisma.abnahme.findUnique({
    where: { id },
    select: { haengelListe: true, maengelFrist: true, status: true },
  })

  if (!abnahme) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(abnahme)
}
