import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdminRole } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'
import { withErrorHandler } from "@/lib/api-handler"

const ALLOWED_ROLES = ["ka_mitarbeiter", "ka_gruppenführer", "ka_admin"]

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin-only: nur Admins dürfen App-Accounts erstellen
  const userRole = (user as { role?: string }).role
  if (!isAdminRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id } })
  if (!mitarbeiter) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (mitarbeiter.userId) return NextResponse.json({ error: 'Hat bereits Account' }, { status: 400 })

  const data = await req.json()
  const email = data.email || mitarbeiter.email
  if (!email) return NextResponse.json({ error: 'Keine E-Mail Adresse' }, { status: 400 })

  const rolle = data.rolle || mitarbeiter.rolle || 'ka_mitarbeiter'
  if (!ALLOWED_ROLES.includes(rolle)) {
    return NextResponse.json({ error: `Ungültige Rolle. Erlaubt: ${ALLOWED_ROLES.join(', ')}` }, { status: 400 })
  }

  // Passwort: entweder angegeben oder Vorname+Geburtsjahr
  const gj = mitarbeiter.geburtsdatum ? new Date(mitarbeiter.geburtsdatum).getFullYear() : '2024'
  const defaultPw = `${mitarbeiter.vorname}${gj}!`
  const passwort = data.passwort || defaultPw
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
