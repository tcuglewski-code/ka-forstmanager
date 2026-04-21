import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { withErrorHandler } from '@/lib/api-handler'

// DELETE /api/rechnungen/[id]/protokolle/[protokollId] — Link entfernen
export const DELETE = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; protokollId: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, protokollId } = await params

  await prisma.rechnungProtokollLink.delete({
    where: {
      rechnungId_protokollId: { rechnungId: id, protokollId },
    },
  })

  return NextResponse.json({ ok: true })
})
