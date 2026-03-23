import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const suche = searchParams.get("suche") || ""
    const kategorie = searchParams.get("kategorie") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    const kategorienRows = await querySecondBrain(
      "SELECT DISTINCT topic_kategorie FROM forst_wissen WHERE topic_kategorie IS NOT NULL ORDER BY topic_kategorie"
    )
    const kategorien = kategorienRows.map((r) => r.topic_kategorie)

    if (!suche && !kategorie) {
      return NextResponse.json({ data: [], total: 0, kategorien })
    }

    const params: any[] = []
    const conditions: string[] = []
    let idx = 1

    if (suche) {
      conditions.push(`(chunk_text ILIKE $${idx} OR doc_title ILIKE $${idx} OR doc_source ILIKE $${idx})`)
      params.push(`%${suche}%`)
      idx++
    }

    if (kategorie) {
      conditions.push(`topic_kategorie ILIKE $${idx}`)
      params.push(`%${kategorie}%`)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT id, doc_title, doc_source, doc_type, chunk_text, chunk_index, page_ref, topic_kategorie, created_at
      FROM forst_wissen
      ${where}
      ORDER BY id
      LIMIT $${idx} OFFSET $${idx + 1}
    `
    params.push(limit, offset)

    const rows = await querySecondBrain(sql, params)

    const countSql = `SELECT COUNT(*) as total FROM forst_wissen ${where}`
    const countRows = await querySecondBrain(countSql, params.slice(0, -2))

    return NextResponse.json({
      data: rows,
      total: parseInt(countRows[0]?.total || "0"),
      limit,
      offset,
      kategorien,
    })
  } catch (error) {
    console.error("SecondBrain wissen error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
