import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Mapping für Fördertyp-Filter → Kategorien
const TYP_KATEGORIEN: Record<string, string[]> = {
  aufforstung: ["erstaufforstung", "wiederbewaldung"],
  waldumbau: ["waldumbau"],
  naturverjuengung: ["waldpflege", "waldschutz"],
  sonstiges: ["foerderung_allgemein", "forschung", "klimaanpassung", "zaunbau"],
}

// Synonyme-Mapping für semantische Keyword-Expansion
// Fachbegriffe werden auf DB-kompatible Suchbegriffe erweitert
const KEYWORD_SYNONYME: Record<string, string> = {
  borkenkäfer: "kalamität wiederbewaldung waldschutz",
  borkenkaefer: "kalamität wiederbewaldung waldschutz",
  käfer: "waldschutz kalamität",
  sturm: "kalamität wiederbewaldung sturmschaden",
  sturmschaden: "kalamität wiederbewaldung",
  trockenheit: "klimaanpassung waldumbau",
  dürre: "klimaanpassung waldumbau",
  fichte: "nadelholz wiederbewaldung waldumbau",
  fichtenwald: "nadelholz wiederbewaldung waldumbau",
  eiche: "laubholz waldumbau",
  buche: "laubholz waldumbau",
  lärche: "laubholz waldumbau",
  mischwald: "waldumbau klimaanpassung",
  pflanzung: "erstaufforstung wiederbewaldung",
  aufforsten: "erstaufforstung wiederbewaldung",
  zaun: "zaunbau wildschutz",
  wildschutz: "zaunbau wildschutz",
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const bundesland = searchParams.get("bundesland") || ""
    const typ = searchParams.get("typ") || ""
    const semantic = searchParams.get("semantic") === "1"

    const params: any[] = []
    const conditions: string[] = []
    let idx = 1

    // Semantische Suche: Keyword-Expansion mit Synonymen
    // Erweitert Suchbegriffe um fachlich verwandte Terme
    if (q.trim()) {
      if (semantic) {
        // Semantische Keyword-Expansion
        let expandedQuery = q.toLowerCase()
        
        // Synonyme ersetzen
        for (const [term, expansion] of Object.entries(KEYWORD_SYNONYME)) {
          if (expandedQuery.includes(term)) {
            expandedQuery = expandedQuery.replace(term, `${term} ${expansion}`)
          }
        }
        
        // Keywords extrahieren (>3 Zeichen, max 6 Keywords)
        const keywords = expandedQuery
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .filter((w, i, arr) => arr.indexOf(w) === i) // Duplikate entfernen
          .slice(0, 6)
        
        if (keywords.length > 0) {
          // Jedes Keyword als OR-Bedingung über alle Textfelder
          const keywordClauses = keywords
            .map((_, i) => {
              const paramIdx = idx + i
              return `(name ILIKE $${paramIdx} OR foerdergegenstand ILIKE $${paramIdx} OR zielgruppe ILIKE $${paramIdx} OR foerderkulisse ILIKE $${paramIdx})`
            })
            .join(" OR ")
          
          keywords.forEach((kw) => params.push(`%${kw}%`))
          idx += keywords.length
          conditions.push(`(${keywordClauses})`)
        }
      } else {
        // Standard ILIKE-Suche (Fallback)
        conditions.push(
          `(name ILIKE $${idx} OR foerdergegenstand ILIKE $${idx} OR traeger ILIKE $${idx} OR foerdersatz ILIKE $${idx} OR kategorie ILIKE $${idx})`
        )
        params.push(`%${q.trim()}%`)
        idx++
      }
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
