/**
 * GET /api/app/mitarbeiter/[id]   — Mitarbeiter-Detail (Bearer-Auth)
 * PATCH /api/app/mitarbeiter/[id] — Mitarbeiter aktualisieren (Bearer-Auth)
 *
 * Rollen-Zugriff:
 *  - Admin: voller Zugriff
 *  - Eigenes Profil: alle Felder
 *  - Gruppe-Mitglied: Detail ohne sensible Felder
 *  - PATCH: nur Admin oder eigenes Profil (erlaubte Felder)
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

const SENSITIVE_FIELDS = [
  "stundenlohn", "iban", "bankname", "vollkostenSatz",
  "maschinenbonusIndividuell", "geburtsdatum",
  "notfallkontakt", "notfalltelefon", "notfallName", "notfallTelefon", "notfallBeziehung",
]

function stripSensitive(record: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...record }
  for (const field of SENSITIVE_FIELDS) delete clean[field]
  return clean
}

function isAdminRole(role?: string) {
  return role === "ka_admin" || role === "admin" || role === "administrator"
}

function isGFRole(role?: string) {
  return (
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)

  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id } })
  if (!mitarbeiter || mitarbeiter.deletedAt) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  if (isAdminRole(role)) return NextResponse.json(mitarbeiter)
  if (ownId && ownId === id) return NextResponse.json(mitarbeiter)
  if (!ownId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Gruppen-Mitglieder dürfen Basisdaten sehen
  let erlaubteIds: string[] = []
  if (isGFRole(role)) {
    const meineGruppen = await prisma.gruppe.findMany({
      where: { gruppenfuehrerId: ownId },
      select: { id: true },
    })
    const mitglieder = await prisma.gruppeMitglied.findMany({
      where: { gruppeId: { in: meineGruppen.map((g: { id: string }) => g.id) } },
      select: { mitarbeiterId: true },
    })
    erlaubteIds = mitglieder.map((m: { mitarbeiterId: string }) => m.mitarbeiterId)
  } else {
    const mitgliedschaften = await prisma.gruppeMitglied.findMany({
      where: { mitarbeiterId: ownId },
      select: { gruppeId: true },
    })
    const alleMitglieder = await prisma.gruppeMitglied.findMany({
      where: { gruppeId: { in: mitgliedschaften.map((m: { gruppeId: string }) => m.gruppeId) } },
      select: { mitarbeiterId: true },
    })
    erlaubteIds = alleMitglieder.map((m: { mitarbeiterId: string }) => m.mitarbeiterId)
  }

  if (!erlaubteIds.includes(id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(stripSensitive(mitarbeiter as unknown as Record<string, unknown>))
}

const PATCH_OWN_ALLOWED = new Set([
  "telefon", "mobil", "adresse", "plz", "ort",
  "notfallName", "notfallTelefon", "notfallBeziehung",
  "notfallkontakt", "notfalltelefon",
  "fuehrerschein", "qualifikationen",
  "iban", "bankname",
])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)

  const body = await req.json().catch(() => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}

  if (isAdminRole(role)) {
    // Admin: alles erlaubt (basic sanitize)
    for (const [k, v] of Object.entries(body)) {
      if (k === "id" || k === "createdAt" || k === "updatedAt") continue
      data[k] = v
    }
  } else if (ownId && ownId === id) {
    // Self-Update: nur Whitelist
    for (const [k, v] of Object.entries(body)) {
      if (PATCH_OWN_ALLOWED.has(k)) data[k] = v
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine erlaubten Felder im Payload" }, { status: 400 })
  }

  try {
    const updated = await prisma.mitarbeiter.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("[app/mitarbeiter/PATCH]", err)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}
