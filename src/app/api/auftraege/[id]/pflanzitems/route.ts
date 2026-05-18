import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/auftraege/[id]/pflanzitems — Dashboard (NextAuth)
export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: auftragId } = await params

  const items = await prisma.auftragPflanzItem.findMany({
    where: { auftragId },
    include: {
      preisliste: {
        select: {
          id: true,
          baumschuleId: true,
          baumschule: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(items)
})
