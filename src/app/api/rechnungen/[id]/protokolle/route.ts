import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { withErrorHandler } from '@/lib/api-handler'

// GET /api/rechnungen/[id]/protokolle — verknüpfte Protokolle einer Rechnung
export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const links = await prisma.rechnungProtokollLink.findMany({
    where: { rechnungId: id },
    include: {
      protokoll: {
        select: {
          id: true,
          datum: true,
          ersteller: true,
          status: true,
          gepflanztGesamt: true,
          flaecheBearbeitetHa: true,
          arbeitsbeginn: true,
          arbeitsende: true,
          mitarbeiterAnzahl: true,
          auftrag: { select: { titel: true, nummer: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(links.map((l) => l.protokoll))
})

// POST /api/rechnungen/[id]/protokolle — Protokoll verknüpfen
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { protokollId } = await req.json()

  if (!protokollId) {
    return NextResponse.json({ error: 'protokollId ist erforderlich' }, { status: 400 })
  }

  const link = await prisma.rechnungProtokollLink.create({
    data: { rechnungId: id, protokollId },
  })

  return NextResponse.json(link, { status: 201 })
})
