import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const typ = searchParams.get("typ")
  const search = searchParams.get("search")

  const kontakte = await prisma.kontakt.findMany({
    where: {
      ...(typ ? { typ } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { forstamt: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(kontakte)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const kontakt = await prisma.kontakt.create({
    data: {
      name: body.name,
      typ: body.typ ?? "sonstig",
      telefon: body.telefon ?? null,
      email: body.email ?? null,
      forstamt: body.forstamt ?? null,
      revier: body.revier ?? null,
      adresse: body.adresse ?? null,
      notizen: body.notizen ?? null,
    },
  })
  return NextResponse.json(kontakt, { status: 201 })
}
