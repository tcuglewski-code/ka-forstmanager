// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const baumart = req.nextUrl.searchParams.get("baumart")

    const where: any = {
      herkunftsgebiet: { not: null },
    }
    if (baumart) where.baumart = { contains: baumart, mode: "insensitive" }

    const results = await prisma.registerFlaeche.findMany({
      where,
      select: { herkunftsgebiet: true },
      distinct: ["herkunftsgebiet"],
      orderBy: { herkunftsgebiet: "asc" },
    })

    const herkunftsgebiete = results
      .map((r) => r.herkunftsgebiet)
      .filter(Boolean)
      .sort()

    return NextResponse.json(herkunftsgebiete)
  } catch (err) {
    console.error("GET /api/saatguternte/register/herkunfts-optionen", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
