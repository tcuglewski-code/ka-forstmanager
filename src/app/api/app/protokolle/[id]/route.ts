/**
 * GET /api/app/protokolle/[id]   — Tagesprotokoll-Detail (Bearer-Auth)
 * PATCH /api/app/protokolle/[id] — Tagesprotokoll aktualisieren (Bearer-Auth)
 *
 * Zugriff:
 *  - Admin: jedes Protokoll
 *  - GF: Protokolle der eigenen Gruppen
 *  - MA: nur eigene Protokolle (erstellerId)
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

async function checkAccess(req: NextRequest, id: string) {
  const appUser = await getAppUser(req)
  if (!appUser) return { ok: false as const, status: 401, error: "Unauthorized" }

  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  const proto = await prisma.tagesprotokoll.findUnique({
    where: { id },
    include: { auftrag: { select: { id: true, titel: true, gruppeId: true } } },
  })
  if (!proto) return { ok: false as const, status: 404, error: "Not found" }

  if (isAdmin) return { ok: true as const, proto, appUser, ownId, isAdmin, isGF }
  if (!ownId) return { ok: false as const, status: 403, error: "Forbidden" }

  if (proto.erstellerId === ownId) {
    return { ok: true as const, proto, appUser, ownId, isAdmin, isGF }
  }

  if (isGF && proto.gruppeId) {
    const allowed = await prisma.gruppe.findFirst({
      where: {
        id: proto.gruppeId,
        OR: [
          { gruppenfuehrerId: ownId },
          { mitglieder: { some: { mitarbeiterId: ownId } } },
        ],
      },
      select: { id: true },
    })
    if (allowed) return { ok: true as const, proto, appUser, ownId, isAdmin, isGF }
  }

  return { ok: false as const, status: 403, error: "Forbidden" }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const access = await checkAccess(req, id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  return NextResponse.json(access.proto)
}

const PATCH_ALLOWED = new Set([
  "arbeitsbeginn", "arbeitsende", "pauseMinuten",
  "bericht", "witterung", "fotos",
  "gepflanzt", "flaecheBearbeitetHa", "abschnitt",
  "mitarbeiterListe", "mitarbeiterAnzahl",
  "gpsStartLat", "gpsStartLon",
  "pflanzDetails", "materialVerbraucht",
])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const access = await checkAccess(req, id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await req.json().catch(() => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}

  if (access.isAdmin) {
    for (const [k, v] of Object.entries(body)) {
      if (k === "id" || k === "createdAt" || k === "auftragId") continue
      data[k] = v
    }
  } else {
    for (const [k, v] of Object.entries(body)) {
      if (PATCH_ALLOWED.has(k)) data[k] = v
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine erlaubten Felder im Payload" }, { status: 400 })
  }

  try {
    const updated = await prisma.tagesprotokoll.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("[app/protokolle/PATCH]", err)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}
