// @ts-nocheck
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const saisonId = searchParams.get("saisonId")
    const baumart = searchParams.get("baumart")
    const status = searchParams.get("status")

    const where: any = {}
    if (saisonId) where.saisonId = saisonId
    if (baumart) where.baumart = { contains: baumart, mode: "insensitive" }
    if (status) where.status = status

    const anfragen = await prisma.ernteanfrage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        baumschule: { select: { id: true, name: true } },
        saison: { select: { id: true, jahr: true } },
      },
    })

    return NextResponse.json(anfragen)
  } catch (error) {
    console.error("GET /api/saatguternte/anfragen error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { baumschuleId, saisonId, baumart, herkunft, zielmenge, deadline, notizen } = body

    if (!baumschuleId || !baumart || !zielmenge) {
      return NextResponse.json(
        { error: "baumschuleId, baumart und zielmenge sind Pflichtfelder" },
        { status: 400 }
      )
    }

    const anfrage = await prisma.ernteanfrage.create({
      data: {
        baumschuleId,
        saisonId: saisonId || null,
        baumart,
        herkunft,
        zielmenge: parseFloat(zielmenge),
        deadline: deadline ? new Date(deadline) : null,
        notizen,
      },
      include: {
        baumschule: { select: { id: true, name: true } },
        saison: { select: { id: true, jahr: true } },
      },
    })

    return NextResponse.json(anfrage, { status: 201 })
  } catch (error) {
    console.error("POST /api/saatguternte/anfragen error:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
