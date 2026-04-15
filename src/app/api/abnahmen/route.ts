/**
 * Abnahme-Berechtigungen:
 * - Abnahme erstellen (POST): alle eingeloggten Nutzer (Admin, Gruppenführer, Mitarbeiter)
 * - Abnahme lesen (GET): alle eingeloggten Nutzer
 * - Abnahme bearbeiten (PUT): Admin + Gruppenführer
 * - Abnahme bestätigen: Admin + Gruppenführer
 * - Abnahme löschen (DELETE): nur Admin
 *
 * Prinzip: Flexibilität und Modularität — kein zentraler Admin-Engpass
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const auftragId = searchParams.get("auftragId")
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (auftragId) where.auftragId = auftragId
  const data = await prisma.abnahme.findMany({
    where,
    include: { auftrag: { select: { id: true, titel: true } } },
    orderBy: { datum: "desc" },
  })
  return NextResponse.json(data)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const abnahme = await prisma.abnahme.create({
    data: {
      auftragId: body.auftragId,
      datum: body.datum ? new Date(body.datum) : new Date(),
      // Förster
      foersterId: body.foersterId ?? null,
      foersterName: body.foersterName ?? null,
      foersterEmail: body.foersterEmail ?? null,
      foersterTelefon: body.foersterTelefon ?? null,
      // Status
      status: body.status ?? "offen",
      // Details
      notizen: body.notizen ?? null,
      abnahmeProtokoll: body.abnahmeProtokoll ?? null,
      // Mängel
      haengelListe: body.haengelListe ?? undefined,
      maengelFrist: body.maengelFrist ? new Date(body.maengelFrist) : null,
      // GPS
      gpsLat: body.gpsLat ?? null,
      gpsLon: body.gpsLon ?? null,
      // Dokumentation
      fotos: body.fotos ?? undefined,
      signaturUrl: body.signaturUrl ?? null,
      pdfUrl: body.pdfUrl ?? null,
      // Freigabe
      rechnungFreigegeben: body.rechnungFreigegeben ?? false,
    },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  return NextResponse.json(abnahme, { status: 201 })
})
