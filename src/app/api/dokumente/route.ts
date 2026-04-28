import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const typ = searchParams.get("typ")
  const auftragId = searchParams.get("auftragId")
  const saisonId = searchParams.get("saisonId")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { deletedAt: null }

  // DSGVO: Rollen-basierter Filter (SEC-02)
  const user = session.user as { id?: string; role?: string; email?: string }
  const userRole = user.role ?? ""
  const isAdmin = ["admin", "ka_admin"].includes(userRole)
  const isNonAdmin =
    userRole === "ka_mitarbeiter" ||
    userRole === "ka_gruppenführer" ||
    userRole === "ka_gruppenfuhrer"

  if (isNonAdmin && user.email) {
    const ownMitarbeiter = await prisma.mitarbeiter.findFirst({
      where: { email: user.email, deletedAt: null },
      select: { id: true },
    })
    if (ownMitarbeiter) {
      where.mitarbeiterId = ownMitarbeiter.id
      where.vertraulich = false
    } else {
      return NextResponse.json({ items: [], total: 0, page: 1, totalPages: 0 })
    }
  }

  if (typ) where.typ = typ
  if (auftragId) where.auftragId = auftragId
  if (saisonId) where.saisonId = saisonId

  const [items, total] = await Promise.all([
    prisma.dokument.findMany({
      where,
      include: {
        auftrag: { select: { id: true, titel: true } },
        saison: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.dokument.count({ where }),
  ])
  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 })
  }

  // Pflichtfeld-Validierung
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Pflichtfeld fehlt: name" }, { status: 400 })
  }
  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json(
      {
        error: "Pflichtfeld fehlt: url",
        hinweis: "Datei zuerst via Nextcloud hochladen und die WebDAV-URL übergeben.",
      },
      { status: 400 }
    )
  }

  // Mindestens eine Zuordnung (Auftrag oder Saison) empfohlen — kein hartes Fehler
  if (!body.auftragId && !body.saisonId) {
    console.warn("[Dokumente POST] Dokument ohne Auftrag- oder Saison-Zuordnung erstellt")
  }

  const doc = await prisma.dokument.create({
    data: {
      name: body.name as string,
      typ: (body.typ as string) ?? "sonstiges",
      url: body.url as string,
      auftragId: (body.auftragId as string) ?? null,
      saisonId: (body.saisonId as string) ?? null,
      hochgeladenVon: session.user?.name ?? null,
    },
    include: {
      auftrag: { select: { id: true, titel: true } },
      saison: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(doc, { status: 201 })
}
