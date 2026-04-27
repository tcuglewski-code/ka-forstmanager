import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-helpers'
import { withErrorHandler } from "@/lib/api-handler"

/**
 * POST /api/tagesprotokoll/[id]/ablehnen
 * Status → 'abgelehnt' (nur Admin/Supervisor, Kommentar Pflicht)
 */
export const POST = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (user as { role?: string })?.role
  if (role !== 'admin' && role !== 'ka_admin' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  if (!body.kommentar || typeof body.kommentar !== 'string' || !body.kommentar.trim()) {
    return NextResponse.json(
      { error: 'Kommentar ist Pflicht bei Ablehnung' },
      { status: 400 }
    )
  }

  const protokoll = await prisma.tagesprotokoll.findUnique({ where: { id } })
  if (!protokoll) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  if (protokoll.status !== 'eingereicht') {
    return NextResponse.json(
      { error: 'Nur eingereichte Protokolle können abgelehnt werden' },
      { status: 400 }
    )
  }

  const updated = await prisma.tagesprotokoll.update({
    where: { id },
    data: {
      status: 'abgelehnt',
      genehmigungsKommentar: body.kommentar.trim(),
      lockedAt: null,
      lockedBy: null,
    },
  })

  return NextResponse.json(updated)
})
