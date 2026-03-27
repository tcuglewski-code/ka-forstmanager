import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const abnahme = await prisma.abnahme.findUnique({
    where: { id },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  if (!abnahme) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(abnahme)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.datum !== undefined) updateData.datum = new Date(body.datum)
  if (body.foersterId !== undefined) updateData.foersterId = body.foersterId
  if (body.foersterName !== undefined) updateData.foersterName = body.foersterName
  if (body.foersterEmail !== undefined) updateData.foersterEmail = body.foersterEmail
  if (body.foersterTelefon !== undefined) updateData.foersterTelefon = body.foersterTelefon
  if (body.status !== undefined) updateData.status = body.status
  if (body.notizen !== undefined) updateData.notizen = body.notizen
  if (body.abnahmeProtokoll !== undefined) updateData.abnahmeProtokoll = body.abnahmeProtokoll
  if (body.haengelListe !== undefined) updateData.haengelListe = body.haengelListe
  if (body.maengelFrist !== undefined) updateData.maengelFrist = body.maengelFrist ? new Date(body.maengelFrist) : null
  if (body.gpsLat !== undefined) updateData.gpsLat = body.gpsLat
  if (body.gpsLon !== undefined) updateData.gpsLon = body.gpsLon
  if (body.fotos !== undefined) updateData.fotos = body.fotos
  if (body.signaturUrl !== undefined) updateData.signaturUrl = body.signaturUrl
  if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl
  if (body.rechnungFreigegeben !== undefined) updateData.rechnungFreigegeben = body.rechnungFreigegeben

  // Wenn status → 'bestätigt': Rechnung automatisch freigeben
  if (body.status === "bestätigt" && body.rechnungFreigegeben !== false) {
    updateData.rechnungFreigegeben = true
    updateData.freigegebenAm = new Date()
    updateData.freigegebenVon = (session as any).user?.id

    const existing = await prisma.abnahme.findUnique({ where: { id } })
    if (existing) {
      await prisma.rechnung.updateMany({
        where: { auftragId: existing.auftragId, status: "entwurf" },
        data: { status: "freigegeben" },
      })
    }
  }

  const abnahme = await prisma.abnahme.update({
    where: { id },
    data: updateData,
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  return NextResponse.json(abnahme)
}

// Legacy PATCH — bleibt für Abwärtskompatibilität
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    await prisma.abnahme.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    console.error("[ABNAHME DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
