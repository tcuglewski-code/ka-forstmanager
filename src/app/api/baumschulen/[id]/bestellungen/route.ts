import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Bestellungen einer Baumschule
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, name: true, userId: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const userRole = (session.user as any).role
  if (userRole === "baumschule" && baumschule.userId !== session.user.id) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const bestellungen = await prisma.baumschulBestellung.findMany({
    where: { baumschuleId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ bestellungen })
}
