import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bundesland = searchParams.get("bundesland")
  const baumart = searchParams.get("baumart")
  const gps = searchParams.get("gps")
  const quelleId = searchParams.get("quelleId")
  const status = searchParams.get("status")
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (bundesland) where.bundesland = bundesland
  if (baumart) where.baumart = { contains: baumart, mode: "insensitive" }
  if (quelleId) where.quelleId = quelleId
  if (status === "zugelassen") where.zugelassen = true
  if (status === "abgelaufen") where.zugelassen = false
  if (gps === "mit_gps") where.latDez = { not: null }
  if (gps === "ohne_gps") where.latDez = null
  
  const flaechen = await prisma.registerFlaeche.findMany({
    where,
    take: 5000,
    orderBy: { registerNr: "asc" },
    include: { quelle: { select: { kuerzel: true } } }
  })
  
  const headers = [
    "RegisterNr",
    "Bundesland", 
    "Baumart",
    "BaumartCode",
    "Kategorie",
    "Ausgangsmaterial",
    "Herkunftsgebiet",
    "FlaecheHa",
    "Forstamt",
    "Revier",
    "Lat",
    "Lon",
    "ZulassungVon",
    "ZulassungBis",
    "Zugelassen",
    "Quelle"
  ]
  
  const rows = flaechen.map(f => [
    f.registerNr,
    f.bundesland,
    f.baumart,
    f.baumartCode ?? "",
    f.kategorie ?? "",
    f.ausgangsmaterial ?? "",
    f.herkunftsgebiet ?? "",
    f.flaecheHa ?? "",
    f.forstamt ?? "",
    f.revier ?? "",
    f.latDez ?? "",
    f.lonDez ?? "",
    f.zulassungVon?.toISOString().split("T")[0] ?? "",
    f.zulassungBis?.toISOString().split("T")[0] ?? "",
    f.zugelassen ? "Ja" : "Nein",
    f.quelle.kuerzel
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
  
  const csv = [headers.join(","), ...rows].join("\n")
  
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="register-export-${new Date().toISOString().split("T")[0]}.csv"`
    }
  })
}
