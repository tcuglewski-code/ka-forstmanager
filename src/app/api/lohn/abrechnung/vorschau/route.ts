import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

// GET /api/lohn/abrechnung/vorschau?mitarbeiterId=&saisonId=&zeitraumVon=&zeitraumBis=
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const mitarbeiterId = url.searchParams.get("mitarbeiterId")
  const saisonId = url.searchParams.get("saisonId")
  const zeitraumVon = url.searchParams.get("zeitraumVon")
  const zeitraumBis = url.searchParams.get("zeitraumBis")

  if (!mitarbeiterId) return NextResponse.json({ error: "mitarbeiterId fehlt" }, { status: 400 })

  // Falls saisonId angegeben: erst Auftrags-IDs laden
  let auftragIdFilter: { in: string[] } | undefined
  if (saisonId) {
    const auftraege = await prisma.auftrag.findMany({
      where: { saisonId },
      select: { id: true },
    })
    auftragIdFilter = { in: auftraege.map((a) => a.id) }
  }

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

  const configs = await prisma.systemConfig.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configs) configMap[c.key] = c.value
  const vollkostenDefault = parseFloat(configMap.vollkosten_pro_stunde ?? "43.50")

  let gesamtStunden = 0
  let bruttoLohn = 0
  let maschinenBonus = 0

  for (const e of stunden) {
    const std = e.stunden ?? 0
    gesamtStunden += std
    const nettolohn = e.stundenlohn ?? e.mitarbeiter?.stundenlohn ?? 12
    bruttoLohn += std * nettolohn
    maschinenBonus += std * (e.maschinenzuschlag ?? 0)
  }

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

  return NextResponse.json({
    stunden: gesamtStunden,
    bruttoLohn,
    maschinenBonus,
    vorschuesse: vorschussGesamt,
    auszahlung,
  })
}
