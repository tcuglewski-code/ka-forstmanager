// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const saison = sp.get("saison") ? parseInt(sp.get("saison")!) : undefined
    const baumart = sp.get("baumart") ?? undefined
    const bundesland = sp.get("bundesland") ?? undefined
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"))
    const limit = 25
    const skip = (page - 1) * limit

    const where: any = {}
    if (saison) where.saison = saison
    if (baumart) where.baumart = { contains: baumart, mode: "insensitive" }
    if (bundesland) {
      where.profil = {
        flaeche: { bundesland: { contains: bundesland, mode: "insensitive" } },
      }
    }

    const [ernten, total] = await Promise.all([
      prisma.ernte.findMany({
        where,
        orderBy: { datum: "desc" },
        skip,
        take: limit,
        include: {
          profil: {
            include: {
              flaeche: {
                select: {
                  id: true,
                  registerNr: true,
                  bundesland: true,
                  baumart: true,
                  flaecheHa: true,
                },
              },
            },
          },
          positionen: true,
        },
      }),
      prisma.ernte.count({ where }),
    ])

    return NextResponse.json({ ernten, total, page, limit })
  } catch (err) {
    console.error("GET /api/saatguternte/ernten", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profilId, saison, datum, baumart, mengeKgGesamt, notizen, positionen } = body

    if (!profilId || !saison || !datum || !baumart) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 })
    }

    // FlaechenProfil updaten falls status "ungeprüft"
    const profil = await prisma.flaechenProfil.findUnique({ where: { id: profilId } })
    if (profil && profil.status === "ungeprüft") {
      await prisma.flaechenProfil.update({
        where: { id: profilId },
        data: {
          status: "geprüft",
          letzteInspektion: new Date(datum),
        },
      })
    } else if (profil) {
      await prisma.flaechenProfil.update({
        where: { id: profilId },
        data: { letzteInspektion: new Date(datum) },
      })
    }

    // RegisterFlaeche letzteAktualisierung aktualisieren
    if (profil?.flaecheId) {
      await prisma.registerFlaeche.update({
        where: { id: profil.flaecheId },
        data: { letzteAktualisierung: new Date() },
      })
    }

    // Ernte erstellen
    const ernte = await prisma.ernte.create({
      data: {
        profilId,
        saison: parseInt(saison),
        datum: new Date(datum),
        baumart,
        mengeKgGesamt: mengeKgGesamt ? parseFloat(mengeKgGesamt) : null,
        notizen: notizen ?? null,
        exportiert: false,
        positionen: positionen?.length
          ? {
              create: positionen.map((p: any) => ({
                sammlerName: p.sammlerName,
                datum: new Date(p.datum),
                mengeKg: parseFloat(p.mengeKg),
                stunden: p.stunden ? parseFloat(p.stunden) : null,
                notizen: p.notizen ?? null,
              })),
            }
          : undefined,
      },
      include: { positionen: true },
    })

    return NextResponse.json(ernte, { status: 201 })
  } catch (err) {
    console.error("POST /api/saatguternte/ernten", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
