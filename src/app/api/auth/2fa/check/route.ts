/**
 * 2FA Check API
 * POST: Prüft ob 2FA für einen Benutzer aktiviert ist (für Login-Flow)
 * Sprint Q015: Two-Factor Authentication
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email und Passwort erforderlich' 
      }, { status: 400 })
    }

    // User laden (nur benötigte Felder)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        active: true,
        twoFactorEnabled: true
      }
    })

    if (!user || !user.active) {
      // Generischer Fehler um User-Enumeration zu verhindern
      return NextResponse.json({ 
        error: 'Ungültige Anmeldedaten' 
      }, { status: 401 })
    }

    // Passwort prüfen
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ 
        error: 'Ungültige Anmeldedaten' 
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      requiresTwoFactor: user.twoFactorEnabled
    })

  } catch (error) {
    console.error('2FA Check Error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
