import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const von = url.searchParams.get("von")
  const bis = url.searchParams.get("bis")

  const rechnungen = await prisma.rechnung.findMany({
    where: {
      createdAt: {
        gte: von ? new Date(von) : undefined,
        lte: bis ? new Date(bis) : undefined,
      }
    },
    include: { auftrag: { select: { titel: true, waldbesitzer: true } } },
    orderBy: { createdAt: "asc" }
  })

  // DATEV CSV Format (Buchungsstapel)
  const BOM = "\uFEFF"
  const headers = [
    "Umsatz (ohne Soll/Haben-Kz)",
    "Soll/Haben-Kennzeichen",
    "WKZ Umsatz",
    "Kurs",
    "Basis-Umsatz",
    "WKZ Basis-Umsatz",
    "Konto",
    "Gegenkonto (ohne BU-Schlüssel)",
    "BU-Schlüssel",
    "Belegdatum",
    "Belegfeld 1",
    "Belegfeld 2",
    "Skonto",
    "Buchungstext",
  ]

  const rows = rechnungen.map(r => {
    const betrag = (r.betrag ?? 0).toFixed(2).replace(".", ",")
    const datum = r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }).replace(/\./g, "")
      : ""
    const text = `${r.auftrag?.waldbesitzer ?? r.auftrag?.titel ?? ""} ${r.nummer ?? ""}`.trim()
    return [
      betrag,
      "S",
      "EUR",
      "",
      "",
      "",
      "8400",   // Erlöskonto (anpassen nach Bedarf)
      "10000",  // Debitorenkonto
      "",
      datum,
      r.nummer ?? "",
      "",
      "",
      text.substring(0, 60),
    ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")
  })

  const csv = BOM + [headers.map(h => `"${h}"`).join(";"), ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="datev-rechnungen-${new Date().toISOString().slice(0, 10)}.csv"`,
    }
  })
}
