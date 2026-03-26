// @ts-nocheck
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const anfrage = await prisma.ernteanfrage.findUnique({
      where: { id },
      include: { saison: true },
    })

    if (!anfrage) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }

    if (!anfrage.saisonId) {
      return NextResponse.json({ error: "Keine Saison zugewiesen" }, { status: 400 })
    }

    const sumResult = await prisma.ernteLeistung.aggregate({
      where: {
        einsatz: {
          saisonId: anfrage.saisonId,
          baumart: { contains: anfrage.baumart.split(" ")[0], mode: "insensitive" },
        },
      },
      _sum: { gesammeltKg: true },
    })

    const gesammelt = sumResult._sum.gesammeltKg ?? 0
    const newStatus =
      gesammelt >= anfrage.zielmenge
        ? "erfüllt"
        : gesammelt > 0
        ? "in_ernte"
        : "offen"

    const updated = await prisma.ernteanfrage.update({
      where: { id },
      data: { gesammelteKg: gesammelt, status: newStatus },
    })

    return NextResponse.json({ gesammelt, status: newStatus, anfrage: updated })
  } catch (error) {
    console.error("PATCH /api/saatguternte/anfragen/[id]/progress error:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}
