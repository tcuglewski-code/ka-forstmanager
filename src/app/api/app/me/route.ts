import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Try mitarbeiterId from token first, then fall back to lookup via User.id (sub)
  let mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  const sub = typeof appUser.sub === "string" ? appUser.sub : null

  if (!mitarbeiterId && sub) {
    const linked = await prisma.mitarbeiter.findFirst({
      where: { userId: sub },
      select: { id: true },
    })
    mitarbeiterId = linked?.id ?? null
  }

  if (!mitarbeiterId) return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 404 })

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
    include: { gruppen: { include: { gruppe: { select: { id: true, name: true } } } } },
  })
  if (!mitarbeiter) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(mitarbeiter)
})
