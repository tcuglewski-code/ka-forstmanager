import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export const runtime = "nodejs"

interface PraxisEintrag {
  id: number
  programm_id: number
  programm_name?: string
  bundesland: string | null
  bewilligungsdauer_wochen: number | null
  beantragter_betrag_eur: number | null
  bewilligter_betrag_eur: number | null
  hinweis: string | null
  fallstricke: string | null
  erfolgreich: boolean
  antrag_datum: string | null
  bewilligung_datum: string | null
  erstellt_von: string | null
  created_at: string
}

// GET: Liste aller Praxis-Einträge mit Programm-Namen
export async function GET() {
  try {
    const rows = await querySecondBrain(`
      SELECT 
        pr.id,
        pr.programm_id,
        p.name as programm_name,
        pr.bundesland,
        pr.bewilligungsdauer_wochen,
        pr.beantragter_betrag_eur,
        pr.bewilligter_betrag_eur,
        pr.hinweis,
        pr.fallstricke,
        pr.erfolgreich,
        pr.antrag_datum,
        pr.bewilligung_datum,
        pr.erstellt_von,
        pr.created_at
      FROM foerder_praxis pr
      LEFT JOIN foerderprogramme p ON pr.programm_id = p.id
      ORDER BY pr.created_at DESC
    `)

    return NextResponse.json({ eintraege: rows })
  } catch (error) {
    console.error("Fehler beim Laden der Praxis-Einträge:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Praxis-Einträge" },
      { status: 500 }
    )
  }
}

// POST: Neuen Eintrag erstellen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      programm_id,
      bundesland,
      bewilligungsdauer_wochen,
      beantragter_betrag_eur,
      bewilligter_betrag_eur,
      hinweis,
      fallstricke,
      erfolgreich,
      antrag_datum,
      bewilligung_datum,
      erstellt_von,
    } = body

    if (!programm_id) {
      return NextResponse.json(
        { error: "programm_id ist erforderlich" },
        { status: 400 }
      )
    }

    const result = await querySecondBrain(
      `INSERT INTO foerder_praxis (
        programm_id, bundesland, bewilligungsdauer_wochen,
        beantragter_betrag_eur, bewilligter_betrag_eur,
        hinweis, fallstricke, erfolgreich,
        antrag_datum, bewilligung_datum, erstellt_von,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id`,
      [
        programm_id,
        bundesland || null,
        bewilligungsdauer_wochen || null,
        beantragter_betrag_eur || null,
        bewilligter_betrag_eur || null,
        hinweis || null,
        fallstricke || null,
        erfolgreich ?? true,
        antrag_datum || null,
        bewilligung_datum || null,
        erstellt_von || null,
      ]
    )

    return NextResponse.json({ 
      success: true, 
      id: result[0]?.id,
      message: "Praxis-Eintrag erfolgreich erstellt" 
    })
  } catch (error) {
    console.error("Fehler beim Erstellen des Praxis-Eintrags:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Praxis-Eintrags" },
      { status: 500 }
    )
  }
}

// PATCH: Eintrag aktualisieren
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "id ist erforderlich" },
        { status: 400 }
      )
    }

    const allowedFields = [
      "bundesland",
      "bewilligungsdauer_wochen",
      "beantragter_betrag_eur",
      "bewilligter_betrag_eur",
      "hinweis",
      "fallstricke",
      "erfolgreich",
      "antrag_datum",
      "bewilligung_datum",
    ]

    const setClauses: string[] = ["updated_at = NOW()"]
    const values: (string | number | boolean | null)[] = []
    let paramIndex = 1

    for (const field of allowedFields) {
      if (field in updates) {
        setClauses.push(`${field} = $${paramIndex}`)
        values.push(updates[field])
        paramIndex++
      }
    }

    values.push(id)

    await querySecondBrain(
      `UPDATE foerder_praxis SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
      values
    )

    return NextResponse.json({ 
      success: true, 
      message: "Praxis-Eintrag erfolgreich aktualisiert" 
    })
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Praxis-Eintrags:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Praxis-Eintrags" },
      { status: 500 }
    )
  }
}
