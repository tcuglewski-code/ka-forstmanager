import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auftragId = req.nextUrl.searchParams.get('auftragId')
  const gruppeId = req.nextUrl.searchParams.get('gruppeId')
  const status = req.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (auftragId) where.auftragId = auftragId
  if (gruppeId) where.gruppeId = gruppeId
  if (status) where.status = status

  const protokolle = await prisma.tagesprotokoll.findMany({
    where,
    orderBy: { datum: 'desc' },
    include: {
      auftrag: {
        select: { titel: true, nummer: true, waldbesitzer: true, standort: true }
      }
    }
  })

  return NextResponse.json(protokolle)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()

  // Plausibilitätschecks (Warnings, nicht blockierend)
  // Forstwirtschaftliche Richtwerte (Tomek bestätigt)
  const warnings: string[] = []
  const mitarbeiterAnzahl = data.mitarbeiterAnzahl || 0

  // Arbeitszeit: max 10h/Person/Tag
  if (data.arbeitsbeginn && data.arbeitsende) {
    const beginn = new Date(`1970-01-01T${data.arbeitsbeginn}`)
    const ende = new Date(`1970-01-01T${data.arbeitsende}`)
    const stundenGesamt = (ende.getTime() - beginn.getTime()) / (1000 * 60 * 60)
    if (stundenGesamt > 10) warnings.push('Arbeitszeit über 10h — bitte prüfen')
  }

  // Pflanzung: max 70 Pflanzen/h/Person → dynamisches Limit
  if (data.gepflanztGesamt) {
    const pflanzLimit = mitarbeiterAnzahl > 0
      ? mitarbeiterAnzahl * 10 * 70
      : 700
    if (data.gepflanztGesamt > pflanzLimit) {
      warnings.push(`Mehr als ${pflanzLimit} Pflanzen (${mitarbeiterAnzahl || 1} MA × 10h × 70/h) — bitte prüfen`)
    }
  }

  // Fläche: dynamisch basierend auf Team-Größe
  if (data.flaecheBearbeitetHa) {
    let flaecheLimit: number
    if (mitarbeiterAnzahl > 10) flaecheLimit = 5
    else if (mitarbeiterAnzahl >= 5) flaecheLimit = 2
    else if (mitarbeiterAnzahl >= 1) flaecheLimit = 0.8
    else flaecheLimit = 3 // Fallback ohne MA-Zahl
    if (data.flaecheBearbeitetHa > flaecheLimit) {
      warnings.push(`Mehr als ${flaecheLimit} ha für ${mitarbeiterAnzahl || '?'} Mitarbeiter — bitte prüfen`)
    }
  }

  // Freischneider: max 8h/Person/Tag (ArbSchG)
  if (data.stdFreischneider && data.stdFreischneider > 8) {
    warnings.push('Freischneider über 8h/Person — ArbSchG-Limit überschritten')
  }

  // Motorsäge: max 6h/Person/Tag (Vibration/Lärm-Grenzwerte)
  if (data.stdMotorsaege && data.stdMotorsaege > 6) {
    warnings.push('Motorsäge über 6h/Person — Vibrations-/Lärmgrenzwert überschritten')
  }

  // Doppeleintrag-Check
  if (data.auftragId && data.datum) {
    const existing = await prisma.tagesprotokoll.findFirst({
      where: {
        auftragId: data.auftragId,
        datum: new Date(data.datum),
        gruppeId: data.gruppeId || null,
        NOT: { status: 'abgelehnt' },
      },
    })
    if (existing) warnings.push('Protokoll für diesen Tag + Auftrag + Gruppe existiert bereits')
  }

  const protokoll = await prisma.tagesprotokoll.create({
    data: {
      ...data,
      erstellerId: (session.user as { id?: string })?.id,
      status: data.status || 'entwurf'
    }
  })

  return NextResponse.json({ ...protokoll, warnings }, { status: 201 })
})
