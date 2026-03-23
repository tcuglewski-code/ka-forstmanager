import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const gruppen = await prisma.gruppe.findMany({
    include: {
      saison: { select: { id: true, name: true } },
      mitglieder: {
        include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(gruppen)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const gruppe = await prisma.gruppe.create({
    data: {
      name: body.name,
      saisonId: body.saisonId ?? null,
      gruppenfuehrerId: body.gruppenfuehrerId ?? null,
      status: body.status ?? "aktiv",
    },
  })
  return NextResponse.json(gruppe, { status: 201 })
}
