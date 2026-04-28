import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as { email?: string; role?: string }

  if (!user.email) return NextResponse.json({ items: [], total: 0 })

  const mitarbeiter = await prisma.mitarbeiter.findFirst({
    where: { email: user.email, deletedAt: null },
    select: { id: true },
  })

  if (!mitarbeiter) return NextResponse.json({ items: [], total: 0 })

  const items = await prisma.dokument.findMany({
    where: {
      mitarbeiterId: mitarbeiter.id,
      deletedAt: null,
      vertraulich: false,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ items, total: items.length })
}
