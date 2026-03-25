import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const logs = await prisma.auftragLog.findMany({
    where: { auftragId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(logs)
}
