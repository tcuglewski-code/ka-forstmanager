/**
 * 2FA Validate API
 * POST: Validiert TOTP/Backup-Code während Login
 * Sprint Q015: Two-Factor Authentication
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, verifyBackupCode } from '@/lib/totp'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, token, isBackupCode } = body

    if (!email || !password || !token) {
      return NextResponse.json({ 
        error: 'Email, Passwort und Token erforderlich' 
      }, { status: 400 })
    }

    // User laden
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        active: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true
      }
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
    }

    // Passwort prüfen
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ 
        error: '2FA nicht aktiviert für diesen Benutzer' 
      }, { status: 400 })
    }

    let isValid = false

    if (isBackupCode) {
      // Backup-Code validieren
      const codeIndex = verifyBackupCode(token, user.twoFactorBackupCodes)
      if (codeIndex !== -1) {
        isValid = true
        // Verwendeten Backup-Code entfernen
        const remainingCodes = [...user.twoFactorBackupCodes]
        remainingCodes.splice(codeIndex, 1)
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: remainingCodes }
        })
      }
    } else {
      // TOTP-Token validieren
      isValid = verifyToken(user.twoFactorSecret, token)
    }

    if (!isValid) {
      return NextResponse.json({ 
        error: 'Ungültiger Authentifizierungscode' 
      }, { status: 401 })
    }

    // Letzten Login aktualisieren
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Erfolgreiche 2FA-Validierung
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('2FA Validate Error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
