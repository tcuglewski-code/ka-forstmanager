import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const mitarbeiterId = appUser.mitarbeiterId as string | null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isGF = role === "ka_gruppenführer" || role === "ka_gruppenfuehrer" || role === "gruppenfuehrer" || role === "gruppenführer"
  // If Gruppenführer, return only their group's auftraege
  let auftraege
  if (mitarbeiterId && isGF) {
    // GF: Gruppen wo sie Gruppenführer sind + Gruppen wo sie Mitglied sind
    const [leadGruppen, memberGruppen] = await Promise.all([
      prisma.gruppe.findMany({ where: { gruppenfuehrerId: mitarbeiterId }, select: { id: true } }),
      prisma.gruppeMitglied.findMany({ where: { mitarbeiterId }, select: { gruppeId: true } }),
    ])
    const gruppenIds = Array.from(new Set<string>([
      ...leadGruppen.map((g: { id: string }) => g.id),
      ...memberGruppen.map((g: { gruppeId: string }) => g.gruppeId),
    ]))
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
})
