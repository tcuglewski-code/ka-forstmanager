import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const mitarbeiterId = appUser.mitarbeiterId as string | null
  // If Gruppenführer, return only their group's auftraege
  let auftraege
  if (mitarbeiterId && appUser.rolle === "gruppenfuehrer") {
    const gruppen = await prisma.gruppeMitglied.findMany({ where: { mitarbeiterId }, select: { gruppeId: true } })
    const gruppenIds = gruppen.map((g) => g.gruppeId)
    auftraege = await prisma.auftrag.findMany({
      where: { gruppeId: { in: gruppenIds }, status: { notIn: ["abgeschlossen"] } },
      include: { saison: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    })
  } else {
    auftraege = await prisma.auftrag.findMany({
      where: { status: { notIn: ["abgeschlossen"] } },
      include: { saison: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    })
  }
  return NextResponse.json(auftraege)
}
