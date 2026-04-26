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
    select: {
      id: true,
      titel: true,
      waldbesitzer: true,
      gruppeId: true,
      standort: true,
      bundesland: true,
      lat: true,
      lng: true,
      wizardDaten: true,
    }
  }).catch(() => null)

  if (!auftrag) redirect('/auftraege')

  // Aus wizardDaten (JSONB) relevante Felder extrahieren
  const wizardDaten = auftrag.wizardDaten as Record<string, string> | null

  // Session-User: Rolle und Name für FIX 5
  const sessionUser = session.user as { id?: string; name?: string; email?: string; role?: string }
  const userRole = sessionUser?.role ?? 'mitarbeiter'
  const userName = sessionUser?.name ?? ''

  // Aus wizardDaten multi-Flächen: erstes Forstamt/Revier extrahieren falls nicht auf Top-Level
  const flaechen = (wizardDaten as Record<string, unknown> | null)?.flaechen as Array<Record<string, string>> | undefined
  const forstamt = wizardDaten?.forstamt || (flaechen?.[0]?.forstamt ?? '')
  const revier = wizardDaten?.revier || (flaechen?.[0]?.revier ?? '')

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-8">
      <TagesprotokollFormular
        auftragId={auftrag.id}
        auftragTitel={auftrag.titel}
        waldbesitzer={auftrag.waldbesitzer ?? undefined}
        gruppeId={auftrag.gruppeId ?? undefined}
        defaultFoerstamt={forstamt}
        defaultRevier={revier}
        defaultAbteilung={wizardDaten?.abteilung ?? ''}
        defaultRevierleiter={wizardDaten?.revierleiter ?? ''}
        defaultGpsLat={auftrag.lat ?? undefined}
        defaultGpsLon={auftrag.lng ?? undefined}
        userRole={userRole}
        userName={userName}
      />
    </div>
  )
}
