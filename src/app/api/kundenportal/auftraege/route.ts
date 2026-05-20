import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true },
  })

  if (!user || user.role !== "kunde") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const auftraege = await prisma.auftrag.findMany({
    where: { waldbesitzerEmail: user.email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      titel: true,
      status: true,
      typ: true,
      startDatum: true,
      endDatum: true,
      createdAt: true,
    },
  })

  return NextResponse.json(auftraege)
}
