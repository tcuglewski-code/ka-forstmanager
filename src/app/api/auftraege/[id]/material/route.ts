import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const bewegungen = await prisma.lagerBewegung.findMany({
    where: { auftragId: id },
    include: {
      artikel: { select: { id: true, name: true, einheit: true } },
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(bewegungen)
}
