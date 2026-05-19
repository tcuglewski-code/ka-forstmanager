import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"

const ADMIN_ROLES = ["admin", "ka_admin", "administrator", "supervisor"]
const VALID_STATUS = ["neu", "zugewiesen", "angeboten", "bestaetigt", "geliefert", "storniert"]

// PATCH: Bestellung aktualisieren (Baumschule zuweisen, Status ändern)
export const PATCH = withErrorHandler(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const role = session.user.role ?? ""
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const { id } = await params
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 })

  const existing = await prisma.baumschulBestellung.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 })

  const data: Record<string, unknown> = {}

  if (body.baumschuleId !== undefined) {
    if (body.baumschuleId === null) {
      data.baumschuleId = null
    } else if (typeof body.baumschuleId === "string" && body.baumschuleId.trim()) {
      const bs = await prisma.baumschule.findUnique({
        where: { id: body.baumschuleId },
        select: { id: true },
      })
      if (!bs) {
        return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
      }
      data.baumschuleId = body.baumschuleId
      // Bei Zuweisung automatisch Status hochsetzen, falls noch "neu"
      if (existing.status === "neu" && !body.status) {
        data.status = "zugewiesen"
      }
    }
  }

  if (typeof body.status === "string") {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json(
        { error: `Ungültiger Status. Erlaubt: ${VALID_STATUS.join(", ")}` },
        { status: 400 }
      )
    }
    data.status = body.status
  }

  if (body.notizen !== undefined) {
    data.notizen =
      typeof body.notizen === "string" ? body.notizen.trim().slice(0, 2000) || null : null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen" }, { status: 400 })
  }

  const updated = await prisma.baumschulBestellung.update({
    where: { id },
    data,
    include: {
      baumschule: { select: { id: true, name: true, ort: true, bundesland: true } },
    },
  })

  return NextResponse.json(updated)
})

// GET: einzelne Bestellung (Admin)
export const GET = withErrorHandler(async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const role = session.user.role ?? ""
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }
  const { id } = await params
  const bestellung = await prisma.baumschulBestellung.findUnique({
    where: { id },
    include: {
      baumschule: { select: { id: true, name: true, ort: true, bundesland: true } },
    },
  })
  if (!bestellung) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(bestellung)
})
