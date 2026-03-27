import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const kategorie = (formData.get('kategorie') as string) || 'sonstiges'
  const jahr = parseInt((formData.get('jahr') as string) || String(new Date().getFullYear()))
  const beschreibung = (formData.get('beschreibung') as string) || ''
  const vertraulich = formData.get('vertraulich') === 'true'

  if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })

  // Mitarbeiter-Info holen
  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id } })
  if (!mitarbeiter) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })

  // Nextcloud-Pfad aufbauen
  const safeName = `${mitarbeiter.vorname}_${mitarbeiter.nachname}`.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `${jahr}_${kategorie}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const ncFolder = `/Koch-Aufforstung/Mitarbeiter/${safeName}`
  const ncPath = `${ncFolder}/${fileName}`

  // WebDAV Upload
  const buffer = Buffer.from(await file.arrayBuffer())
  const ncBase = 'http://187.124.18.244:32774/remote.php/dav/files/polskagenetic'
  const auth64 = Buffer.from('polskagenetic:Sz9S4-2XZpG-HjzXc-pPQy8-38THR').toString('base64')

  // Ordner erstellen (ignoriere Fehler wenn Ordner existiert)
  await fetch(`${ncBase}${ncFolder}`, {
    method: 'MKCOL',
    headers: { Authorization: `Basic ${auth64}` }
  }).catch(() => {})

  // Datei hochladen
  const uploadRes = await fetch(`${ncBase}${ncPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${auth64}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: buffer
  })

  if (!uploadRes.ok) {
    return NextResponse.json({ error: `Nextcloud Upload fehlgeschlagen: ${uploadRes.status}` }, { status: 500 })
  }

  // In DB speichern
  const doc = await prisma.dokument.create({
    data: {
      name: file.name,
      typ: kategorie,
      kategorie,
      jahr,
      mitarbeiterId: id,
      nextcloudPath: ncPath,
      url: `${ncBase}${ncPath}`,
      vertraulich,
      groesse: file.size,
      mimeType: file.type,
      beschreibung,
      hochgeladenVon: (session as any).user?.name || 'System',
    }
  })

  return NextResponse.json({ doc, nextcloudPath: ncPath }, { status: 201 })
}
