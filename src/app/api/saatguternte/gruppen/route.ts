// @ts-nocheck
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const saisonId = searchParams.get("saisonId")

    const where: any = {}
    if (saisonId) where.saisonId = saisonId

    const gruppen = await prisma.ernteGruppe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        saison: { select: { id: true, jahr: true } },
        mitglieder: {
          include: {
            person: { select: { id: true, name: true, nationalitaet: true } },
          },
        },
        _count: { select: { mitglieder: true, einsaetze: true } },
      },
    })

    return NextResponse.json(gruppen)
  } catch (error) {
    console.error("GET /api/saatguternte/gruppen error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { saisonId, name, gruppenfuehrerName, stundenlohnGF, notizen, mitglieder } = body

    if (!saisonId || !name) {
      return NextResponse.json(
        { error: "saisonId und name sind Pflichtfelder" },
        { status: 400 }
      )
    }

    const gruppe = await prisma.ernteGruppe.create({
      data: {
        saisonId,
        name,
        gruppenfuehrerName,
        stundenlohnGF: stundenlohnGF ? parseFloat(stundenlohnGF) : 17.0,
        notizen,
        mitglieder: mitglieder?.length
          ? {
              create: mitglieder.map((personId: string) => ({
                personId,
                rolle: "sammler",
              })),
            }
          : undefined,
      },
      include: {
        saison: { select: { id: true, jahr: true } },
        mitglieder: {
          include: {
            person: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json(gruppe, { status: 201 })
  } catch (error) {
    console.error("POST /api/saatguternte/gruppen error:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
