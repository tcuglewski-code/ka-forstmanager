import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-helpers'
import { withErrorHandler } from "@/lib/api-handler"

/**
 * POST /api/tagesprotokoll/[id]/genehmigen
 * Status → 'genehmigt' (nur Admin/Supervisor)
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

  const protokoll = await prisma.tagesprotokoll.findUnique({ where: { id } })
  if (!protokoll) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  if (protokoll.status !== 'eingereicht') {
    return NextResponse.json(
      { error: 'Nur eingereichte Protokolle können genehmigt werden' },
      { status: 400 }
    )
  }

  const updated = await prisma.tagesprotokoll.update({
    where: { id },
    data: {
      status: 'genehmigt',
      genehmigungsKommentar: body.kommentar || null,
    },
  })

  return NextResponse.json(updated)
})
