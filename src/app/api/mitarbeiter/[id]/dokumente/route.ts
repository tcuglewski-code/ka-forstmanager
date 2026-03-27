import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const kategorie = req.nextUrl.searchParams.get('kategorie')
  const jahr = req.nextUrl.searchParams.get('jahr')

  const where: any = { mitarbeiterId: id }
  if (kategorie) where.kategorie = kategorie
  if (jahr) where.jahr = parseInt(jahr)

  // Nicht-Admin sieht keine vertraulichen Dokumente
  const user = await prisma.user.findUnique({ where: { id: (session as any).user?.id ?? '' } })
  if (user?.role !== 'ka_admin' && user?.role !== 'admin') {
    where.vertraulich = false
  }

  const docs = await prisma.dokument.findMany({
    where,
    orderBy: [{ jahr: 'desc' }, { createdAt: 'desc' }]
  })

  // Nextcloud Download-URL generieren
  const docsWithUrls = docs.map(d => ({
    ...d,
    downloadUrl: d.nextcloudPath
      ? `http://187.124.18.244:32774/remote.php/dav/files/polskagenetic${d.nextcloudPath}`
      : d.url
  }))

  return NextResponse.json(docsWithUrls)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await req.json()
  // data: { name, kategorie, jahr, nextcloudPath, url, ablaufDatum, vertraulich, groesse, mimeType, beschreibung }

  const doc = await prisma.dokument.create({
    data: {
      name: data.name,
      typ: data.kategorie || 'sonstiges',
      kategorie: data.kategorie || 'sonstiges',
      jahr: data.jahr || new Date().getFullYear(),
      mitarbeiterId: id,
      nextcloudPath: data.nextcloudPath || null,
      url: data.url || null,
      ablaufDatum: data.ablaufDatum ? new Date(data.ablaufDatum) : null,
      vertraulich: data.vertraulich ?? false,
      groesse: data.groesse || null,
      mimeType: data.mimeType || null,
      beschreibung: data.beschreibung || null,
      hochgeladenVon: (session as any).user?.name || 'System',
    }
  })

  return NextResponse.json(doc, { status: 201 })
}
