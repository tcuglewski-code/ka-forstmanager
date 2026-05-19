/**
 * Public API Endpoint: Baumschulen-Liste
 *
 * GET /api/public/baumschulen
 *   - ohne Query: alle aktiven Baumschulen mit Spezialisierung (Phase 1 — Legacy)
 *   - mit ?baumart=X[&bundesland=Y]: gefilterte Lieferanten-Suche (BS-MKT-01 Phase 2)
 *
 * Kein Auth nötig — wird vom WP-Wizard auf der öffentlichen Website konsumiert.
 *
 * Datenschutz: Ausgeliefert werden NUR geschäftsbezogene Pflichtangaben für die
 * Auswahl-UI: Name, Ort, Bundesland, Spezialisierung, Preisinfo, ZÜF.
 * **KEINE Kontaktdaten** (E-Mail, Telefon, Ansprechpartner) werden zurückgegeben.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_ORIGIN = "https://peru-otter-113714.hostingersite.com"

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  const headers = { ...corsHeaders }

  try {
    const url = new URL(req.url)
    const baumart = url.searchParams.get("baumart")?.trim() || ""
    const bundesland = url.searchParams.get("bundesland")?.trim() || ""

    // Modus 1: Lieferanten-Suche (neuer Pfad — BS-MKT-01 Phase 2)
    if (baumart) {
      // Nur freigegebene Baumschulen ("aktiv") werden angezeigt
      const where: Record<string, unknown> = {
        status: "aktiv",
        aktiv: true,
        preislisten: {
          some: {
            baumart: { contains: baumart, mode: "insensitive" },
            verfuegbar: true,
            aktiv: true,
          },
        },
      }
      if (bundesland) {
        // Bundesweit (lieferBundeslaender = []) ODER passendes Bundesland angegeben
        where.OR = [
          { lieferBundeslaender: { isEmpty: true } },
          { lieferBundeslaender: { has: bundesland } },
        ]
      }

      const baumschulen = await prisma.baumschule.findMany({
        where,
        select: {
          id: true,
          name: true,
          ort: true,
          bundesland: true,
          zufZertifiziert: true,
          lieferBundeslaender: true,
          preislisten: {
            where: {
              baumart: { contains: baumart, mode: "insensitive" },
              verfuegbar: true,
              aktiv: true,
            },
            select: {
              baumart: true,
              preis: true,
              einheit: true,
              menge: true,
              min_bestellung: true,
              sorte: true,
              hkg: true,
              fovg: true,
              preis_pro_100: true,
            },
            orderBy: { preis: "asc" },
            take: 5,
          },
        },
        orderBy: [{ zufZertifiziert: "desc" }, { name: "asc" }],
        take: 50,
      })

      const result = baumschulen.map((b) => ({
        id: b.id,
        name: b.name,
        ort: b.ort,
        bundesland: b.bundesland,
        zufZertifiziert: b.zufZertifiziert,
        bundesweit: (b.lieferBundeslaender ?? []).length === 0,
        preise: b.preislisten.map((p) => ({
          baumart: p.baumart,
          preis: p.preis,
          einheit: p.einheit,
          preis_pro_100: p.preis_pro_100,
          min_bestellung: p.min_bestellung,
          sorte: p.sorte,
          hkg: p.hkg,
          fovg: p.fovg,
          verfuegbare_menge: p.menge,
        })),
      }))

      return NextResponse.json(
        { baumart, bundesland: bundesland || null, count: result.length, baumschulen: result },
        { status: 200, headers }
      )
    }

    // Modus 2: Legacy-Liste (alle aktiven Baumschulen mit Spezialisierung)
    const baumschulen = await prisma.baumschule.findMany({
      where: { aktiv: true, status: "aktiv" },
      select: {
        id: true,
        name: true,
        ort: true,
        bundesland: true,
        zufZertifiziert: true,
        preislisten: {
          where: { aktiv: true, verfuegbar: true },
          select: { baumart: true },
        },
        _count: { select: { preislisten: { where: { aktiv: true } } } },
      },
      orderBy: { name: "asc" },
    })

    const result = baumschulen.map((b) => {
      const baumarten = [...new Set(b.preislisten.map((p) => p.baumart))]
      return {
        id: b.id,
        name: b.name,
        ort: b.ort,
        bundesland: b.bundesland,
        zufZertifiziert: b.zufZertifiziert,
        spezialisierung: baumarten,
        preislisten_count: b._count.preislisten,
      }
    })

    return NextResponse.json({ baumschulen: result }, { status: 200, headers })
  } catch (err) {
    console.error("[Public API] Baumschulen-Liste Fehler:", err)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500, headers })
  }
}
