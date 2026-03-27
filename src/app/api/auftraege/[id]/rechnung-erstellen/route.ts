import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * POST /api/auftraege/[id]/rechnung-erstellen
 * 
 * Erstellt eine Rechnung aus allen eingereichten/bestätigten Protokollen
 * eines Auftrags. Aggregiert Pflanzstückzahlen, Zaunbau (lfm) und Material.
 * 
 * Body: {
 *   mwstSatz?: number     // default 0.19
 *   rabatt?: number       // Prozent 0-100, default 0
 *   rabattGrund?: string
 *   zahlungsBedingung?: string  // default "30 Tage netto"
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let data: any = {}
  try {
    data = await req.json()
  } catch {
    // Body optional
  }

  const mwst = data.mwstSatz ?? 0.19
  const rabatt = data.rabatt ?? 0

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: {
      protokolle: {
        where: { status: { in: ['eingereicht', 'bestätigt'] } },
      },
    },
  })

  if (!auftrag) {
    return NextResponse.json({ error: 'Auftrag nicht gefunden' }, { status: 404 })
  }

  const protos = auftrag.protokolle || []

  // Aggregiere Leistungen aus allen Protokollen
  let gesamtPflanzungHand = 0
  let gesamtPflanzungBohrer = 0
  let gesamtZaunbauLfm = 0
  let gesamtWuchshuellen = 0

  for (const p of protos) {
    gesamtPflanzungHand += p.stk_pflanzung || 0
    gesamtPflanzungBohrer += p.stk_pflanzung_mit_bohrer || 0
    gesamtZaunbauLfm += p.lfm_zaunbau || 0
    gesamtWuchshuellen += p.stk_wuchshuellen || 0
  }

  // Standardpreise aus Angebot oder Defaults
  const angebot = await prisma.angebot.findFirst({ where: { auftragId: id } })
  const preisProBaum = angebot?.preisProBaum ?? 0.85

  const positionen: {
    beschreibung: string
    menge: number
    einheit: string
    preisProEinheit: number
    gesamt: number
    typ: string
  }[] = []

  if (gesamtPflanzungHand > 0 || gesamtPflanzungBohrer > 0) {
    const stk = gesamtPflanzungHand + gesamtPflanzungBohrer
    positionen.push({
      beschreibung: `Pflanzung (${stk} Stk)`,
      menge: stk,
      einheit: 'Stk',
      preisProEinheit: preisProBaum,
      gesamt: stk * preisProBaum,
      typ: 'leistung',
    })
  }

  if (gesamtZaunbauLfm > 0) {
    positionen.push({
      beschreibung: `Zaunbau (${gesamtZaunbauLfm} lfm)`,
      menge: gesamtZaunbauLfm,
      einheit: 'lfm',
      preisProEinheit: 4.5,
      gesamt: gesamtZaunbauLfm * 4.5,
      typ: 'leistung',
    })
  }

  if (gesamtWuchshuellen > 0) {
    positionen.push({
      beschreibung: `Wuchshüllen (${gesamtWuchshuellen} Stk)`,
      menge: gesamtWuchshuellen,
      einheit: 'Stk',
      preisProEinheit: 1.8,
      gesamt: gesamtWuchshuellen * 1.8,
      typ: 'material',
    })
  }

  // Wenn keine Positionen, trotzdem Pauschale anlegen
  if (positionen.length === 0) {
    positionen.push({
      beschreibung: 'Forstdienstleistungen (Pauschal)',
      menge: 1,
      einheit: 'pauschal',
      preisProEinheit: 0,
      gesamt: 0,
      typ: 'leistung',
    })
  }

  const nettoBetrag = positionen.reduce((s, p) => s + p.gesamt, 0)
  const rabattBetrag = nettoBetrag * (rabatt / 100)
  const nettoNachRabatt = nettoBetrag - rabattBetrag
  const bruttoBetrag = nettoNachRabatt * (1 + mwst)

  // Rechnungsnummer generieren
  const nummer = `RE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

  const rechnung = await prisma.rechnung.create({
    data: {
      auftragId: id,
      nummer,
      betrag: bruttoBetrag,
      nettoBetrag,
      bruttoBetrag,
      mwst,
      rabatt,
      rabattBetrag,
      rabattGrund: data.rabattGrund || null,
      zahlungsBedingung: data.zahlungsBedingung || '30 Tage netto',
      status: 'entwurf',
      rechnungsDatum: new Date(),
      faelligAm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Positionen erstellen
  await Promise.all(
    positionen.map((pos) =>
      prisma.rechnungPosition.create({
        data: {
          rechnungId: rechnung.id,
          ...pos,
        },
      })
    )
  )

  return NextResponse.json({
    rechnung,
    positionen,
    protokolleAnzahl: protos.length,
  })
}
