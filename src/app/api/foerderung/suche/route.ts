import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export const dynamic = "force-dynamic"

// Mapping für Fördertyp-Filter → Kategorien
const TYP_KATEGORIEN: Record<string, string[]> = {
  aufforstung: ["erstaufforstung", "wiederbewaldung"],
  waldumbau: ["waldumbau"],
  naturverjuengung: ["waldpflege", "waldschutz"],
  sonstiges: ["foerderung_allgemein", "forschung", "klimaanpassung", "zaunbau"],
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const bundesland = searchParams.get("bundesland") || ""
    const typ = searchParams.get("typ") || ""

    const params: any[] = []
    const conditions: string[] = []
    let idx = 1

    // Volltext-Suche (ILIKE Fallback)
    if (q.trim()) {
      conditions.push(
        `(name ILIKE $${idx} OR foerdergegenstand ILIKE $${idx} OR traeger ILIKE $${idx} OR foerdersatz ILIKE $${idx} OR kategorie ILIKE $${idx})`
      )
      params.push(`%${q.trim()}%`)
      idx++
    }

    // Bundesland-Filter
    if (bundesland && bundesland !== "Bundesweit") {
      conditions.push(`(bundesland = $${idx} OR ebene = 'bund')`)
      params.push(bundesland)
      idx++
    } else if (bundesland === "Bundesweit") {
      conditions.push(`ebene = 'bund'`)
    }

    // Fördertyp-Filter
    if (typ && TYP_KATEGORIEN[typ]) {
      const katList = TYP_KATEGORIEN[typ]
      const katConditions = katList
        .map(() => `kategorie ILIKE $${idx++}`)
        .join(" OR ")
      conditions.push(`(${katConditions})`)
      katList.forEach((k) => params.push(`%${k}%`))
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT
        id, name, ebene, bundesland, kategorie, foerderart, traeger,
        bewilligungsstelle, zielgruppe, foerdergegenstand, foerderkulisse,
        foerdersatz, antragsfrist, antragsweg, foerdergrundlage, url, status,
        geprueft, erstellt_am, aktualisiert_am
      FROM foerderprogramme
      ${where}
      ORDER BY
        CASE WHEN status = 'OFFEN' THEN 0 ELSE 1 END,
        CASE WHEN ebene = 'bund' THEN 0 ELSE 1 END,
        name
      LIMIT 20
    `

    const rows = await querySecondBrain(sql, params)

    return NextResponse.json({
      data: rows,
      total: rows.length,
      suchbegriff: q,
    })
  } catch (error) {
    console.error("Förderung Suche Fehler:", error)
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
  }
}
