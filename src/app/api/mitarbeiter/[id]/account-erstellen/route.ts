import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id } })
  if (!mitarbeiter) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (mitarbeiter.userId) return NextResponse.json({ error: 'Hat bereits Account' }, { status: 400 })

  const data = await req.json() // { email?, passwort?, rolle? }
  const email = data.email || mitarbeiter.email
  if (!email) return NextResponse.json({ error: 'Keine E-Mail Adresse' }, { status: 400 })

  // Passwort: entweder angegeben oder Vorname+Geburtsjahr
  const gj = mitarbeiter.geburtsdatum ? new Date(mitarbeiter.geburtsdatum).getFullYear() : '2024'
  const defaultPw = `${mitarbeiter.vorname}${gj}!`
  const passwort = data.passwort || defaultPw
  const hash = await bcrypt.hash(passwort, 10)

  const rolle = data.rolle || mitarbeiter.rolle || 'ka_mitarbeiter'

  // Prüfe ob Email schon vergeben
  const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null)

  let user
  if (existing) {
    user = existing
  } else {
    user = await prisma.user.create({
      data: {
        name: `${mitarbeiter.vorname} ${mitarbeiter.nachname}`,
        email,
        password: hash,
        role: rolle,
        active: true,
      }
    })
  }

  // Mitarbeiter mit User verknüpfen
  await prisma.mitarbeiter.update({
    where: { id },
    data: { userId: user.id }
  })

  return NextResponse.json({
    ok: true,
    userId: user.id,
    email,
    temporaresPasswort: existing ? null : passwort,
    hinweis: existing
      ? 'Bestehender Account verknüpft'
      : `Temporäres Passwort: ${passwort} — beim ersten Login ändern lassen`
  })
}
