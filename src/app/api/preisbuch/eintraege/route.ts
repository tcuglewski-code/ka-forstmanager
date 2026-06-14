import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { PreisbuchMetadatenSchema } from "@/lib/angebote/zod-schemas"

const EINHEITEN = ["ha", "stueck", "lm", "m2", "stunde", "pauschale", "kg"] as const

export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const kategorieId = url.searchParams.get("kategorieId")
  const data = await prisma.preisbuchEintrag.findMany({
    where: { aktiv: true, ...(kategorieId ? { kategorieId } : {}) },
    include: { kategorie: true, aufschlaege: true },
    orderBy: [{ kategorieId: "asc" }, { reihenfolge: "asc" }],
  })
  return NextResponse.json(data)
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.kategorieId || !body.bezeichnung || body.basispreis == null) {
    return NextResponse.json({ error: "kategorieId, bezeichnung, basispreis erforderlich" }, { status: 400 })
  }
  if (!EINHEITEN.includes(body.einheit)) {
    return NextResponse.json({ error: "Ungültige Einheit" }, { status: 400 })
  }
  // Zod: metadatenJson validieren (NEVER #23)
  let metadatenJson = undefined
  if (body.metadatenJson) {
    const parsed = PreisbuchMetadatenSchema.safeParse(body.metadatenJson)
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Metadaten" }, { status: 400 })
    metadatenJson = parsed.data
  }

  const data = await prisma.preisbuchEintrag.create({
    data: {
      kategorieId: body.kategorieId,
      bezeichnung: String(body.bezeichnung),
      einheit: body.einheit,
      basispreis: Number(body.basispreis),
      mwstSatz: body.mwstSatz != null ? Number(body.mwstSatz) : 19,
      beschreibung: body.beschreibung ?? null,
      lieferantTyp: body.lieferantTyp ?? null,
      gueltigVon: body.gueltigVon ? new Date(body.gueltigVon) : null,
      gueltigBis: body.gueltigBis ? new Date(body.gueltigBis) : null,
      reihenfolge: body.reihenfolge != null ? Number(body.reihenfolge) : 0,
      metadatenJson,
      erstelltVon: (session.user as { id?: string }).id ?? null,
    },
  })
  return NextResponse.json(data, { status: 201 })
})
