import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
// Sprint AG: E-Mail-Benachrichtigung beim Erstellen eines Auftrags
import { emailService } from "@/lib/email"

export async function GET(req: NextRequest) {
  // ⚠️ GET ist auth-geschützt — Aufträge sind interne Dashboard-Daten
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const typ = searchParams.get("typ")
  const search = searchParams.get("search")

  // Paginierung (Sprint P)
  const take = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)
  const skip = parseInt(searchParams.get("offset") ?? "0")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (status) where.status = status
  if (typ) where.typ = typ

  // Sprint UX: Schnellsuche
  if (search) {
    where.OR = [
      { titel: { contains: search, mode: "insensitive" } },
      { nummer: { contains: search, mode: "insensitive" } },
      { waldbesitzer: { contains: search, mode: "insensitive" } },
      { standort: { contains: search, mode: "insensitive" } },
    ]
  }

  const [auftraege, total] = await Promise.all([
    prisma.auftrag.findMany({
      where,
      include: {
        saison: { select: { id: true, name: true } },
        gruppe: { select: { id: true, name: true } },
      },
      orderBy: { wpErstelltAm: "desc" },
      take,
      skip,
    }),
    prisma.auftrag.count({ where }),
  ])

  return NextResponse.json(auftraege, {
    headers: { "X-Total-Count": String(total) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    // Pflichtfeld-Validierung (Sprint P)
    if (!body.titel?.trim()) {
      return NextResponse.json({ error: "titel ist ein Pflichtfeld" }, { status: 400 })
    }
    if (!body.typ) {
      return NextResponse.json({ error: "Pflichtfelder fehlen: typ" }, { status: 400 })
    }

    // Sprint Q: Auto-Auftragsnummer generieren falls nicht angegeben
    let auftragNummer = body.nummer?.trim() || null
    if (!auftragNummer) {
      const lastAuftrag = await prisma.auftrag.findFirst({
        orderBy: { createdAt: "desc" },
        where: { nummer: { not: null } },
        select: { nummer: true },
      })
      const lastNum = lastAuftrag?.nummer
        ? parseInt(lastAuftrag.nummer.replace(/\D/g, "")) || 0
        : 0
      auftragNummer = `AU-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, "0")}`
    }

    const auftrag = await prisma.auftrag.create({
      data: {
        nummer: auftragNummer,
        titel: body.titel,
        typ: body.typ,
        status: body.status ?? "anfrage",
        beschreibung: body.beschreibung ?? null,
        flaeche_ha: body.flaeche_ha ? parseFloat(body.flaeche_ha) : null,
        standort: body.standort ?? null,
        bundesland: body.bundesland ?? null,
        waldbesitzer: body.waldbesitzer ?? null,
        waldbesitzerEmail: body.waldbesitzerEmail ?? null,
        wpProjektId: body.wpProjektId ?? null,
        saisonId: body.saisonId ?? null,
        gruppeId: body.gruppeId ?? null,
        startDatum: body.startDatum ? new Date(body.startDatum) : null,
        endDatum: body.endDatum ? new Date(body.endDatum) : null,
      },
    })
    // Sprint AG: E-Mail-Benachrichtigung — Auftrag erstellt
    emailService.auftragErstellt({
      auftragId: auftrag.id,
      auftragNummer: auftrag.nummer ?? auftrag.id,
      auftragTitel: auftrag.titel,
      waldbesitzerName: auftrag.waldbesitzer ?? undefined,
      waldbesitzerEmail: auftrag.waldbesitzerEmail ?? undefined,
      flaeche_ha: auftrag.flaeche_ha ?? undefined,
      standort: auftrag.standort ?? undefined,
    }).catch((err) => console.error("[Email] auftragErstellt fehlgeschlagen:", err))

    return NextResponse.json(auftrag, { status: 201 })
  } catch (error) {
    console.error("[Auftraege POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
