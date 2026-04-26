import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { stripHtml } from "@/lib/sanitize"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const bestellung = await prisma.lieferantenBestellung.findUnique({
    where: { id },
    include: { positionen: true },
  })

  if (!bestellung) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(bestellung)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { positionen, ...data } = body

    // Update positions: delete all + re-create
    if (positionen) {
      await prisma.lieferBestellPosition.deleteMany({ where: { bestellungId: id } })
    }

    const bestellung = await prisma.lieferantenBestellung.update({
      where: { id },
      data: {
        ...(data.lieferantName !== undefined ? { lieferantName: stripHtml(data.lieferantName) } : {}),
        ...(data.lieferantEmail !== undefined ? { lieferantEmail: data.lieferantEmail || null } : {}),
        ...(data.lieferdatum !== undefined ? { lieferdatum: data.lieferdatum ? new Date(data.lieferdatum) : null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.gesamtbetrag !== undefined ? { gesamtbetrag: data.gesamtbetrag } : {}),
        ...(data.bemerkung !== undefined ? { bemerkung: data.bemerkung ? stripHtml(data.bemerkung) : null } : {}),
        ...(positionen
          ? {
              positionen: {
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
              },
            }
          : {}),
      },
      include: { positionen: true },
    })

    return NextResponse.json(bestellung)
  } catch (error) {
    console.error("[LieferantenBestellungen PUT]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.lieferantenBestellung.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[LieferantenBestellungen DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
