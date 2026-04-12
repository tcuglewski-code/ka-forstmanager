/**
 * Public API Endpoint: Baumschulen-Liste
 * Gibt alle aktiven Baumschulen mit Spezialisierung zurück
 * Kein Auth nötig — für WP Website Wizard
 *
 * GET /api/public/baumschulen
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_ORIGIN = "https://peru-otter-113714.hostingersite.com"

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET() {
  const headers = { ...corsHeaders }

  try {
    const baumschulen = await prisma.baumschule.findMany({
      where: { aktiv: true },
      select: {
        id: true,
        name: true,
        ort: true,
        bundesland: true,
        preislisten: {
          where: { aktiv: true, verfuegbar: true },
          select: { baumart: true },
        },
        _count: {
          select: { preislisten: { where: { aktiv: true } } },
        },
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
        spezialisierung: baumarten,
        preislisten_count: b._count.preislisten,
      }
    })

    return NextResponse.json(
      { baumschulen: result },
      { status: 200, headers }
    )
  } catch (err) {
    console.error("[Public API] Baumschulen-Liste Fehler:", err)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500, headers }
    )
  }
}
