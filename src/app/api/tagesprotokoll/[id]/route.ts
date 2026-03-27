import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const p = await prisma.tagesprotokoll.findUnique({
    where: { id },
    include: {
      auftrag: {
        select: {
          titel: true,
          nummer: true,
          waldbesitzer: true,
          waldbesitzerEmail: true,
          waldbesitzerTelefon: true,
          standort: true,
          flaeche_ha: true
        }
      }
    }
  })

  if (!p) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await req.json()

  // Automatisch eingereichtAm setzen wenn Status auf 'eingereicht' wechselt
  if (data.status === 'eingereicht' && !data.eingereichtAm) {
    data.eingereichtAm = new Date()
  }

  const p = await prisma.tagesprotokoll.update({
    where: { id },
    data
  })

  return NextResponse.json(p)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.tagesprotokoll.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
