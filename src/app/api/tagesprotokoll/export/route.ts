import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const auftragId = sp.get('auftragId')
  const vonDatum = sp.get('vonDatum')
  const bisDatum = sp.get('bisDatum')
  const status = sp.get('status')

  const where: Record<string, unknown> = {}
  if (auftragId) where.auftragId = auftragId
  if (status) where.status = status
  if (vonDatum || bisDatum) {
    where.datum = {
      ...(vonDatum ? { gte: new Date(vonDatum) } : {}),
      ...(bisDatum ? { lte: new Date(bisDatum + 'T23:59:59') } : {}),
    }
  }

  const protokolle = await prisma.tagesprotokoll.findMany({
    where,
    orderBy: { datum: 'desc' },
    include: {
      auftrag: { select: { titel: true, nummer: true } },
    },
  })

  const header = [
    'Datum', 'Auftrag', 'Auftrag-Nr', 'Ersteller', 'Arbeitsbeginn', 'Arbeitsende',
    'Pause (Min)', 'Mitarbeiter', 'Gepflanzt gesamt', 'Fläche (ha)', 'Status',
  ]

  const rows = protokolle.map((p) => [
    fmtDate(p.datum),
    escapeCSV(p.auftrag?.titel || ''),
    p.auftrag?.nummer || '',
    escapeCSV(p.ersteller || ''),
    p.arbeitsbeginn || '',
    p.arbeitsende || '',
    String(p.pauseMinuten ?? ''),
    String(p.mitarbeiterAnzahl ?? ''),
    String(p.gepflanztGesamt ?? ''),
    String(p.flaecheBearbeitetHa ?? ''),
    p.status,
  ])

  // BOM for Excel compatibility + CSV content
  const bom = '\uFEFF'
  const csv = bom + header.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n')

  const today = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="protokolle-export-${today}.csv"`,
    },
  })
}
