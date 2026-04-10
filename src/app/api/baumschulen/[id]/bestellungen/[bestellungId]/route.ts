import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const VALID_STATUS = ["neu", "bestaetigt", "geliefert", "storniert"]

// PATCH: Bestellungs-Status aktualisieren
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; bestellungId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId, bestellungId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, userId: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const userRole = (session.user as any).role
  if (userRole === "baumschule" && baumschule.userId !== session.user.id) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const bestellung = await prisma.baumschulBestellung.findFirst({
    where: { id: bestellungId, baumschuleId },
  })
  if (!bestellung) {
    return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 })
  }

  const body = await req.json()

  if (body.status && !VALID_STATUS.includes(body.status)) {
    return NextResponse.json({ error: `Ungültiger Status. Erlaubt: ${VALID_STATUS.join(", ")}` }, { status: 400 })
  }

  const aktualisiert = await prisma.baumschulBestellung.update({
    where: { id: bestellungId },
    data: {
      status: body.status ?? undefined,
      notizen: body.notizen !== undefined ? (body.notizen?.trim() ?? null) : undefined,
    },
  })

  return NextResponse.json(aktualisiert)
}
