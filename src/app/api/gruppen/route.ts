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

  // Enrich with Gruppenführer details (no relation in schema, fetch manually)
  const fuellerIds = gruppen
    .map(g => g.gruppenfuehrerId)
    .filter((id): id is string => !!id)

  const fuellerMap: Record<string, { id: string; vorname: string; nachname: string }> = {}
  if (fuellerIds.length > 0) {
    const fuellerer = await prisma.mitarbeiter.findMany({
      where: { id: { in: fuellerIds } },
      select: { id: true, vorname: true, nachname: true },
    })
    for (const f of fuellerer) {
      fuellerMap[f.id] = f
    }
  }

  const result = gruppen.map(g => ({
    ...g,
    gruppenfuehrer: g.gruppenfuehrerId ? (fuellerMap[g.gruppenfuehrerId] ?? null) : null,
  }))

  return NextResponse.json(result)
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
