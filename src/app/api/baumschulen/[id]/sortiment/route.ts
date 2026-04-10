import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Sortiment einer Baumschule abrufen
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

  // Nur eigene Baumschule oder Admin
  const userRole = session.user.role
  const userBaumschuleId = session.user.baumschuleId
  if (userRole === "baumschule" && userBaumschuleId !== baumschuleId) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }
  if (userRole !== "baumschule" && userRole !== "ka_admin") {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const sortiment = await prisma.baumschulPreisliste.findMany({
    where: { baumschuleId },
    orderBy: [{ verfuegbar: "desc" }, { baumart: "asc" }],
  })

  return NextResponse.json({ baumschule, sortiment })
}

// POST: Neuen Sortiment-Eintrag erstellen
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, userId: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const userRole = session.user.role
  const userBaumschuleId = session.user.baumschuleId
  if (userRole === "baumschule" && userBaumschuleId !== baumschuleId) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }
  if (userRole !== "baumschule" && userRole !== "ka_admin") {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const body = await req.json()
  const { baumart, preis, einheit, saison, aktiv, notizen, menge, verfuegbar } = body

  if (!baumart?.trim()) {
    return NextResponse.json({ error: "Baumart ist Pflichtfeld" }, { status: 400 })
  }
  if (preis == null || isNaN(parseFloat(preis))) {
    return NextResponse.json({ error: "Preis ist Pflichtfeld und muss eine Zahl sein" }, { status: 400 })
  }

  const eintrag = await prisma.baumschulPreisliste.create({
    data: {
      baumschuleId,
      baumart: baumart.trim(),
      preis: parseFloat(preis),
      einheit: einheit?.trim() ?? "kg",
      saison: saison?.trim() ?? null,
      aktiv: aktiv !== false,
      notizen: notizen?.trim() ?? null,
      menge: menge != null ? parseInt(menge) : null,
      verfuegbar: verfuegbar !== false,
    },
  })

  return NextResponse.json(eintrag, { status: 201 })
}
