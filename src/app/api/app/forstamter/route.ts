import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"
import { getAppUser } from "@/lib/app-auth"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const suche = searchParams.get("suche") || ""
    const bundesland = searchParams.get("bundesland") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)

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

    const sql = `
      SELECT 
        fk.id,
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
        fa.telefon AS forstamt_telefon,
        fa.email AS forstamt_email,
        bl.name AS bundesland_name,
        bl.kuerzel AS bundesland_kuerzel
      FROM forstamt_kontakte fk
      LEFT JOIN forstamter fa ON fk.forstamt_id = fa.id
      LEFT JOIN bundeslaender bl ON fa.bundesland_id = bl.id
      ${where}
      ORDER BY fa.name, fk.nachname, fk.vorname
      LIMIT $${idx}
    `
    params.push(limit)

    const rows = await querySecondBrain(sql, params)

    return NextResponse.json({ data: rows, total: rows.length })
  } catch (error) {
    console.error("App forstamter error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
