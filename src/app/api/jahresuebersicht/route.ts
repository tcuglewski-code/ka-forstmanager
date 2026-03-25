import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Alle Saisons laden
  const saisons = await prisma.saison.findMany({
    orderBy: { createdAt: "asc" },
  })

  // SystemConfig einmalig laden
  const configs = await prisma.systemConfig.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configs) configMap[c.key] = c.value
  const vollkosten = parseFloat(configMap.vollkosten_pro_stunde ?? "43.50")

  const result = []

  for (const saison of saisons) {
    const auftraege = await prisma.auftrag.findMany({ where: { saisonId: saison.id } })
    const auftragIds = auftraege.map(a => a.id)

    const [stunden, rechnungen, mitarbeiter] = await Promise.all([
      prisma.stundeneintrag.aggregate({
        where: { auftragId: { in: auftragIds } },
        _sum: { stunden: true }
      }),
      prisma.rechnung.findMany({
        where: { auftragId: { in: auftragIds } },
        select: { betrag: true, status: true }
      }),
      prisma.gruppeMitglied.findMany({
        where: { gruppe: { saisonId: saison.id } },
        distinct: ["mitarbeiterId"],
        select: { mitarbeiterId: true }
      })
    ])

    const umsatz = rechnungen.reduce((s, r) => s + (r.betrag ?? 0), 0)
    const gesamtStunden = stunden._sum?.stunden ?? 0
    const lohnkosten = gesamtStunden * vollkosten

    result.push({
      saison: {
        id: saison.id,
        name: saison.name,
        aktiv: saison.status === "aktiv",
        status: saison.status,
      },
      auftraege: auftraege.length,
      abgeschlossen: auftraege.filter(a => a.status === "abgeschlossen").length,
      mitarbeiter: mitarbeiter.length,
      gesamtStunden,
      umsatz,
      lohnkosten,
      deckungsbeitrag: umsatz - lohnkosten,
      marge: umsatz > 0 ? Math.round(((umsatz - lohnkosten) / umsatz) * 1000) / 10 : 0,
    })
  }

  const gesamt = {
    umsatz: result.reduce((s, r) => s + r.umsatz, 0),
    lohnkosten: result.reduce((s, r) => s + r.lohnkosten, 0),
    gesamtStunden: result.reduce((s, r) => s + r.gesamtStunden, 0),
    auftraege: result.reduce((s, r) => s + r.auftraege, 0),
    deckungsbeitrag: result.reduce((s, r) => s + r.deckungsbeitrag, 0),
  }

  const gesamtMarge = gesamt.umsatz > 0
    ? Math.round((gesamt.deckungsbeitrag / gesamt.umsatz) * 1000) / 10
    : 0

  return NextResponse.json({ saisons: result, gesamt: { ...gesamt, marge: gesamtMarge } })
}
