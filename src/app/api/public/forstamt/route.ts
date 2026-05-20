/**
 * Public API: Forstamt-Suche nach PLZ
 * Kein Auth nötig — für WP Website Wizard
 *
 * GET /api/public/forstamt?plz=83052
 * Returns: [{ name, plz, ort, telefon, email }]
 */

import { NextRequest, NextResponse } from "next/server"
import pg from "pg"

const ALLOWED_ORIGIN = "https://peru-otter-113714.hostingersite.com"

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
}

const errorHeaders = {
  ...corsHeaders,
  "Cache-Control": "no-store",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  const plz = req.nextUrl.searchParams.get("plz")
  if (!plz || plz.length < 2) {
    return NextResponse.json([], { headers: corsHeaders })
  }

  // SECOND_BRAIN_URL muss als Vercel-Env gesetzt sein (kein hardcoded Fallback aus Security-Gründen).
  // API-Contract: bleibt JSON-Array (WP-Wizard erwartet data[0].name).
  // Fehler werden via x-forstamt-error Header signalisiert (für Diagnostik), nicht im Body.
  const connStr = process.env.SECOND_BRAIN_URL
  if (!connStr) {
    console.error("[Forstamt API] SECOND_BRAIN_URL env var missing")
    return NextResponse.json([], {
      headers: { ...errorHeaders, "x-forstamt-error": "config_missing" },
    })
  }

  // Match by PLZ prefix (first 2 digits = same region)
  const prefix = plz.substring(0, 2)

  const client = new pg.Client({ connectionString: connStr })
  try {
    await client.connect()
    // Exakter PLZ-Match zuerst, dann Prefix-Match nach PLZ aufsteigend
    const result = await client.query(
      `SELECT name, plz, ort, telefon, email
       FROM forstamter
       WHERE plz LIKE $1
       ORDER BY (plz = $2) DESC, plz ASC
       LIMIT 10`,
      [`${prefix}%`, plz]
    )
    return NextResponse.json(result.rows, { headers: corsHeaders })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[Forstamt API] DB query failed:", msg)
    // Kürzer Snippet im Header (kein Stack, keine Creds — pg-Errors sind generisch)
    const snippet = msg.substring(0, 120).replace(/[^\x20-\x7E]/g, "")
    return NextResponse.json([], {
      headers: { ...errorHeaders, "x-forstamt-error": snippet || "db_error" },
    })
  } finally {
    await client.end().catch(() => {})
  }
}
