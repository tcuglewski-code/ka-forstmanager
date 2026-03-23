import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"
import { getAppUser } from "@/lib/app-auth"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const bundesland = searchParams.get("bundesland") || ""
    const suche = searchParams.get("suche") || ""

    const params: any[] = []
    const conditions: string[] = ["status = 'OFFEN'"]
    let idx = 1

    if (bundesland) {
      conditions.push(`(bundesland = $${idx} OR bundesland IS NULL OR bundesland = '' OR ebene = 'bundesweit')`)
      params.push(bundesland)
      idx++
    }

    if (suche) {
      conditions.push(`(name ILIKE $${idx} OR foerdergegenstand ILIKE $${idx})`)
      params.push(`%${suche}%`)
      idx++
    }

    const where = `WHERE ${conditions.join(" AND ")}`

    const sql = `
      SELECT 
        id, name, ebene, bundesland, kategorie, foerderart, traeger,
        foerdergegenstand, foerdersatz, antragsfrist, url, status
      FROM foerderprogramme
      ${where}
      ORDER BY 
        CASE WHEN ebene = 'bundesweit' THEN 0 ELSE 1 END,
        name
    `

    const rows = await querySecondBrain(sql, params)

    return NextResponse.json({ data: rows, total: rows.length })
  } catch (error) {
    console.error("App foerderprogramme error:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
