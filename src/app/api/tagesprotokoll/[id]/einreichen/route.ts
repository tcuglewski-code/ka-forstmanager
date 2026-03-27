import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * POST /api/tagesprotokoll/[id]/einreichen
 * 
 * Wechselt Protokoll-Status von "entwurf" → "eingereicht"
 * und erstellt für jeden Mitarbeiter (mit mitarbeiterId) einen Stundeneintrag.
 * 
 * Voraussetzung: mitarbeiterListe im Format:
 * [{ mitarbeiterId, name, rolle, stunden, krank, maschinenzuschlag }]
 * 
 * maschinenEinsatz im Format:
 * [{ mitarbeiterId, mitarbeiterName, maschine, stunden, qualifikationId }]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const protokoll = await prisma.tagesprotokoll.findUnique({ where: { id } })
  if (!protokoll) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (protokoll.status === 'eingereicht') {
    return NextResponse.json({ error: 'Bereits eingereicht' }, { status: 400 })
  }

  const mitarbeiterListe = Array.isArray(protokoll.mitarbeiterListe)
    ? (protokoll.mitarbeiterListe as any[])
    : []
  const maschinenEinsatz = Array.isArray(protokoll.maschinenEinsatz)
    ? (protokoll.maschinenEinsatz as any[])
    : []

  // Stundeneintrag für jeden Mitarbeiter erstellen
  const stundenOps = mitarbeiterListe
    .filter((m: any) => m.mitarbeiterId && !m.krank && m.stunden > 0)
    .map((m: any) => {
      // Maschinenstunden für diesen Mitarbeiter summieren
      const maschinenstd = maschinenEinsatz
        .filter((me: any) => me.mitarbeiterId === m.mitarbeiterId)
        .reduce((sum: number, me: any) => sum + (me.stunden || 0), 0)

      return prisma.stundeneintrag.create({
        data: {
          mitarbeiterId: m.mitarbeiterId,
          datum: protokoll.datum,
          stunden: m.stunden,
          auftragId: protokoll.auftragId,
          typ: 'protokoll',
          notiz: `Tagesprotokoll ${protokoll.datum.toISOString().split('T')[0]}`,
          genehmigt: false,
          maschinenzuschlag: maschinenstd,
          stundenlohn: 0, // wird ggf. aus Mitarbeiter.stundenlohn gezogen
        },
      })
    })

  await Promise.all([
    ...stundenOps,
    prisma.tagesprotokoll.update({
      where: { id },
      data: {
        status: 'eingereicht',
        eingereichtAm: new Date(),
      },
    }),
  ])

  return NextResponse.json({ ok: true, stundeneintraege: stundenOps.length })
}
