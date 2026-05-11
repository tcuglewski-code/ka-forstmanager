import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdminRole } from '@/lib/auth-helpers'
import { accountErstellenRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { withErrorHandler } from "@/lib/api-handler"

const ALLOWED_ROLES = ["ka_mitarbeiter", "ka_gruppenführer", "ka_admin"]

// AAF-SEC-4: Schwache Passwörter blockieren (Top-N + obvious patterns)
const WEAK_PASSWORDS = new Set([
  "password", "password1", "password123", "passwort", "passwort1", "passwort123",
  "12345678", "123456789", "qwertz123", "qwerty123", "admin123", "test1234",
  "letmein1", "welcome1", "changeme", "forstmanager", "kochaufforstung",
])

function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return "Passwort muss mindestens 8 Zeichen haben"
  if (!/\d/.test(pw)) return "Passwort muss mindestens eine Zahl enthalten"
  if (!/[a-zA-Z]/.test(pw)) return "Passwort muss mindestens einen Buchstaben enthalten"
  if (WEAK_PASSWORDS.has(pw.toLowerCase())) return "Passwort ist zu schwach (auf einer Sperrliste)"
  return null
}

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin-only: nur Admins dürfen App-Accounts erstellen
  const userRole = (user as { role?: string }).role
  if (!isAdminRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // AAF-SEC-4: Rate-Limiting (3 Versuche pro IP pro Stunde)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown"
  try {
    const { success } = await accountErstellenRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Zu viele Account-Erstellungen. Bitte warten Sie 1 Stunde." },
        { status: 429, headers: { "Retry-After": "3600" } }
      )
    }
  } catch (err) {
    // Bei Rate-Limit-Service-Ausfall nicht hart blockieren, nur loggen
    console.warn("[account-erstellen] Rate-limit check failed:", err)
  }

  const { id } = await params

  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id } })
  if (!mitarbeiter) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (mitarbeiter.userId) return NextResponse.json({ error: 'Hat bereits Account' }, { status: 400 })

  const data = await req.json()
  const email = data.email || mitarbeiter.email
  if (!email) return NextResponse.json({ error: 'Keine E-Mail Adresse' }, { status: 400 })

  // Rolle-Mapping: interne FM-Rollen → App-Rollen
  const GF_ROLLEN = ['gf_standard', 'gf_senior', 'gruppenfuehrer', 'gruppenführer']
  const rawRolle = data.rolle || mitarbeiter.rolle || 'ka_mitarbeiter'
  const rolle = GF_ROLLEN.includes(rawRolle)
    ? 'ka_gruppenführer'
    : rawRolle === 'admin' || rawRolle === 'ka_admin'
    ? 'ka_admin'
    : rawRolle.startsWith('ka_')
    ? rawRolle
    : 'ka_mitarbeiter'
  if (!ALLOWED_ROLES.includes(rolle)) {
    return NextResponse.json({ error: `Ungültige Rolle. Erlaubt: ${ALLOWED_ROLES.join(', ')}` }, { status: 400 })
  }

  // AAF-FIX-1: Sicheres zufälliges Passwort statt vorhersagbarem Vorname+Geburtsjahr
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const randomPart = Array.from(crypto.randomBytes(7)).map(b => chars[b % chars.length]).join('')
  const defaultPw = randomPart + '!'
  const passwort = data.passwort || defaultPw

  // AAF-SEC-4: Passwort-Stärke validieren (nur wenn vom Admin manuell vorgegeben)
  if (data.passwort) {
    const pwError = validatePasswordStrength(data.passwort)
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 })
    }
  }

  const hash = await bcrypt.hash(passwort, 10)

  // Email-Kollisions-Check
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  }).catch(() => null)

  if (existing) {
    // Wenn bereits mit einem ANDEREN Mitarbeiter verknüpft → Conflict
    if (existing.mitarbeiter && existing.mitarbeiter.id !== id) {
      return NextResponse.json({
        error: `Diese E-Mail ist bereits mit einem anderen Mitarbeiter verknüpft (${existing.mitarbeiter.vorname} ${existing.mitarbeiter.nachname})`,
      }, { status: 409 })
    }
  }

  let appUser
  if (existing && !existing.mitarbeiter) {
    // User existiert aber ist mit keinem MA verknüpft → verknüpfen + Rolle aktualisieren
    appUser = await prisma.user.update({
      where: { id: existing.id },
      data: { role: rolle, active: true },
    })
  } else if (!existing) {
    appUser = await prisma.user.create({
      data: {
        name: `${mitarbeiter.vorname} ${mitarbeiter.nachname}`,
        email,
        password: hash,
        role: rolle,
        active: true,
        mustChangePassword: true,
      }
    })
  } else {
    // existing.mitarbeiter.id === id — already linked (shouldn't happen due to check above)
    appUser = existing
  }

  // Mitarbeiter mit User verknüpfen
  await prisma.mitarbeiter.update({
    where: { id },
    data: { userId: appUser.id }
  })

  // Audit-Log
  try {
    await prisma.auditLog.create({
      data: {
        userId: (user as { id: string }).id,
        action: 'APP_ACCOUNT_ERSTELLT',
        entityType: 'Mitarbeiter',
        entityId: id,
        newValue: { email, rolle, linkedUserId: appUser.id },
      }
    })
  } catch {
    console.log('[AUDIT] app_account_erstellt:', { mitarbeiterId: id, email, rolle })
  }

  return NextResponse.json({
    ok: true,
    userId: appUser.id,
    email,
    temporaresPasswort: existing ? null : passwort,
    hinweis: existing
      ? 'Bestehender Account verknüpft'
      : `Temporäres Passwort: ${passwort} — beim ersten Login ändern lassen`
  })
})
