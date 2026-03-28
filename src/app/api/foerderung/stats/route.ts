import { NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export const runtime = "nodejs"

interface ProgrammStats {
  id: number
  name: string
  bundesland: string | null
  anzahl_antraege: number
  erfolgreich: number
  erfolgsquote_prozent: number
  avg_bewilligungsdauer: number | null
  avg_bewilligungsquote_prozent: number | null
  gesamt_beantragt: number
  gesamt_bewilligt: number
}

interface KPIs {
  gesamt_programme: number
  durchschn_erfolgsquote: number
  laufende_antraege: number
  gesamt_bewilligt_eur: number
}

// GET: Erfolgsquoten und Statistiken pro Programm
export async function GET() {
  try {
    // Haupt-Statistiken pro Programm
    const statsRows = await querySecondBrain(`
      SELECT 
        p.id,
        p.name,
        p.bundesland,
        COUNT(pr.id)::int as anzahl_antraege,
        COALESCE(SUM(CASE WHEN pr.erfolgreich THEN 1 ELSE 0 END), 0)::int as erfolgreich,
        CASE 
          WHEN COUNT(pr.id) > 0 
          THEN ROUND(SUM(CASE WHEN pr.erfolgreich THEN 1 ELSE 0 END)::numeric / COUNT(pr.id) * 100, 1)
          ELSE 0 
        END as erfolgsquote_prozent,
        ROUND(AVG(pr.bewilligungsdauer_wochen)::numeric, 1) as avg_bewilligungsdauer,
        ROUND(
          AVG(
            CASE 
              WHEN pr.beantragter_betrag_eur > 0 
              THEN pr.bewilligter_betrag_eur / pr.beantragter_betrag_eur * 100 
              ELSE NULL 
            END
          )::numeric, 1
        ) as avg_bewilligungsquote_prozent,
        COALESCE(SUM(pr.beantragter_betrag_eur), 0) as gesamt_beantragt,
        COALESCE(SUM(pr.bewilligter_betrag_eur), 0) as gesamt_bewilligt
      FROM foerderprogramme p
      LEFT JOIN foerder_praxis pr ON p.id = pr.programm_id
      GROUP BY p.id, p.name, p.bundesland
      ORDER BY anzahl_antraege DESC, p.name ASC
    `)

    // KPI-Zusammenfassung
    const kpiRows = await querySecondBrain(`
      SELECT 
        (SELECT COUNT(*) FROM foerderprogramme)::int as gesamt_programme,
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND(SUM(CASE WHEN erfolgreich THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1)
          ELSE 0 
        END as durchschn_erfolgsquote,
        (SELECT COUNT(*) FROM foerder_praxis WHERE bewilligung_datum IS NULL AND erfolgreich IS NOT FALSE)::int as laufende_antraege,
        COALESCE(SUM(bewilligter_betrag_eur), 0) as gesamt_bewilligt_eur
      FROM foerder_praxis
    `)

    const kpis: KPIs = {
      gesamt_programme: kpiRows[0]?.gesamt_programme || 0,
      durchschn_erfolgsquote: parseFloat(kpiRows[0]?.durchschn_erfolgsquote) || 0,
      laufende_antraege: kpiRows[0]?.laufende_antraege || 0,
      gesamt_bewilligt_eur: parseFloat(kpiRows[0]?.gesamt_bewilligt_eur) || 0,
    }

    // Nur Programme mit mindestens einem Antrag für die Tabelle
    const programmeMitErfahrung = statsRows.filter(
      (row: ProgrammStats) => row.anzahl_antraege > 0
    )

    return NextResponse.json({
      kpis,
      stats: statsRows,
      programmeMitErfahrung,
    })
  } catch (error) {
    console.error("Fehler beim Laden der Statistiken:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Statistiken" },
      { status: 500 }
    )
  }
}
