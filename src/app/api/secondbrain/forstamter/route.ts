import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const suche = searchParams.get("suche") || ""
    const bundesland = searchParams.get("bundesland") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const offset = parseInt(searchParams.get("offset") || "0")

    const params: any[] = []
    const conditions: string[] = []
    let idx = 1

    if (suche) {
      conditions.push(`(
        fk.funktion ILIKE $${idx} OR 
        fk.vorname ILIKE $${idx} OR 
        fk.nachname ILIKE $${idx} OR 
        fk.email ILIKE $${idx} OR
        fa.name ILIKE $${idx} OR
        fa.ort ILIKE $${idx}
      )`)
      params.push(`%${suche}%`)
      idx++
    }

    if (bundesland) {
      conditions.push(`bl.kuerzel = $${idx}`)
      params.push(bundesland)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const sort = searchParams.get("sort") || "forstamt"
    const order = searchParams.get("order") === "desc" ? "DESC" : "ASC"
    const sortExpr =
      sort === "name"
        ? `fk.nachname ${order} NULLS LAST, fk.vorname ${order} NULLS LAST`
        : sort === "ort"
        ? `fa.ort ${order} NULLS LAST`
        : sort === "bundesland"
        ? `bl.name ${order} NULLS LAST`
        : `fa.name ${order} NULLS LAST, fk.nachname ASC, fk.vorname ASC`

    const sql = `
      SELECT 
        fk.id,
        fk.forstamt_id,
        fk.vorname,
        fk.nachname,
        fk.titel,
        fk.funktion,
        fk.funktion_kategorie,
        fk.revier,
        fk.telefon,
        fk.mobil,
        fk.email,
        fa.name AS forstamt_name,
        fa.ort,
        fa.plz,
        fa.adresse,
        bl.name AS bundesland_name,
        bl.kuerzel AS bundesland_kuerzel
      FROM forstamt_kontakte fk
      LEFT JOIN forstamter fa ON fk.forstamt_id = fa.id
      LEFT JOIN bundeslaender bl ON fa.bundesland_id = bl.id
      ${where}
      ORDER BY ${sortExpr}
      LIMIT $${idx} OFFSET $${idx + 1}
    `
    params.push(limit, offset)

    const rows = await querySecondBrain(sql, params)

    const countSql = `
      SELECT COUNT(*) as total
      FROM forstamt_kontakte fk
      LEFT JOIN forstamter fa ON fk.forstamt_id = fa.id
      LEFT JOIN bundeslaender bl ON fa.bundesland_id = bl.id
      ${where}
    `
    const countRows = await querySecondBrain(countSql, params.slice(0, -2))

    return NextResponse.json({
      data: rows,
      total: parseInt(countRows[0]?.total || "0"),
      limit,
      offset,
    })
  } catch (error) {
    console.error("SecondBrain forstamter error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
