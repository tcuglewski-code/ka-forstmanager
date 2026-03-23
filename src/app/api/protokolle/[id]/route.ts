import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const proto = await prisma.tagesprotokoll.findUnique({
    where: { id },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  if (!proto) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(proto)
}
