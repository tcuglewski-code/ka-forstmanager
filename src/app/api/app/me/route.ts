import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId) return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 404 })
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
    include: { gruppen: { include: { gruppe: { select: { id: true, name: true } } } } },
  })
  if (!mitarbeiter) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(mitarbeiter)
}
