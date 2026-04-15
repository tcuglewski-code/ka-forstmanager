import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const logs = await prisma.auftragLog.findMany({
    where: { auftragId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(logs)
})
