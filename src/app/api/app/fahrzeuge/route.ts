/**
 * GET /api/app/fahrzeuge — App (Bearer-Auth) Fahrzeug-Liste
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const fahrzeuge = await prisma.fahrzeug.findMany({
    select: {
      id: true,
      typ: true,
      bezeichnung: true,
      kennzeichen: true,
      baujahr: true,
      status: true,
      tuvDatum: true,
      naechsteWartung: true,
      notizen: true,
    },
    orderBy: [{ bezeichnung: "asc" }],
  })

  return NextResponse.json(fahrzeuge)
}
