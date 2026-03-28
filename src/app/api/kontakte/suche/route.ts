// Sprint FY (G2): Kontakte-Suche für Autocomplete
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/kontakte/suche?q=<query>&typ=<typ>
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const typ = searchParams.get("typ")

  const kontakte = await prisma.kontakt.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { forstamt: { contains: q, mode: "insensitive" } },
            { revier: { contains: q, mode: "insensitive" } },
          ],
        },
        typ ? { typ } : {},
      ],
    },
    select: {
      id: true,
      name: true,
      forstamt: true,
      revier: true,
      typ: true,
    },
    take: 20,
    orderBy: { name: "asc" },
  })

  return NextResponse.json(kontakte)
}
