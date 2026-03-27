import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TagesprotokollFormular from '@/components/tagesprotokoll/TagesprotokollFormular'

export default async function NeuesProtokollPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    select: { id: true, titel: true, waldbesitzer: true, gruppeId: true }
  }).catch(() => null)

  if (!auftrag) redirect('/auftraege')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <TagesprotokollFormular
        auftragId={auftrag.id}
        auftragTitel={auftrag.titel}
        waldbesitzer={auftrag.waldbesitzer ?? undefined}
        gruppeId={auftrag.gruppeId ?? undefined}
      />
    </div>
  )
}
