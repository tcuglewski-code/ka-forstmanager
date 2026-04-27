import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, isAdminRole } from "@/lib/auth-helpers"
import { withErrorHandler } from "@/lib/api-handler"
import bcrypt from "bcryptjs"

const ADMIN_ROLES = ["admin", "ka_admin", "administrator"]

function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const special = "!@#$%"
  let pw = ""
  for (let i = 0; i < 7; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  pw += special[Math.floor(Math.random() * special.length)]
  return pw
}

// GET: App-Zugang Status
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const userRole = (user as { role?: string }).role

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          active: true,
          lastLoginAt: true,
        },
      },
    },
  })

  if (!mitarbeiter) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  if (!mitarbeiter.userId || !mitarbeiter.user) {
    return NextResponse.json({ hasAccount: false, active: null, email: null, role: null, lastLoginAt: null, userId: null })
  }

  const u = mitarbeiter.user

  // GF sieht nur hasAccount + active (DSGVO)
  if (!isAdminRole(userRole)) {
    return NextResponse.json({ hasAccount: true, active: u.active })
  }

  // Admin sieht alles
  return NextResponse.json({
    hasAccount: true,
    active: u.active,
    email: u.email,
    role: u.role,
    lastLoginAt: u.lastLoginAt,
    userId: u.id,
  })
})

// PATCH: activate / deactivate / reset-password
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!isAdminRole(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, newPassword } = body as { action: string; newPassword?: string }

  if (!["activate", "deactivate", "reset-password"].includes(action)) {
    return NextResponse.json({ error: "Ungültige Aktion. Erlaubt: activate, deactivate, reset-password" }, { status: 400 })
  }

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id },
    select: { userId: true, vorname: true, nachname: true },
  })
  if (!mitarbeiter?.userId) {
    return NextResponse.json({ error: "Mitarbeiter hat keinen App-Account" }, { status: 400 })
  }

  const userId = mitarbeiter.userId

  if (action === "activate") {
    await prisma.user.update({ where: { id: userId }, data: { active: true } })
    await logAudit(user, "APP_ACCOUNT_AKTIVIERT", id, { action })
    return NextResponse.json({ ok: true, action: "activated" })
  }

  if (action === "deactivate") {
    await prisma.user.update({
      where: { id: userId },
      data: { active: false, tokenVersion: { increment: 1 } },
    })
    await logAudit(user, "APP_ACCOUNT_DEAKTIVIERT", id, { action })
    return NextResponse.json({ ok: true, action: "deactivated" })
  }

  if (action === "reset-password") {
    const pw = newPassword || generatePassword()
    const hash = await bcrypt.hash(pw, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hash, mustChangePassword: true },
    })
    await logAudit(user, "APP_ACCOUNT_PW_RESET", id, { action })
    return NextResponse.json({ ok: true, action: "password-reset", temporaresPasswort: pw })
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 })
})

// DELETE: Entfernt Verknüpfung + deaktiviert User (User-Datensatz bleibt für Audit-Trail)
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!isAdminRole(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!mitarbeiter?.userId) {
    return NextResponse.json({ error: "Mitarbeiter hat keinen App-Account" }, { status: 400 })
  }

  const linkedUserId = mitarbeiter.userId

  // Verknüpfung entfernen
  await prisma.mitarbeiter.update({ where: { id }, data: { userId: null } })

  // User deaktivieren (nicht löschen — DSGVO Audit-Trail)
  await prisma.user.update({
    where: { id: linkedUserId },
    data: { active: false, tokenVersion: { increment: 1 } },
  })

  await logAudit(user, "APP_ACCOUNT_ENTFERNT", id, { linkedUserId })

  return NextResponse.json({ ok: true, action: "deleted" })
})

async function logAudit(
  user: { id?: string } & Record<string, unknown>,
  action: string,
  entityId: string,
  details: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: (user as { id: string }).id,
        action,
        entityType: "Mitarbeiter",
        entityId,
        newValue: details,
      },
    })
  } catch {
    console.log(`[AUDIT] ${action}:`, { entityId, ...details })
  }
}
