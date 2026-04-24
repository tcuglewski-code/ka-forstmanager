/**
 * Public API: Forstamt-Suche nach PLZ
 * Kein Auth nötig — für WP Website Wizard
 *
 * GET /api/public/forstamt?plz=83052
 * Returns: [{ name, plz, ort, telefon, email }]
 */

import { NextRequest, NextResponse } from "next/server"
import pg from "pg"

const SECOND_BRAIN_URL =
  process.env.SECOND_BRAIN_URL ||
  "postgresql://neondb_owner:npg_1GXdqethC2bJ@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/SecondBrainKADB?sslmode=require"

const ALLOWED_ORIGIN = "https://peru-otter-113714.hostingersite.com"

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  const plz = req.nextUrl.searchParams.get("plz")
  if (!plz || plz.length < 2) {
    return NextResponse.json([], { headers: corsHeaders })
  }

  // Match by PLZ prefix (first 2 digits = same region)
  const prefix = plz.substring(0, 2)

  const client = new pg.Client({ connectionString: SECOND_BRAIN_URL })
  try {
    await client.connect()
    const result = await client.query(
      `SELECT name, plz, ort, telefon, email
       FROM forstamter
       WHERE plz LIKE $1
       ORDER BY plz ASC
       LIMIT 10`,
      [`${prefix}%`]
    )
    return NextResponse.json(result.rows, { headers: corsHeaders })
  } catch (err) {
    console.error("[Forstamt API]", err)
    return NextResponse.json([], { headers: corsHeaders })
  } finally {
    await client.end().catch(() => {})
  }
}
