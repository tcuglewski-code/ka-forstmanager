import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { sanitizeStrings } from "@/lib/sanitize"
import { z } from "zod"

const MitarbeiterSchema = z.object({
  vorname: z.string().min(1, "Vorname ist Pflichtfeld").max(100),
  nachname: z.string().min(1, "Nachname ist Pflichtfeld").max(100),
  email: z.string().email("Ungültige E-Mail").optional().nullable(),
  telefon: z.string().max(50).optional().nullable(),
  rolle: z.enum(["mitarbeiter", "gruppenfuehrer", "admin", "koordinator"]).optional(),
  status: z.string().optional(),
  personalNr: z.string().max(50).optional().nullable(),
  stundenlohn: z.number().min(0).max(1000).optional().nullable(),
})

// Safe fields visible to GF/MA — excludes stundenlohn, iban, bankname, vollkostenSatz,
// maschinenbonusIndividuell, geburtsdatum, notfall* fields
const SAFE_MITARBEITER_SELECT = {
  id: true, vorname: true, nachname: true, email: true,
  telefon: true, mobil: true, rolle: true, qualifikationen: true,
  fuehrerschein: true, status: true, personalNr: true,
  adresse: true, plz: true, ort: true,
  eintrittsdatum: true, austrittsdatum: true,
  createdAt: true, updatedAt: true,
} as const

const ADMIN_ROLES = ["admin", "ka_admin", "administrator"]

function isAdminRole(role: string | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role)
}

async function getOwnMitarbeiter(email: string) {
  return prisma.mitarbeiter.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  })
}

export async function GET(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const suche = searchParams.get("suche") || searchParams.get("search") || ""
  const rolle = searchParams.get("rolle") || ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)

  const userRole = (user as { role?: string }).role
  const userEmail = (user as { email?: string }).email

  // Build search/filter conditions
  const searchFilter = suche
    ? {
        OR: [
          { vorname: { contains: suche, mode: "insensitive" as const } },
          { nachname: { contains: suche, mode: "insensitive" as const } },
          { email: { contains: suche, mode: "insensitive" as const } },
        ],
      }
    : {}
  const rolleFilter = rolle ? { rolle } : {}

  // ADMIN: full access — all fields, all records
  if (isAdminRole(userRole)) {
    const mitarbeiter = await prisma.mitarbeiter.findMany({
      where: { AND: [{ deletedAt: null }, searchFilter, rolleFilter] },
      orderBy: { nachname: "asc" },
      take: limit,
    })
    return NextResponse.json({ items: mitarbeiter, total: mitarbeiter.length })
  }

  // GF: only members of own group(s) — no sensitive fields
  if (userRole === "ka_gruppenführer" || userRole === "ka_gruppenfuhrer") {
    if (!userEmail) return NextResponse.json({ items: [], total: 0 })
    const own = await getOwnMitarbeiter(userEmail)
    if (!own) return NextResponse.json({ items: [], total: 0 })

    const meineGruppen = await prisma.gruppe.findMany({
      where: { gruppenfuehrerId: own.id },
      select: { id: true },
    })
    const gruppenIds = meineGruppen.map(g => g.id)

    const mitglieder = await prisma.gruppeMitglied.findMany({
      where: { gruppeId: { in: gruppenIds } },
      select: { mitarbeiterId: true },
    })
    const erlaubteIds = [...new Set([...mitglieder.map(m => m.mitarbeiterId), own.id])]

    const items = await prisma.mitarbeiter.findMany({
      where: { AND: [{ id: { in: erlaubteIds }, deletedAt: null }, searchFilter, rolleFilter] },
      select: SAFE_MITARBEITER_SELECT,
      orderBy: { nachname: "asc" },
      take: limit,
    })
    return NextResponse.json({ items, total: items.length })
  }

  // MA: only own group members — no sensitive fields
  if (userRole === "ka_mitarbeiter") {
    if (!userEmail) return NextResponse.json({ items: [], total: 0 })
    const own = await getOwnMitarbeiter(userEmail)
    if (!own) return NextResponse.json({ items: [], total: 0 })

    const mitgliedschaften = await prisma.gruppeMitglied.findMany({
      where: { mitarbeiterId: own.id },
      select: { gruppeId: true },
    })
    const gruppenIds = mitgliedschaften.map(m => m.gruppeId)

    const alleMitglieder = await prisma.gruppeMitglied.findMany({
      where: { gruppeId: { in: gruppenIds } },
      select: { mitarbeiterId: true },
    })
    const erlaubteIds = [...new Set([...alleMitglieder.map(m => m.mitarbeiterId), own.id])]

    const items = await prisma.mitarbeiter.findMany({
      where: { AND: [{ id: { in: erlaubteIds }, deletedAt: null }, searchFilter, rolleFilter] },
      select: SAFE_MITARBEITER_SELECT,
      orderBy: { nachname: "asc" },
      take: limit,
    })
    return NextResponse.json({ items, total: items.length })
  }

  // Unknown role — deny access
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = sanitizeStrings(await req.json())

    const parsed = MitarbeiterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: "Ungültige Daten",
        details: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      }, { status: 400 })
    }

    const { vorname, nachname, email, telefon, rolle, status, personalNr } = parsed.data
    const mitarbeiter = await prisma.mitarbeiter.create({
      data: { vorname, nachname, email, telefon, rolle, status, personalNr },
    })
    return NextResponse.json(mitarbeiter, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
