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
  const warnings: string[] = []

  if (data.arbeitsbeginn && data.arbeitsende) {
    const beginn = new Date(`1970-01-01T${data.arbeitsbeginn}`)
    const ende = new Date(`1970-01-01T${data.arbeitsende}`)
    const stundenGesamt = (ende.getTime() - beginn.getTime()) / (1000 * 60 * 60)
    if (stundenGesamt > 16) warnings.push('Arbeitszeit über 16h — bitte prüfen')
  }

  if (data.gepflanztGesamt && data.gepflanztGesamt > 2000) {
    warnings.push('Mehr als 2000 Bäume — bitte prüfen')
  }

  if (data.flaecheBearbeitetHa && data.flaecheBearbeitetHa > 10) {
    warnings.push('Mehr als 10ha — bitte prüfen')
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
