import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"

async function getUser(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (appUser) {
    return {
      id: (appUser as any).userId as string,
      role: (appUser as any).role as string,
      mitarbeiterId: (appUser as any).mitarbeiterId as string | undefined,
      isApp: true,
    }
  }
  const session = await auth()
  if (session?.user) {
    return {
      id: (session.user as any).id as string,
      role: (session.user as any).role as string,
      mitarbeiterId: undefined as string | undefined,
      isApp: false,
    }
  }
  return null
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const typ = searchParams.get("typ") ?? "lohn"
  const saisonId = searchParams.get("saisonId")
  const von = searchParams.get("von")
  const bis = searchParams.get("bis")

  const isAdmin = ["admin", "ka_admin"].includes(user.role ?? "")
  const isGF = user.role === "ka_gruppenführer" || user.role === "ka_gruppenfuhrer"

  let csvRows: string[] = []
  let filename = `export_${typ}_${new Date().toISOString().split("T")[0]}.csv`

  if (typ === "lohn") {
    const where: Record<string, unknown> = {}
    if (saisonId) {
      const auftraege = await prisma.auftrag.findMany({ where: { saisonId }, select: { id: true } })
      where.auftragId = { in: auftraege.map((a) => a.id) }
    }
    if (von && bis) where.datum = { gte: new Date(von), lte: new Date(bis) }

    if (!isAdmin && isGF && user.mitarbeiterId) {
      const gruppen = await prisma.gruppe.findMany({ where: { gruppenfuehrerId: user.mitarbeiterId }, select: { id: true } })
      const mitglieder = await prisma.gruppeMitglied.findMany({ where: { gruppeId: { in: gruppen.map((g) => g.id) } }, select: { mitarbeiterId: true } })
      where.mitarbeiterId = { in: mitglieder.map((m) => m.mitarbeiterId) }
    } else if (!isAdmin && user.mitarbeiterId) {
      where.mitarbeiterId = user.mitarbeiterId
    }

    const eintraege = await prisma.stundeneintrag.findMany({
      where,
      include: {
        mitarbeiter: { select: { vorname: true, nachname: true, stundenlohn: true } },
        auftrag: { select: { titel: true, typ: true } },
      },
      orderBy: { datum: "desc" },
    })

    csvRows = [
      "\uFEFF" + "Datum;Name;Auftrag;Stunden;Stundenlohn;Maschinenzuschlag;Gesamt",
      ...eintraege.map((e) => {
        const name = `${e.mitarbeiter.vorname} ${e.mitarbeiter.nachname}`
        const lohn = (e.mitarbeiter.stundenlohn ?? 0) * (e.stunden ?? 0)
        const maschine = (e.maschinenzuschlag ?? 0) * (e.stunden ?? 0)
        return `${new Date(e.datum).toLocaleDateString("de-DE")};${name};${e.auftrag?.titel ?? ""};${e.stunden ?? 0};${(e.mitarbeiter.stundenlohn ?? 0).toFixed(2)};${maschine.toFixed(2)};${(lohn + maschine).toFixed(2)}`
      }),
    ]
    filename = `lohnliste_${new Date().toISOString().split("T")[0]}.csv`
  } else if (typ === "gruppen") {
    const gruppenWhere: Record<string, unknown> = {}
    if (!isAdmin && isGF && user.mitarbeiterId) {
      const eigeneGruppen = await prisma.gruppe.findMany({ where: { gruppenfuehrerId: user.mitarbeiterId }, select: { id: true } })
      gruppenWhere.id = { in: eigeneGruppen.map((g) => g.id) }
    }
    const gruppen = await prisma.gruppe.findMany({
      where: gruppenWhere,
      include: { _count: { select: { mitglieder: true } } },
    })

    const protokolle = await prisma.tagesprotokoll.groupBy({
      by: ["gruppeId"],
      _sum: { gepflanztGesamt: true, flaecheBearbeitetHa: true },
      _count: { id: true },
      ...(saisonId ? { where: { auftrag: { saisonId } } } : {}),
    })
    const protokollMap = new Map(protokolle.map((p) => [p.gruppeId, p]))

    csvRows = [
      "\uFEFF" + "Gruppe;Mitarbeiter;Protokolle;Gepflanzt;Fläche (ha)",
      ...gruppen.map((g) => {
        const stats = protokollMap.get(g.id)
        return `${g.name};${g._count.mitglieder};${stats?._count.id ?? 0};${stats?._sum.gepflanztGesamt ?? 0};${(stats?._sum.flaecheBearbeitetHa ?? 0).toFixed(2)}`
      }),
    ]
    filename = `gruppen_report_${new Date().toISOString().split("T")[0]}.csv`
  } else if (typ === "mitarbeiter") {
    const where: Record<string, unknown> = {}
    if (von && bis) where.datum = { gte: new Date(von), lte: new Date(bis) }
    if (!isAdmin && user.mitarbeiterId) where.mitarbeiterId = user.mitarbeiterId

    const eintraege = await prisma.stundeneintrag.findMany({
      where,
      include: { mitarbeiter: { select: { vorname: true, nachname: true } } },
      orderBy: { datum: "desc" },
    })

    const byMA = new Map<string, { name: string; stunden: number; eintraege: number }>()
    for (const e of eintraege) {
      const name = `${e.mitarbeiter.vorname} ${e.mitarbeiter.nachname}`
      const key = e.mitarbeiterId
      const cur = byMA.get(key) ?? { name, stunden: 0, eintraege: 0 }
      byMA.set(key, { name, stunden: cur.stunden + (e.stunden ?? 0), eintraege: cur.eintraege + 1 })
    }

    csvRows = [
      "\uFEFF" + "Name;Stunden gesamt;Buchungen",
      ...[...byMA.values()].map((m) => `${m.name};${m.stunden.toFixed(1)};${m.eintraege}`),
    ]
    filename = `mitarbeiter_report_${new Date().toISOString().split("T")[0]}.csv`
  } else if (typ === "saison") {
    if (!saisonId) return NextResponse.json({ error: "saisonId required" }, { status: 400 })
    const saison = await prisma.saison.findUnique({ where: { id: saisonId } })
    const anmeldungen = await prisma.saisonAnmeldung.findMany({
      where: { saisonId },
      include: { mitarbeiter: { select: { vorname: true, nachname: true, email: true, rolle: true } } },
    })

    csvRows = [
      "\uFEFF" + "Name;Email;Rolle;Status;Anmeldedatum",
      ...anmeldungen.map(
        (a) =>
          `${a.mitarbeiter.vorname} ${a.mitarbeiter.nachname};${a.mitarbeiter.email ?? ""};${a.mitarbeiter.rolle};${a.status};${new Date(a.createdAt).toLocaleDateString("de-DE")}`
      ),
    ]
    filename = `saison_${saison?.name ?? saisonId}_${new Date().toISOString().split("T")[0]}.csv`
  } else {
    return NextResponse.json({ error: `Unknown typ: ${typ}` }, { status: 400 })
  }

  const csv = csvRows.join("\n")
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
})
