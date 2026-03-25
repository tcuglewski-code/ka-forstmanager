import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const saisonId = url.searchParams.get("saisonId")

  const abrechnungen = await prisma.lohnabrechnung.findMany({
    where: saisonId ? { saisonId } : {},
    include: {
      mitarbeiter: { select: { vorname: true, nachname: true, stundenlohn: true } },
      saison: { select: { name: true } }
    },
    orderBy: { createdAt: "asc" }
  })

  const BOM = "\uFEFF"
  const headers = [
    "Mitarbeiter",
    "Saison",
    "Zeitraum Von",
    "Zeitraum Bis",
    "Stunden",
    "Bruttolohn (€)",
    "Maschinenbonus (€)",
    "Vorschüsse (€)",
    "Auszahlung (€)",
    "Status",
  ]

  const rows = abrechnungen.map(a => [
    `${a.mitarbeiter?.vorname ?? ""} ${a.mitarbeiter?.nachname ?? ""}`.trim(),
    a.saison?.name ?? "",
    a.zeitraumVon ? new Date(a.zeitraumVon).toLocaleDateString("de-DE") : "",
    a.zeitraumBis ? new Date(a.zeitraumBis).toLocaleDateString("de-DE") : "",
    (a.stunden ?? 0).toFixed(1),
    (a.bruttoLohn ?? 0).toFixed(2).replace(".", ","),
    (a.maschinenBonus ?? 0).toFixed(2).replace(".", ","),
    (a.vorschuesse ?? 0).toFixed(2).replace(".", ","),
    (a.auszahlung ?? 0).toFixed(2).replace(".", ","),
    a.status ?? "",
  ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))

  const csv = BOM + [headers.map(h => `"${h}"`).join(";"), ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="datev-lohn-${new Date().toISOString().slice(0, 10)}.csv"`,
    }
  })
}
