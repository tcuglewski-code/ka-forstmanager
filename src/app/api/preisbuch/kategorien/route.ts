import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"

// GET: alle Kategorien (mit aktiven Einträgen)
export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const nurAktiv = url.searchParams.get("aktiv") !== "false"

  const data = await prisma.preisbuchKategorie.findMany({
    where: nurAktiv ? { aktiv: true } : {},
    include: {
      eintraege: {
        where: nurAktiv ? { aktiv: true } : {},
        orderBy: { reihenfolge: "asc" },
        include: { aufschlaege: true },
      },
    },
    orderBy: { reihenfolge: "asc" },
  })
  return NextResponse.json(data)
})

// POST: neue Kategorie (admin)
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: "name erforderlich" }, { status: 400 })

  const data = await prisma.preisbuchKategorie.create({
    data: {
      name: String(body.name).toLowerCase().trim(),
      label: body.label ?? null,
      beschreibung: body.beschreibung ?? null,
      reihenfolge: body.reihenfolge != null ? Number(body.reihenfolge) : 0,
    },
  })
  return NextResponse.json(data, { status: 201 })
})
