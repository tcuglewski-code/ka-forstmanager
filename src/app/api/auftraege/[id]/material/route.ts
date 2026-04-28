import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getAppUser } from "@/lib/app-auth"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const appUser = await getAppUser(req)
  const session = await auth()
  if (!appUser && !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [bewegungen, reservierungen] = await Promise.all([
    prisma.lagerBewegung.findMany({
      where: { auftragId: id },
      include: {
        artikel: { select: { id: true, name: true, einheit: true } },
        mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lagerReservierung.findMany({
      where: { auftragId: id },
      include: {
        artikel: { select: { id: true, name: true, einheit: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json({ reservierungen, bewegungen })
})
