// Sprint AI: Preislistenverwaltung für Baumschulen
// CRUD-Endpunkte für Baumschul-Preislisten

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Alle Preislisten einer Baumschule abrufen
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId } = await params

  // Baumschule existiert?
  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: {
      id: true,
      name: true,
      ort: true,
      bundesland: true,
      ansprechpartner: true,
      email: true,
      telefon: true,
      notizen: true,
      aktiv: true,
    },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const preislisten = await prisma.baumschulPreisliste.findMany({
    where: { baumschuleId },
    orderBy: [{ aktiv: "desc" }, { baumart: "asc" }],
  })

  return NextResponse.json({ baumschule, preislisten })
}

// POST: Neue Preisliste erstellen
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId } = await params
  const body = await req.json()

  const { baumart, preis, einheit, saison, aktiv, notizen } = body

  // Pflichtfelder
  if (!baumart?.trim()) {
    return NextResponse.json({ error: "Baumart ist Pflichtfeld" }, { status: 400 })
  }
  if (preis == null || isNaN(parseFloat(preis))) {
    return NextResponse.json({ error: "Preis ist Pflichtfeld und muss eine Zahl sein" }, { status: 400 })
  }

  // Baumschule existiert?
  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const preisliste = await prisma.baumschulPreisliste.create({
    data: {
      baumschuleId,
      baumart: baumart.trim(),
      preis: parseFloat(preis),
      einheit: einheit?.trim() ?? "kg",
      saison: saison?.trim() ?? null,
      aktiv: aktiv !== false,
      notizen: notizen?.trim() ?? null,
    },
  })

  return NextResponse.json(preisliste, { status: 201 })
}
