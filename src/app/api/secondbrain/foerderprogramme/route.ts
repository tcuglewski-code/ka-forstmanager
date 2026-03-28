import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const suche = searchParams.get("suche") || ""
    const bundesland = searchParams.get("bundesland") || ""
    const kategorie = searchParams.get("kategorie") || ""
    const status = searchParams.get("status") || ""

    const params: any[] = []
    const conditions: string[] = []
    let idx = 1

    if (suche) {
      conditions.push(`(name ILIKE $${idx} OR foerdergegenstand ILIKE $${idx} OR traeger ILIKE $${idx})`)
      params.push(`%${suche}%`)
      idx++
    }

    if (bundesland) {
      conditions.push(`(bundesland = $${idx} OR bundesland IS NULL OR bundesland = '')`)
      params.push(bundesland)
      idx++
    }

    if (kategorie) {
      conditions.push(`kategorie ILIKE $${idx}`)
      params.push(`%${kategorie}%`)
      idx++
    }

    if (status) {
      conditions.push(`status = $${idx}`)
      params.push(status)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT 
        id, name, ebene, bundesland, kategorie, foerderart, traeger,
        bewilligungsstelle, zielgruppe, foerdergegenstand, foerderkulisse,
        foerdersatz, antragsfrist, antragsweg, foerdergrundlage, url, status,
        geprueft, verifiziert_am, erstellt_am, aktualisiert_am
      FROM foerderprogramme
      ${where}
      ORDER BY 
        CASE WHEN status = 'OFFEN' THEN 0 ELSE 1 END,
        name
    `

    // Parallele Abfragen: Daten, Gesamtzahl, Kategorien
    const [rows, countRows, kategorienRows] = await Promise.all([
      querySecondBrain(sql, params),
      querySecondBrain("SELECT COUNT(*) as total FROM foerderprogramme"),
      querySecondBrain(
        "SELECT DISTINCT kategorie FROM foerderprogramme WHERE kategorie IS NOT NULL ORDER BY kategorie"
      ),
    ])

    return NextResponse.json({
      data: rows,
      total: parseInt(countRows[0]?.total || "0"),
      filtered: rows.length,
      kategorien: kategorienRows.map((r) => r.kategorie),
    })
  } catch (error) {
    console.error("SecondBrain foerderprogramme error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
