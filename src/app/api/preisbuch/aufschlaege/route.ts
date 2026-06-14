import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { AufschlagBedingungSchema } from "@/lib/angebote/zod-schemas"

const TYPEN = ["steilheit", "entfernung", "saison", "menge", "subunternehmer", "fixkosten", "bodenart", "sonstiges"] as const

export const GET = withErrorHandler(async (_req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await prisma.preisbuchAufschlag.findMany({ orderBy: { reihenfolge: "asc" } })
  return NextResponse.json(data)
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.name || !TYPEN.includes(body.typ) || body.faktor == null) {
    return NextResponse.json({ error: "name, typ, faktor erforderlich" }, { status: 400 })
  }
  const bedingung = AufschlagBedingungSchema.safeParse(body.bedingung ?? {})
  if (!bedingung.success) return NextResponse.json({ error: "Ungültige Bedingung" }, { status: 400 })

  const data = await prisma.preisbuchAufschlag.create({
    data: {
      name: String(body.name),
      typ: body.typ,
      bedingung: bedingung.data,
      faktor: Number(body.faktor),
      beschreibung: body.beschreibung ?? null,
      eintragId: body.eintragId ?? null,
      reihenfolge: body.reihenfolge != null ? Number(body.reihenfolge) : 0,
    },
  })
  return NextResponse.json(data, { status: 201 })
})
