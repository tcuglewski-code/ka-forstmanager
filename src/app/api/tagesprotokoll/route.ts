import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
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
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()

  // FM-08: Server-seitige Validierung (BLOCKIEREND — nicht umgehbar)
  const errors: string[] = []
  const mitarbeiterAnzahl = data.mitarbeiterAnzahl || 0

  // Arbeitsstunden: max 10h pro Person + Mitternacht-Edge-Case
  if (data.arbeitsbeginn && data.arbeitsende) {
    const beginn = new Date(`1970-01-01T${data.arbeitsbeginn}`)
    const ende = new Date(`1970-01-01T${data.arbeitsende}`)
    let stundenGesamt = (ende.getTime() - beginn.getTime()) / (1000 * 60 * 60)
    // FM-06: Mitternacht-Edge-Case — wenn Ende < Beginn, über Tagesgrenze rechnen
    if (stundenGesamt < 0) {
      stundenGesamt += 24
    }
    if (stundenGesamt > 10) {
      errors.push('Arbeitszeit darf 10h pro Person nicht überschreiten')
    }
    if (stundenGesamt === 0) {
      errors.push('Arbeitsbeginn und Arbeitsende dürfen nicht identisch sein')
    }
  }

  // Alle std_-Felder: max 24h, nicht negativ
  const stdFields: Array<[string, string]> = [
    ['std_einschlag', 'Einschlag'],
    ['std_handpflanzung', 'Handpflanzung'],
    ['std_zum_bohrer', 'Handpfl. zum Bohrer'],
    ['std_mit_bohrer', 'Laufzeit Bohrer'],
    ['std_freischneider', 'Freischneider'],
    ['std_motorsaege', 'Motorsäge'],
    ['std_wuchshuellen', 'Wuchshüllen'],
    ['std_netze_staebe_spiralen', 'Netz/Stäbe/Spiralen'],
    ['std_zaunbau', 'Zaunbau'],
    ['std_nachbesserung', 'Nachbesserung'],
    ['std_sonstige_arbeiten', 'Sonstige Arbeiten'],
  ]
  for (const [field, label] of stdFields) {
    const val = data[field]
    if (val !== null && val !== undefined && (val < 0 || val > 24)) {
      errors.push(`${label}: Stundenwert muss zwischen 0 und 24 liegen (erhalten: ${val})`)
    }
  }

  // Stückzahlen: nicht negativ, max 50.000
  const stkFields: Array<[string, string]> = [
    ['stk_pflanzung', 'Stk. Pflanzung'],
    ['stk_pflanzung_mit_bohrer', 'Stk. Pflanzung m. Bohrer'],
    ['stk_wuchshuellen', 'Stk. Wuchshüllen'],
    ['stk_netze_staebe_spiralen', 'Stk. Netz/Stäbe/Spiralen'],
    ['stk_drahtverbinder', 'Stk. Drahtverbinder'],
    ['stk_nachbesserung', 'Stk. Nachbesserung'],
  ]
  for (const [field, label] of stkFields) {
    const val = data[field]
    if (val !== null && val !== undefined && (val < 0 || val > 50000)) {
      errors.push(`${label}: Wert muss zwischen 0 und 50.000 liegen (erhalten: ${val})`)
    }
  }

  // Pflanzung: max mitarbeiterAnzahl * 10h * 70 Pflanzen/h
  if (data.gepflanztGesamt) {
    const pflanzLimit = mitarbeiterAnzahl > 0
      ? mitarbeiterAnzahl * 10 * 70
      : 700
    if (data.gepflanztGesamt > pflanzLimit) {
      errors.push(`Gepflanzt (${data.gepflanztGesamt}) überschreitet Limit von ${pflanzLimit} (${mitarbeiterAnzahl || 1} MA × 10h × 70/h)`)
    }
  }

  // Konsistenzprüfung: Krank + Stunden > 0 = Widerspruch
  if (data.status === 'krank' || data.krankmeldung) {
    const hasWork = (data.arbeitsbeginn && data.arbeitsende) ||
      (data.stdFreischneider && data.stdFreischneider > 0) ||
      (data.stdMotorsaege && data.stdMotorsaege > 0) ||
      (data.gepflanztGesamt && data.gepflanztGesamt > 0)
    if (hasWork) {
      errors.push('Widerspruch: Krankmeldung mit Arbeitsstunden/Leistung ist nicht zulässig')
    }
  }

  // Bei Validierungsfehlern: 400 Bad Request
  if (errors.length > 0) {
    return NextResponse.json({
      error: 'Validierungsfehler',
      details: errors,
    }, { status: 400 })
  }

  // Plausibilitätschecks (Warnings, nicht blockierend)
  const warnings: string[] = []

  // Fläche: dynamisch basierend auf Team-Größe
  if (data.flaecheBearbeitetHa) {
    let flaecheLimit: number
    if (mitarbeiterAnzahl > 10) flaecheLimit = 5
    else if (mitarbeiterAnzahl >= 5) flaecheLimit = 2
    else if (mitarbeiterAnzahl >= 1) flaecheLimit = 0.8
    else flaecheLimit = 3
    if (data.flaecheBearbeitetHa > flaecheLimit) {
      warnings.push(`Mehr als ${flaecheLimit} ha für ${mitarbeiterAnzahl || '?'} Mitarbeiter — bitte prüfen`)
    }
  }

  // Freischneider: Warnung ab 8h (ArbSchG)
  if (data.stdFreischneider && data.stdFreischneider > 8) {
    warnings.push('Freischneider über 8h/Person — ArbSchG-Limit überschritten')
  }

  // Motorsäge: Warnung ab 6h (Vibration/Lärm)
  if (data.stdMotorsaege && data.stdMotorsaege > 6) {
    warnings.push('Motorsäge über 6h/Person — Vibrations-/Lärmgrenzwert überschritten')
  }

  // Doppeleintrag-Check
  if (data.auftragId && data.datum) {
    const existing = await prisma.tagesprotokoll.findFirst({
      where: {
        auftragId: data.auftragId,
        datum: new Date(data.datum),
        gruppeId: data.gruppeId || null,
        NOT: { status: 'abgelehnt' },
      },
    })
    if (existing) warnings.push('Protokoll für diesen Tag + Auftrag + Gruppe existiert bereits')
  }

  const protokoll = await prisma.tagesprotokoll.create({
    data: {
      ...data,
      erstellerId: (session.user as { id?: string })?.id,
      status: data.status || 'entwurf'
    }
  })

  return NextResponse.json({ ...protokoll, warnings }, { status: 201 })
})
