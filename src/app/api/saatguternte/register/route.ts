import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const bundesland = sp.get("bundesland")
    const baumart = sp.get("baumart")
    const quelleId = sp.get("quelleId")
    const search = sp.get("search")
    const status = sp.get("status")
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "25")))
    const sortBy = sp.get("sortBy") ?? "registerNr"
    const sortDir = (sp.get("sortDir") === "asc" ? "asc" : "desc") as "asc" | "desc"
    const skip = (page - 1) * limit

    const where: Prisma.RegisterFlaecheWhereInput = {}
    if (bundesland) where.bundesland = bundesland
    if (baumart) where.baumart = { contains: baumart, mode: "insensitive" }
    if (quelleId) where.quelleId = quelleId
    if (status === "zugelassen") where.zugelassen = true
    if (status === "abgelaufen") where.zugelassen = false
    if (search) {
      where.OR = [
        { registerNr: { contains: search, mode: "insensitive" } },
        { forstamt: { contains: search, mode: "insensitive" } },
        { revier: { contains: search, mode: "insensitive" } },
        { ansprechpartner: { contains: search, mode: "insensitive" } },
      ]
    }

    const validSortFields = ["registerNr", "bundesland", "baumart", "flaecheHa", "forstamt", "zulassungBis", "createdAt"]
    const orderBy: Prisma.RegisterFlaecheOrderByWithRelationInput = {}
    if (validSortFields.includes(sortBy)) {
      (orderBy as Record<string, string>)[sortBy] = sortDir
    } else {
      orderBy.registerNr = "asc"
    }

    const [data, total] = await Promise.all([
      prisma.registerFlaeche.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          quelle: { select: { name: true, kuerzel: true } },
        },
      }),
      prisma.registerFlaeche.count({ where }),
    ])

    return NextResponse.json({ data, total, page, limit })
  } catch (err) {
    console.error("GET /api/saatguternte/register", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
