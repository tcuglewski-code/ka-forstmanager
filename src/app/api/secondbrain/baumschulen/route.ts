import { NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const suche = searchParams.get("suche") || ""
    const betriebsart = searchParams.get("betriebsart") || ""
    const sort = searchParams.get("sort") || "name"
    const order = searchParams.get("order") === "desc" ? "DESC" : "ASC"
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const offset = parseInt(searchParams.get("offset") || "0")

    let where = "1=1"
    const params: any[] = []
    let i = 1

    if (suche) {
      where += ` AND (name ILIKE $${i} OR ort ILIKE $${i})`
      params.push(`%${suche}%`)
      i++
    }
    if (betriebsart) {
      where += ` AND betriebsart = $${i}`
      params.push(betriebsart)
      i++
    }

    const validSorts = ["name", "betriebsart", "ort", "betriebsart_code"]
    const sortCol = validSorts.includes(sort) ? sort : "name"

    const [data, countResult, betriebsartenResult] = await Promise.all([
      querySecondBrain(
        `SELECT id, name, betriebsart, betriebsart_code, ort, plz, bundesland, betriebsnummer, ist_partner
         FROM baumschulen WHERE ${where}
         ORDER BY ${sortCol} ${order} NULLS LAST
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset]
      ),
      querySecondBrain(`SELECT COUNT(*) FROM baumschulen WHERE ${where}`, params),
      querySecondBrain(
        `SELECT DISTINCT betriebsart FROM baumschulen WHERE betriebsart IS NOT NULL ORDER BY betriebsart`,
        []
      ),
    ])

    return NextResponse.json({
      data,
      total: parseInt(countResult[0].count),
      betriebsarten: betriebsartenResult.map((r: any) => r.betriebsart),
    })
  } catch (error) {
    console.error("SecondBrain baumschulen error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
