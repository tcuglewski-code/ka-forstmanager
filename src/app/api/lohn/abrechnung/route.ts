import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const mitarbeiterId = url.searchParams.get("mitarbeiterId")
  const saisonId = url.searchParams.get("saisonId")

  const abrechnungen = await prisma.lohnabrechnung.findMany({
    where: {
      ...(mitarbeiterId ? { mitarbeiterId } : {}),
      ...(saisonId ? { saisonId } : {}),
    },
    include: {
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      saison: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(abrechnungen)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { mitarbeiterId, saisonId, zeitraumVon, zeitraumBis } = body

  if (!mitarbeiterId) return NextResponse.json({ error: "mitarbeiterId fehlt" }, { status: 400 })

  // Falls saisonId angegeben: erst Auftrags-IDs laden (Stundeneintrag hat keine direkte Saison-Relation)
  let auftragIdFilter: { in: string[] } | undefined
  if (saisonId) {
    const auftraege = await prisma.auftrag.findMany({
      where: { saisonId },
      select: { id: true },
    })
    auftragIdFilter = { in: auftraege.map((a) => a.id) }
  }

  // Alle Stunden im Zeitraum laden
  const stunden = await prisma.stundeneintrag.findMany({
    where: {
      mitarbeiterId,
      datum: {
        gte: zeitraumVon ? new Date(zeitraumVon) : undefined,
        lte: zeitraumBis ? new Date(zeitraumBis) : undefined,
      },
      ...(auftragIdFilter ? { auftragId: auftragIdFilter } : {}),
    },
    include: {
      mitarbeiter: { select: { stundenlohn: true, vollkostenSatz: true } },
    },
  })

  // SystemConfig laden
  const configs = await prisma.systemConfig.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configs) configMap[c.key] = c.value
  const vollkostenDefault = parseFloat(configMap.vollkosten_pro_stunde ?? "43.50")

  let gesamtStunden = 0
  let bruttoLohn = 0
  let gesamtLohn = 0
  let maschinenBonus = 0

  for (const e of stunden) {
    const std = e.stunden ?? 0
    gesamtStunden += std
    const nettolohn = e.stundenlohn ?? e.mitarbeiter?.stundenlohn ?? 12
    const vollkosten = e.mitarbeiter?.vollkostenSatz ?? vollkostenDefault
    const mBonus = e.maschinenzuschlag ?? 0
    bruttoLohn += std * nettolohn
    gesamtLohn += std * vollkosten
    maschinenBonus += std * mBonus
  }

  // Vorschüsse im Zeitraum
  const vorschuesse = await prisma.vorschuss.findMany({
    where: {
      mitarbeiterId,
      datum: {
        gte: zeitraumVon ? new Date(zeitraumVon) : undefined,
        lte: zeitraumBis ? new Date(zeitraumBis) : undefined,
      },
    },
  })
  const vorschussGesamt = vorschuesse.reduce((s, v) => s + (v.betrag ?? 0), 0)

  const auszahlung = bruttoLohn + maschinenBonus - vorschussGesamt

  const abrechnung = await prisma.lohnabrechnung.create({
    data: {
      mitarbeiterId,
      saisonId: saisonId ?? null,
      zeitraumVon: zeitraumVon ? new Date(zeitraumVon) : new Date(),
      zeitraumBis: zeitraumBis ? new Date(zeitraumBis) : new Date(),
      stunden: gesamtStunden,
      bruttoLohn,
      gesamtLohn,
      maschinenBonus,
      vorschuesse: vorschussGesamt,
      auszahlung,
      status: "erstellt",
      notizen: body.notizen ?? null,
    },
    include: {
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
    },
  })

  return NextResponse.json(abrechnung, { status: 201 })
}
