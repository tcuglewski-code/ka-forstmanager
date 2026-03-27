import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, E-Mail und Passwort erforderlich' }, { status: 400 })
    }

    // Prüfe ob Email schon vergeben
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'E-Mail bereits registriert' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: role || 'ka_mitarbeiter',
        active: true,
      }
    })

    // Nach User-Erstellung automatisch Mitarbeiter anlegen
    await prisma.mitarbeiter.create({
      data: {
        userId: newUser.id,
        vorname: name.split(' ')[0] || name,
        nachname: name.split(' ').slice(1).join(' ') || '',
        email: email,
        rolle: role || 'mitarbeiter',
        status: 'aktiv',
      }
    })

    return NextResponse.json(
      { ok: true, userId: newUser.id, email: newUser.email },
      { status: 201 }
    )
  } catch (error) {
    console.error('[register] Fehler:', error)
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 })
  }
}
