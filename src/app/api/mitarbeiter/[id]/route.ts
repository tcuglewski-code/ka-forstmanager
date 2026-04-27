import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { sanitizeStrings } from "@/lib/sanitize"

const ADMIN_ROLES = ["admin", "ka_admin", "administrator"]
const SENSITIVE_FIELDS = [
  "stundenlohn", "iban", "bankname", "vollkostenSatz",
  "maschinenbonusIndividuell", "geburtsdatum",
  "notfallkontakt", "notfalltelefon", "notfallName", "notfallTelefon", "notfallBeziehung",
]

function stripSensitive(record: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...record }
  for (const field of SENSITIVE_FIELDS) {
    delete clean[field]
  }
  return clean
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id } })
  if (!mitarbeiter || mitarbeiter.deletedAt) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email

  // Admin: full access
  if (userRole && ADMIN_ROLES.includes(userRole)) {
    return NextResponse.json(mitarbeiter)
  }

  // Non-admin: check group membership
  if (!userEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ownMitarbeiter = await prisma.mitarbeiter.findFirst({
    where: { email: userEmail, deletedAt: null },
    select: { id: true },
  })
  if (!ownMitarbeiter) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Own record: return all fields (user may see own IBAN etc.)
  if (ownMitarbeiter.id === id) {
    return NextResponse.json(mitarbeiter)
  }

  // Check if target is in same group
  let erlaubteIds: string[] = []
  if (userRole === "ka_gruppenführer" || userRole === "ka_gruppenfuhrer") {
    const meineGruppen = await prisma.gruppe.findMany({
      where: { gruppenfuehrerId: ownMitarbeiter.id },
      select: { id: true },
    })
    const mitglieder = await prisma.gruppeMitglied.findMany({
      where: { gruppeId: { in: meineGruppen.map(g => g.id) } },
      select: { mitarbeiterId: true },
    })
    erlaubteIds = mitglieder.map(m => m.mitarbeiterId)
  } else if (userRole === "ka_mitarbeiter") {
    const mitgliedschaften = await prisma.gruppeMitglied.findMany({
      where: { mitarbeiterId: ownMitarbeiter.id },
      select: { gruppeId: true },
    })
    const alleMitglieder = await prisma.gruppeMitglied.findMany({
      where: { gruppeId: { in: mitgliedschaften.map(m => m.gruppeId) } },
      select: { mitarbeiterId: true },
    })
    erlaubteIds = alleMitglieder.map(m => m.mitarbeiterId)
  }

  if (!erlaubteIds.includes(id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Group member but not self: strip sensitive fields
  return NextResponse.json(stripSensitive(mitarbeiter as unknown as Record<string, unknown>))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!userRole || !ADMIN_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  try {
    const data = sanitizeStrings(await req.json())
    const mitarbeiter = await prisma.mitarbeiter.update({ where: { id }, data })
    return NextResponse.json(mitarbeiter)
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!userRole || !ADMIN_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  try {
    await prisma.mitarbeiter.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inaktiv' },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
