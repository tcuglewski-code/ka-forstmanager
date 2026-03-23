import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const suche = searchParams.get("suche") || ""
    const bundesland = searchParams.get("bundesland") || ""
    const typ = searchParams.get("typ") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const offset = parseInt(searchParams.get("offset") || "0")

    const params: any[] = []
    const conditions: string[] = []
    let idx = 1

    if (suche) {
      conditions.push(`(name ILIKE $${idx} OR ort ILIKE $${idx} OR betriebsnummer ILIKE $${idx})`)
      params.push(`%${suche}%`)
      idx++
    }

    if (bundesland) {
      conditions.push(`bundesland = $${idx}`)
      params.push(bundesland)
      idx++
    }

    if (typ) {
      conditions.push(`typ ILIKE $${idx}`)
      params.push(`%${typ}%`)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT id, name, typ, ort, bundesland, plz, betriebsnummer, betriebsart, ist_partner, created_at
      FROM baumschulen
      ${where}
      ORDER BY name
      LIMIT $${idx} OFFSET $${idx + 1}
    `
    params.push(limit, offset)

    const rows = await querySecondBrain(sql, params)

    const countSql = `SELECT COUNT(*) as total FROM baumschulen ${where}`
    const countRows = await querySecondBrain(countSql, params.slice(0, -2))

    const bundeslaenderRows = await querySecondBrain(
      "SELECT DISTINCT bundesland FROM baumschulen WHERE bundesland IS NOT NULL ORDER BY bundesland"
    )
    const typenRows = await querySecondBrain(
      "SELECT DISTINCT typ FROM baumschulen WHERE typ IS NOT NULL ORDER BY typ"
    )

    return NextResponse.json({
      data: rows,
      total: parseInt(countRows[0]?.total || "0"),
      limit,
      offset,
      bundeslaender: bundeslaenderRows.map((r) => r.bundesland),
      typen: typenRows.map((r) => r.typ),
    })
  } catch (error) {
    console.error("SecondBrain baumschulen error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
