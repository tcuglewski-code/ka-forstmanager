import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const suche = searchParams.get("suche") || searchParams.get("search") || ""
  const rolle = searchParams.get("rolle") || ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    where: {
      AND: [
        { deletedAt: null },
        suche
          ? {
              OR: [
                { vorname: { contains: suche, mode: "insensitive" } },
                { nachname: { contains: suche, mode: "insensitive" } },
                { email: { contains: suche, mode: "insensitive" } },
              ],
            }
          : {},
        rolle ? { rolle } : {},
      ],
    },
    orderBy: { nachname: "asc" },
    take: limit,
  })

  return NextResponse.json(mitarbeiter)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
