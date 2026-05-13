import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { mapAbwesenheitToDTO, resolveMitarbeiterId } from "@/lib/urlaub-helper"

// GET /api/urlaub/meine — eigene Urlaubsanträge
export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const mitarbeiterId = await resolveMitarbeiterId(
      appUser as Record<string, unknown>
    )
    if (!mitarbeiterId) return NextResponse.json([])

    const items = await prisma.abwesenheit.findMany({
      where: { mitarbeiterId, typ: "urlaub" },
      include: {
        mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      },
      orderBy: { von: "desc" },
      take: 200,
    })

    return NextResponse.json(items.map(mapAbwesenheitToDTO))
  } catch (error) {
    console.error("[/api/urlaub/meine] Error:", error)
    return NextResponse.json([])
  }
}
