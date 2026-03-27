import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
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
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()

  const protokoll = await prisma.tagesprotokoll.create({
    data: {
      ...data,
      erstellerId: (session.user as { id?: string })?.id,
      status: data.status || 'entwurf'
    }
  })

  return NextResponse.json(protokoll, { status: 201 })
}
