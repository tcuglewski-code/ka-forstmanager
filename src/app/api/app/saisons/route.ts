import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const saisons = await prisma.saison.findMany({
    where: { status: { in: ["aktiv", "planung"] } },
    orderBy: { startDatum: "desc" },
  })
  return NextResponse.json(saisons)
}
