import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const bundesland = sp.get("bundesland")
    const baumart = sp.get("baumart")
    const quelleId = sp.get("quelleId")
    const search = sp.get("search")
    const status = sp.get("status")
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"))
    const limit = Math.min(1000, Math.max(1, parseInt(sp.get("limit") ?? "25")))
    const sortBy = sp.get("sortBy") ?? "registerNr"
    const sortDir = (sp.get("sortDir") === "asc" ? "asc" : "desc") as "asc" | "desc"
    const skip = (page - 1) * limit

    const sonderherkunft = sp.get("sonderherkunft")
    const herkunft = sp.get("herkunft")

    const where: Prisma.RegisterFlaecheWhereInput = {}
    if (bundesland) where.bundesland = bundesland
    if (baumart) where.baumart = { contains: baumart, mode: "insensitive" }
    if (herkunft) where.herkunftsgebiet = { contains: herkunft, mode: "insensitive" }
    if (quelleId) where.quelleId = quelleId
    if (status === "zugelassen") where.zugelassen = true
    if (status === "abgelaufen") where.zugelassen = false
    if (sonderherkunft === "true") where.sonderherkunft = true
    if (search) {
      where.OR = [
        { registerNr: { contains: search, mode: "insensitive" } },
        { forstamt: { contains: search, mode: "insensitive" } },
        { revier: { contains: search, mode: "insensitive" } },
        { ansprechpartner: { contains: search, mode: "insensitive" } },
      ]
    }

    const validSortFields = ["registerNr", "bundesland", "baumart", "flaecheHa", "forstamt", "zulassungBis", "createdAt"]
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "registerNr"
    const safeSortDir = sortDir === "asc" ? Prisma.SortOrder.asc : Prisma.SortOrder.desc
    // Nulls-last: numerische/Datum-Felder via Prisma, Text via sort (nulls always last in Postgres desc)
    const nullableFields = ["flaecheHa", "forstamt", "zulassungBis"]
    const orderBy: Prisma.RegisterFlaecheOrderByWithRelationInput = nullableFields.includes(safeSortBy)
      ? ({ [safeSortBy]: { sort: safeSortDir, nulls: Prisma.NullsOrder.last } } as Prisma.RegisterFlaecheOrderByWithRelationInput)
      : ({ [safeSortBy]: safeSortDir } as Prisma.RegisterFlaecheOrderByWithRelationInput)

    const [data, total] = await Promise.all([
      prisma.registerFlaeche.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          quelle: { select: { name: true, kuerzel: true } },
          _count: { select: { medien: true } },
          profil: { select: { status: true } },
        },
      }),
      prisma.registerFlaeche.count({ where }),
    ])

    return NextResponse.json({ data, flaechen: data, total, page, limit })
  } catch (err) {
    console.error("GET /api/saatguternte/register", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
