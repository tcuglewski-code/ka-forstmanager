import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const flaeche = await prisma.registerFlaeche.findUnique({
      where: { id },
      include: {
        quelle: true,
        profil: true,
        wetterDaten: { orderBy: { datum: "desc" }, take: 5 },
      },
    })
    if (!flaeche) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    return NextResponse.json(flaeche)
  } catch (err) {
    console.error("GET /api/saatguternte/register/[id]", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, notizen, bewertung, naechsteErnte, letzteInspektion } = body

    // letzteAktualisierung auf RegisterFlaeche setzen
    await prisma.registerFlaeche.update({
      where: { id },
      data: { letzteAktualisierung: new Date() },
    }).catch(() => {}) // ignorieren falls nicht existent

    // Upsert FlaechenProfil
    const profil = await prisma.flaechenProfil.upsert({
      where: { flaecheId: id },
      create: {
        flaecheId: id,
        status: status ?? "ungeprüft",
        notizen: notizen ?? null,
        bewertung: bewertung ?? null,
        naechsteErnte: naechsteErnte ? new Date(naechsteErnte) : null,
        letzteInspektion: letzteInspektion ? new Date(letzteInspektion) : null,
      },
      update: {
        ...(status !== undefined && { status }),
        ...(notizen !== undefined && { notizen }),
        ...(bewertung !== undefined && { bewertung }),
        ...(naechsteErnte !== undefined && { naechsteErnte: naechsteErnte ? new Date(naechsteErnte) : null }),
        ...(letzteInspektion !== undefined && { letzteInspektion: letzteInspektion ? new Date(letzteInspektion) : null }),
      },
    })

    return NextResponse.json(profil)
  } catch (err) {
    console.error("PATCH /api/saatguternte/register/[id]", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
