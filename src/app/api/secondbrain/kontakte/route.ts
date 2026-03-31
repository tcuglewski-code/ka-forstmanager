import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Pool } from "pg"

// KC-4: Second Brain API für Forstamt-Kontakte
// Verbindung zur SecondBrainKADB Neon-Datenbank

const secondBrainPool = new Pool({
  connectionString: process.env.SECONDBRAIN_DATABASE_URL || 
    "postgresql://neondb_owner:REDACTED_DB_PASSWORD@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/SecondBrainKADB?sslmode=require",
  ssl: { rejectUnauthorized: false },
  max: 5,
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""
  const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 20)

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    const result = await secondBrainPool.query(
      `SELECT name, ort, plz, email, telefon 
       FROM forstamt_kontakte 
       WHERE name ILIKE $1 
       ORDER BY name ASC 
       LIMIT $2`,
      [`%${query}%`, limit]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[SecondBrain Kontakte]", error)
    return NextResponse.json(
      { error: "Datenbankfehler", details: String(error) },
      { status: 500 }
    )
  }
}
