import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { stripHtml } from "@/lib/sanitize"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit
  const search = searchParams.get("search")
  const status = searchParams.get("status")

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { lieferantName: { contains: search, mode: "insensitive" as const } },
            { bestellnummer: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.lieferantenBestellung.findMany({
      where,
      include: { positionen: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.lieferantenBestellung.count({ where }),
  ])

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { positionen, ...data } = body

    // Auto-Bestellnummer: LB-YYYY-NNNN
    const year = new Date().getFullYear()
    const count = await prisma.lieferantenBestellung.count({
      where: { bestellnummer: { startsWith: `LB-${year}-` } },
    })
    const bestellnummer = `LB-${year}-${String(count + 1).padStart(4, "0")}`

    const bestellung = await prisma.lieferantenBestellung.create({
      data: {
        bestellnummer,
        lieferantName: stripHtml(data.lieferantName),
        lieferantEmail: data.lieferantEmail || null,
        bestelldatum: data.bestelldatum ? new Date(data.bestelldatum) : new Date(),
        lieferdatum: data.lieferdatum ? new Date(data.lieferdatum) : null,
        status: data.status || "entwurf",
        gesamtbetrag: data.gesamtbetrag || null,
        bemerkung: data.bemerkung ? stripHtml(data.bemerkung) : null,
        positionen:
          positionen?.length > 0
            ? {
                create: positionen.map(
                  (p: { baumart: string; menge: number; einheit?: string; preisProEinheit?: number; qualitaet?: string; bemerkung?: string }) => ({
                    baumart: stripHtml(p.baumart),
                    menge: p.menge,
                    einheit: p.einheit || "Stück",
                    preisProEinheit: p.preisProEinheit || null,
                    gesamtpreis: p.preisProEinheit ? p.preisProEinheit * p.menge : null,
                    qualitaet: p.qualitaet || null,
                    bemerkung: p.bemerkung ? stripHtml(p.bemerkung) : null,
                  })
                ),
              }
            : undefined,
      },
      include: { positionen: true },
    })

    return NextResponse.json(bestellung, { status: 201 })
  } catch (error) {
    console.error("[LieferantenBestellungen POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
