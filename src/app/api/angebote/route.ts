import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const status = url.searchParams.get("status")

  const data = await prisma.angebot.findMany({
    where: status ? { status } : {},
    include: {
      auftrag: { select: { id: true, titel: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  // Auto-Nummer generieren
  const last = await prisma.angebot.findFirst({
    orderBy: { createdAt: "desc" },
    where: { nummer: { not: null } },
  })
  const lastNum = last?.nummer ? parseInt(last.nummer.replace(/\D/g, "")) : 0
  const nummer = body.nummer ?? `AN-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, "0")}`

  // Gesamtpreis berechnen falls nicht angegeben
  let gesamtpreis = body.gesamtpreis
  if (!gesamtpreis) {
    // Aus SystemConfig laden
    const configs = await prisma.systemConfig.findMany()
    const configMap: Record<string, string> = {}
    for (const c of configs) configMap[c.key] = c.value

    const vollkosten = parseFloat(configMap.vollkosten_pro_stunde ?? "43.50")

    // Kalkulationsoptionen:
    if (body.baumanzahl && body.preisProBaum) {
      gesamtpreis = parseFloat(body.baumanzahl) * parseFloat(body.preisProBaum)
    } else if (body.flaeche_ha) {
      const preisProHa = parseFloat(configMap.preis_pro_ha ?? "1800")
      gesamtpreis = parseFloat(body.flaeche_ha) * preisProHa
    } else if (body.stundenSchaetzung) {
      gesamtpreis = parseFloat(body.stundenSchaetzung) * vollkosten
    }
  }

  const data = await prisma.angebot.create({
    data: {
      nummer,
      auftragId: body.auftragId ?? null,
      waldbesitzerName: body.waldbesitzerName ?? null,
      waldbesitzerEmail: body.waldbesitzerEmail ?? null,
      flaeche_ha: body.flaeche_ha ? parseFloat(body.flaeche_ha) : null,
      baumanzahl: body.baumanzahl ? parseInt(body.baumanzahl) : null,
      preisProBaum: body.preisProBaum ? parseFloat(body.preisProBaum) : null,
      stundenSchaetzung: body.stundenSchaetzung ? parseFloat(body.stundenSchaetzung) : null,
      gesamtpreis: gesamtpreis ? parseFloat(String(gesamtpreis)) : null,
      beschreibung: body.beschreibung ?? null,
      status: "entwurf",
      gueltigBis: body.gueltigBis
        ? new Date(body.gueltigBis)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notizen: body.notizen ?? null,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
