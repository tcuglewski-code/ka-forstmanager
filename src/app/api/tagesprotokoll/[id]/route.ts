import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getGruppenIdsForUser } from '@/lib/auth-helpers'
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
          flaeche_ha: true,
          gruppeId: true,
        }
      }
    }
  })

  if (!p) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Role-based: GF/MA can only see protocols for their group's Aufträge or ones they created
  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email
  const userId = (user as { id?: string; sub?: string }).id || (user as { sub?: string }).sub
  const gruppenIds = await getGruppenIdsForUser(userEmail, userRole)
  const isCreator = userId && p.erstellerId === userId
  if (gruppenIds.length > 0 && !isCreator && (!p.auftrag?.gruppeId || !gruppenIds.includes(p.auftrag.gruppeId))) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  return NextResponse.json(p)
})

export const PUT = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Load existing protocol with auftrag.gruppeId for role check
  const existing = await prisma.tagesprotokoll.findUnique({
    where: { id },
    select: { lockedAt: true, status: true, erstellerId: true, auftrag: { select: { gruppeId: true } } },
  })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Role-based: GF/MA can only edit protocols for their group's Aufträge
  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email
  const userId = (user as { id?: string }).id
  const gruppenIds = await getGruppenIdsForUser(userEmail, userRole)
  if (gruppenIds.length > 0 && (!existing.auftrag?.gruppeId || !gruppenIds.includes(existing.auftrag.gruppeId))) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Lock-Guard: gesperrte Protokolle können nicht bearbeitet werden
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

  // Whitelist: nur Felder die im Prisma-Schema existieren
  const updateData: Record<string, unknown> = {}
  const allowedFields = [
    'auftragId', 'gruppeId', 'datum', 'ersteller', 'erstellerId', 'status', 'eingereichtAm',
    'arbeitsbeginn', 'arbeitsende', 'pauseMinuten',
    'flaecheBearbeitetHa', 'abschnitt',
    'gepflanztGesamt', 'gepflanzt', 'pflanzDetails', 'pflanzverband', 'pflanztiefe',
    'bodenVorbereitung', 'bodenbeschaffenheit', 'hangneigung',
    'witterung', 'temperaturMin', 'temperaturMax', 'wind', 'frost',
    'gpsStartLat', 'gpsStartLon', 'gpsEndLat', 'gpsEndLon', 'gpsTrack',
    'mitarbeiterAnzahl', 'mitarbeiterListe',
    'materialVerbraucht', 'maschinenEinsatz',
    'ausfaelleAnzahl', 'ausfaelleGrund', 'nachpflanzungNoetig', 'qualitaetsBewertung',
    'bericht', 'besonderheiten', 'naechsteSchritte', 'waldbesitzerAnwesend', 'waldbesitzerNotiz',
    'fotos', 'unterschriftGf', 'genehmigungsKommentar',
    'kommentar', 'forstamt', 'revier', 'revierleiter', 'abteilung', 'waldbesitzerName',
    'pausezeit',
    'std_einschlag', 'std_handpflanzung', 'stk_pflanzung',
    'std_zum_bohrer', 'std_mit_bohrer', 'stk_pflanzung_mit_bohrer',
    'std_freischneider', 'std_motorsaege',
    'std_wuchshuellen', 'stk_wuchshuellen', 'std_netze_staebe_spiralen', 'stk_netze_staebe_spiralen',
    'std_zaunbau', 'stk_drahtverbinder', 'lfm_zaunbau',
    'std_nachbesserung', 'stk_nachbesserung', 'std_sonstige_arbeiten',
  ]
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  }
  // Datum als Date-Objekt
  if (updateData.datum && typeof updateData.datum === 'string') {
    updateData.datum = new Date(updateData.datum as string)
  }
  if (updateData.eingereichtAm && typeof updateData.eingereichtAm === 'string') {
    updateData.eingereichtAm = new Date(updateData.eingereichtAm as string)
  }

  const p = await prisma.tagesprotokoll.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(p)
})

export const DELETE = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Role-based: GF/MA can only delete protocols for their group, and only own protocols
  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email
  const userId = (user as { id?: string }).id
  const gruppenIds = await getGruppenIdsForUser(userEmail, userRole)

  if (gruppenIds.length > 0) {
    const existing = await prisma.tagesprotokoll.findUnique({
      where: { id },
      select: { erstellerId: true, auftrag: { select: { gruppeId: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    if (!existing.auftrag?.gruppeId || !gruppenIds.includes(existing.auftrag.gruppeId)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }
    // Non-admins can only delete their own protocols
    if (existing.erstellerId && userId && existing.erstellerId !== userId) {
      return NextResponse.json({ error: 'Nur eigene Protokolle können gelöscht werden' }, { status: 403 })
    }
  }

  await prisma.tagesprotokoll.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
