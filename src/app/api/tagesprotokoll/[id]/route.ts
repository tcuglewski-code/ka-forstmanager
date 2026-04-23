import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
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
})

export const PUT = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Lock-Guard: gesperrte Protokolle können nicht bearbeitet werden
  const existing = await prisma.tagesprotokoll.findUnique({ where: { id }, select: { lockedAt: true, status: true } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (existing.lockedAt) {
    return NextResponse.json({ error: 'Protokoll ist gesperrt (eingereicht/genehmigt)' }, { status: 423 })
  }

  const data = await req.json()

  // Validierung: std_-Felder max 24h, nicht negativ
  const errors: string[] = []
  const stdFields: Array<[string, string]> = [
    ['std_einschlag', 'Einschlag'], ['std_handpflanzung', 'Handpflanzung'],
    ['std_zum_bohrer', 'Handpfl. zum Bohrer'], ['std_mit_bohrer', 'Laufzeit Bohrer'],
    ['std_freischneider', 'Freischneider'], ['std_motorsaege', 'Motorsäge'],
    ['std_wuchshuellen', 'Wuchshüllen'], ['std_netze_staebe_spiralen', 'Netz/Stäbe/Spiralen'],
    ['std_zaunbau', 'Zaunbau'], ['std_nachbesserung', 'Nachbesserung'],
    ['std_sonstige_arbeiten', 'Sonstige Arbeiten'],
  ]
  for (const [field, label] of stdFields) {
    const val = data[field]
    if (val !== null && val !== undefined && (val < 0 || val > 24)) {
      errors.push(`${label}: Stundenwert muss zwischen 0 und 24 liegen`)
    }
  }
  const stkFields: Array<[string, string]> = [
    ['stk_pflanzung', 'Stk. Pflanzung'], ['stk_pflanzung_mit_bohrer', 'Stk. Pflanzung m. Bohrer'],
    ['stk_wuchshuellen', 'Stk. Wuchshüllen'], ['stk_netze_staebe_spiralen', 'Stk. Netz/Stäbe/Spiralen'],
    ['stk_drahtverbinder', 'Stk. Drahtverbinder'], ['stk_nachbesserung', 'Stk. Nachbesserung'],
  ]
  for (const [field, label] of stkFields) {
    const val = data[field]
    if (val !== null && val !== undefined && (val < 0 || val > 50000)) {
      errors.push(`${label}: Wert muss zwischen 0 und 50.000 liegen`)
    }
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validierungsfehler', details: errors }, { status: 400 })
  }

  // Automatisch eingereichtAm setzen wenn Status auf 'eingereicht' wechselt
  if (data.status === 'eingereicht' && !data.eingereichtAm) {
    data.eingereichtAm = new Date()
  }

  const p = await prisma.tagesprotokoll.update({
    where: { id },
    data
  })

  return NextResponse.json(p)
})

export const DELETE = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.tagesprotokoll.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
