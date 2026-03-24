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
  const where: Record<string, unknown> = {}
  if (typ) where.typ = typ
  if (auftragId) where.auftragId = auftragId
  if (saisonId) where.saisonId = saisonId
  const data = await prisma.dokument.findMany({
    where,
    include: {
      auftrag: { select: { id: true, titel: true } },
      saison: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(data)
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
