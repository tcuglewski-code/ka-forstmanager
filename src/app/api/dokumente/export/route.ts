/**
 * DOK-062: Steuerberater-Export (admin-only).
 * GET /api/dokumente/export?von=YYYY-MM-DD&bis=YYYY-MM-DD&status=GEBUCHT
 * → CSV (Semikolon, deutsches Dezimalkomma, UTF-8 BOM für Excel)
 * mit einer Zeile je Position inkl. Beleg-Metadaten.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import type { DokStatus } from "@prisma/client"

const DatenSchema = z
  .object({
    rechnungsNr: z.string().nullable().optional(),
    datum: z.string().nullable().optional(),
    lieferantName: z.string().nullable().optional(),
    lieferantUstId: z.string().nullable().optional(),
    gesamtBetrag: z.number().nullable().optional(),
    nettoBetrag: z.number().nullable().optional(),
    waehrung: z.string().optional(),
  })
  .passthrough()

function csvZelle(wert: string | number | null | undefined): string {
  if (wert === null || wert === undefined) return ""
  const s = typeof wert === "number" ? wert.toFixed(2).replace(".", ",") : String(wert)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const von = searchParams.get("von")
  const bis = searchParams.get("bis")
  const status = (searchParams.get("status") || "GEBUCHT") as DokStatus
  if (!["GEBUCHT", "REVIEW_ERFORDERLICH", "ABGELEHNT"].includes(status)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
  }

  const scans = await prisma.dokumentenScan.findMany({
    where: {
      status,
      deletedAt: null,
      ...(von ? { erstelltAm: { gte: new Date(von) } } : {}),
      ...(bis ? { erstelltAm: { ...(von ? { gte: new Date(von) } : {}), lte: new Date(`${bis}T23:59:59`) } } : {}),
    },
    include: { positionen: true },
    orderBy: { erstelltAm: "asc" },
  })

  // DokumentenScan hat keine Lieferant-Relation (nur lieferantId) → Namen nachladen
  const lieferantIds = [
    ...new Set(
      scans
        .map((s: { lieferantId: string | null }) => s.lieferantId)
        .filter((x: string | null): x is string => !!x)
    ),
  ]
  const lieferanten = lieferantIds.length
    ? await prisma.lieferant.findMany({ where: { id: { in: lieferantIds } }, select: { id: true, name: true } })
    : []
  const lieferantName = new Map<string, string>(lieferanten.map((l: { id: string; name: string }) => [l.id, l.name]))

  const kopf = [
    "BelegNr",
    "Belegdatum",
    "Typ",
    "Lieferant",
    "UStID",
    "Netto",
    "Brutto",
    "Waehrung",
    "Position",
    "Menge",
    "Einheit",
    "Einzelpreis",
    "Gesamtpreis",
    "MwStSatz",
    "Status",
    "Datei",
    "ScanID",
  ].join(";")

  const zeilen: string[] = [kopf]
  for (const s of scans) {
    const d = DatenSchema.safeParse(s.extrahierteDaten)
    const daten = d.success ? d.data : {}
    const basis = [
      csvZelle(daten.rechnungsNr ?? ""),
      csvZelle(daten.datum ?? ""),
      csvZelle(s.typ),
      csvZelle((s.lieferantId ? lieferantName.get(s.lieferantId) : null) ?? daten.lieferantName ?? ""),
      csvZelle(daten.lieferantUstId ?? ""),
      csvZelle(daten.nettoBetrag ?? null),
      csvZelle(daten.gesamtBetrag ?? null),
      csvZelle(daten.waehrung ?? "EUR"),
    ]
    if (s.positionen.length === 0) {
      zeilen.push([...basis, "", "", "", "", "", "", csvZelle(s.status), csvZelle(s.originalDateiName), s.id].join(";"))
    }
    for (const p of s.positionen) {
      zeilen.push(
        [
          ...basis,
          csvZelle(p.artikelBezeichnung),
          csvZelle(p.mengeErhalten ?? p.mengeErwartet),
          csvZelle(p.einheit),
          csvZelle(p.einzelpreis),
          csvZelle(p.gesamtpreis),
          csvZelle(p.mwstSatz),
          csvZelle(s.status),
          csvZelle(s.originalDateiName),
          s.id,
        ].join(";")
      )
    }
  }

  const csv = "\uFEFF" + zeilen.join("\r\n")
  const datum = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dokumente-export-${status.toLowerCase()}-${datum}.csv"`,
    },
  })
}
