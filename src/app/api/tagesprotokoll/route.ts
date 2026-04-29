import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getGruppenIdsForUser } from '@/lib/auth-helpers'
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email
  const userId = (user as { id?: string; sub?: string }).id || (user as { sub?: string }).sub
  const gruppenIds = await getGruppenIdsForUser(userEmail, userRole)
  const hasRestriction = gruppenIds.length > 0

  const auftragId = req.nextUrl.searchParams.get('auftragId')
  const gruppeId = req.nextUrl.searchParams.get('gruppeId')
  const status = req.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (auftragId) where.auftragId = auftragId
  if (gruppeId) where.gruppeId = gruppeId
  if (status) where.status = status

  // Role-based: GF/MA see protocols for their group's Aufträge OR ones they created
  if (hasRestriction) {
    where.OR = [
      { auftrag: { gruppeId: { in: gruppenIds } } },
      ...(userId ? [{ erstellerId: userId }] : []),
    ]
  }

  const protokolle = await prisma.tagesprotokoll.findMany({
    where,
    orderBy: { datum: 'desc' },
    include: {
      auftrag: {
        select: { titel: true, nummer: true, waldbesitzer: true, standort: true }
      },
      items: true,
    }
  })

  // FM-15: Doppelte Protokolle erkennen (gleicher Tag + Auftrag)
  const dupKeyCount = new Map<string, number>()
  for (const p of protokolle) {
    if (!p.auftragId) continue
    const key = `${p.auftragId}_${new Date(p.datum).toISOString().split('T')[0]}`
    dupKeyCount.set(key, (dupKeyCount.get(key) || 0) + 1)
  }
  const result = protokolle.map(p => {
    if (!p.auftragId) return { ...p, isDuplicate: false }
    const key = `${p.auftragId}_${new Date(p.datum).toISOString().split('T')[0]}`
    return { ...p, isDuplicate: (dupKeyCount.get(key) || 0) > 1 }
  })

  return NextResponse.json(result)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email
  const gruppenIds = await getGruppenIdsForUser(userEmail, userRole)
  const hasRestriction = gruppenIds.length > 0

  const data = await req.json()

  // Role-based: GF/MA can only create protocols for their group's Aufträge
  if (hasRestriction && data.auftragId) {
    const auftrag = await prisma.auftrag.findUnique({
      where: { id: data.auftragId },
      select: { gruppeId: true },
    })
    if (!auftrag || !auftrag.gruppeId || !gruppenIds.includes(auftrag.gruppeId)) {
      return NextResponse.json({ error: 'Keine Berechtigung für diesen Auftrag' }, { status: 403 })
    }
  }

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

  // FM-10: Pflanzrate Plausibilitätsprüfung (Warnung, nicht blockierend)
  const totalPflanzen = data.gepflanztGesamt || ((data.stk_pflanzung || 0) + (data.stk_pflanzung_mit_bohrer || 0))
  if (totalPflanzen > 0 && mitarbeiterAnzahl > 0) {
    let nettoStunden = 0
    if (data.arbeitsbeginn && data.arbeitsende) {
      const beginn = new Date(`1970-01-01T${data.arbeitsbeginn}`)
      const ende = new Date(`1970-01-01T${data.arbeitsende}`)
      let diff = (ende.getTime() - beginn.getTime()) / (1000 * 60 * 60)
      if (diff < 0) diff += 24
      nettoStunden = diff - (data.pauseMinuten || 0) / 60
    } else if (data.zeitBeginn && data.zeitEnde) {
      // Legacy-Feld-Fallback
      const beginn = new Date(data.zeitBeginn)
      const ende = new Date(data.zeitEnde)
      let diff = (ende.getTime() - beginn.getTime()) / (1000 * 60 * 60)
      if (diff < 0) diff += 24
      nettoStunden = diff - (data.pausezeit || 0) / 60
    }
    if (nettoStunden > 0) {
      const rate = totalPflanzen / (mitarbeiterAnzahl * nettoStunden)
      if (rate > 70) {
        warnings.push(`Sehr hohe Pflanzrate (${Math.round(rate)} Pfl/h/MA). Bitte prüfen.`)
      } else if (rate < 5) {
        warnings.push(`Sehr geringe Pflanzrate (${Math.round(rate)} Pfl/h/MA). Bitte prüfen.`)
      }
    }
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

  // F-3: Items aus Request extrahieren
  const itemsData = Array.isArray(data.items) ? data.items : []

  // Whitelist: nur Felder die im Prisma-Schema existieren
  const protokoll = await prisma.tagesprotokoll.create({
    data: {
      auftragId: data.auftragId,
      gruppeId: data.gruppeId ?? null,
      datum: data.datum ? new Date(data.datum) : new Date(),
      ersteller: data.ersteller ?? '',
      erstellerId: (user as { id?: string })?.id ?? null,
      status: data.status || 'entwurf',
      eingereichtAm: data.eingereichtAm ? new Date(data.eingereichtAm) : null,
      // Arbeitszeit
      arbeitsbeginn: data.arbeitsbeginn ?? null,
      arbeitsende: data.arbeitsende ?? null,
      pauseMinuten: data.pauseMinuten ?? null,
      // Fläche & Leistung
      flaecheBearbeitetHa: data.flaecheBearbeitetHa ?? null,
      abschnitt: data.abschnitt ?? null,
      // Pflanzung
      gepflanztGesamt: data.gepflanztGesamt ?? null,
      gepflanzt: data.gepflanzt ?? null,
      pflanzDetails: data.pflanzDetails ?? null,
      pflanzverband: data.pflanzverband ?? null,
      pflanztiefe: data.pflanztiefe ?? null,
      // Boden & Standort
      bodenVorbereitung: data.bodenVorbereitung ?? null,
      bodenbeschaffenheit: data.bodenbeschaffenheit ?? null,
      hangneigung: data.hangneigung ?? null,
      // Witterung
      witterung: data.witterung ?? null,
      temperaturMin: data.temperaturMin ?? null,
      temperaturMax: data.temperaturMax ?? null,
      wind: data.wind ?? null,
      frost: data.frost ?? null,
      // GPS
      gpsStartLat: data.gpsStartLat ?? null,
      gpsStartLon: data.gpsStartLon ?? null,
      gpsEndLat: data.gpsEndLat ?? null,
      gpsEndLon: data.gpsEndLon ?? null,
      gpsTrack: data.gpsTrack ?? null,
      // Team
      mitarbeiterAnzahl: data.mitarbeiterAnzahl ?? null,
      mitarbeiterListe: data.mitarbeiterListe ?? null,
      // Material & Maschinen
      materialVerbraucht: data.materialVerbraucht ?? null,
      maschinenEinsatz: data.maschinenEinsatz ?? null,
      // Qualitätskontrolle
      ausfaelleAnzahl: data.ausfaelleAnzahl ?? null,
      ausfaelleGrund: data.ausfaelleGrund ?? null,
      nachpflanzungNoetig: data.nachpflanzungNoetig ?? null,
      qualitaetsBewertung: data.qualitaetsBewertung ?? null,
      // Protokoll & Notizen
      bericht: data.bericht ?? '',
      besonderheiten: data.besonderheiten ?? null,
      naechsteSchritte: data.naechsteSchritte ?? null,
      waldbesitzerAnwesend: data.waldbesitzerAnwesend ?? null,
      waldbesitzerNotiz: data.waldbesitzerNotiz ?? null,
      // Dokumentation
      fotos: data.fotos ?? null,
      unterschriftGf: data.unterschriftGf ?? null,
      // Legacy-Felder
      kommentar: data.kommentar ?? null,
      forstamt: data.forstamt ?? null,
      revier: data.revier ?? null,
      revierleiter: data.revierleiter ?? null,
      abteilung: data.abteilung ?? null,
      waldbesitzerName: data.waldbesitzerName ?? null,
      pausezeit: data.pausezeit ?? null,
      std_einschlag: data.std_einschlag ?? null,
      std_handpflanzung: data.std_handpflanzung ?? null,
      stk_pflanzung: data.stk_pflanzung ?? null,
      std_zum_bohrer: data.std_zum_bohrer ?? null,
      std_mit_bohrer: data.std_mit_bohrer ?? null,
      stk_pflanzung_mit_bohrer: data.stk_pflanzung_mit_bohrer ?? null,
      std_freischneider: data.std_freischneider ?? null,
      std_motorsaege: data.std_motorsaege ?? null,
      std_wuchshuellen: data.std_wuchshuellen ?? null,
      stk_wuchshuellen: data.stk_wuchshuellen ?? null,
      std_netze_staebe_spiralen: data.std_netze_staebe_spiralen ?? null,
      stk_netze_staebe_spiralen: data.stk_netze_staebe_spiralen ?? null,
      std_zaunbau: data.std_zaunbau ?? null,
      stk_drahtverbinder: data.stk_drahtverbinder ?? null,
      lfm_zaunbau: data.lfm_zaunbau ?? null,
      std_nachbesserung: data.std_nachbesserung ?? null,
      stk_nachbesserung: data.stk_nachbesserung ?? null,
      std_sonstige_arbeiten: data.std_sonstige_arbeiten ?? null,
      // F-3: Protokoll-Items (Dienstleistungen)
      ...(itemsData.length > 0 && {
        items: {
          create: itemsData.map((item: { dienstleistung: string; flaeche?: number; anzahlPflanzen?: number; stunden?: number; bemerkung?: string }) => ({
            dienstleistung: item.dienstleistung,
            flaeche: item.flaeche ?? null,
            anzahlPflanzen: item.anzahlPflanzen ?? null,
            stunden: item.stunden ?? null,
            bemerkung: item.bemerkung ?? null,
          })),
        },
      }),
    },
    include: { items: true },
  })

  return NextResponse.json({ ...protokoll, warnings }, { status: 201 })
})
