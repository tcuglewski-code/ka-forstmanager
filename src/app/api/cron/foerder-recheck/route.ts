import { NextRequest, NextResponse } from "next/server"
import { querySecondBrain } from "@/lib/secondbrain-db"

export const runtime = "nodejs"

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
const CRON_SECRET = process.env.CRON_SECRET

interface Programm {
  id: number
  name: string
  bundesland: string | null
  status: string
}

interface CheckResult {
  programm_id: number
  programm_name: string
  bundesland: string | null
  geaendert: boolean
  grund?: string
}

/**
 * Monatlicher Cron-Job: Prüft Förderprogramme auf Änderungen via Perplexity
 * Schedule: 0 9 1 * * (1. jeden Monats um 9:00 Uhr)
 * Rate-Limit: Maximal 5 Programme pro Lauf
 */
export async function GET(req: NextRequest) {
  // Authentifizierung prüfen
  const authHeader = req.headers.get("authorization")
  const cronSecret = req.headers.get("x-cron-secret")
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: CheckResult[] = []
  const geaendert: number[] = []
  
  try {
    // Hole 5 Programme die am längsten nicht geprüft wurden
    const programme: Programm[] = await querySecondBrain(`
      SELECT id, name, bundesland, status
      FROM foerderprogramme
      WHERE status != 'INAKTIV'
      ORDER BY updated_at ASC NULLS FIRST
      LIMIT 5
    `)

    if (programme.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine Programme zum Prüfen gefunden",
        geprueft: 0,
        geaendert: 0,
      })
    }

    // Perplexity API prüfen
    if (!PERPLEXITY_API_KEY) {
      console.warn("PERPLEXITY_API_KEY nicht konfiguriert, überspringe Re-Check")
      return NextResponse.json({
        success: false,
        error: "PERPLEXITY_API_KEY nicht konfiguriert",
        geprueft: 0,
        geaendert: 0,
      })
    }

    for (const prog of programme) {
      try {
        const prompt = `Hat sich das Förderprogramm "${prog.name}" ${prog.bundesland ? `in ${prog.bundesland}` : "bundesweit"} im Jahr 2025/2026 geändert? 
        
Prüfe kurz:
1. Gibt es neue Förderrichtlinien oder Anpassungen?
2. Haben sich Fördersätze oder Bedingungen geändert?
3. Ist das Programm noch aktiv?

Antworte NUR mit "JA" oder "NEIN" am Anfang, gefolgt von einer kurzen Begründung (max 50 Wörter).`

        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: "Du bist ein Experte für deutsche Forstförderprogramme. Antworte präzise und kurz.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 150,
          }),
        })

        if (!response.ok) {
          console.error(`Perplexity API Fehler für ${prog.name}:`, await response.text())
          results.push({
            programm_id: prog.id,
            programm_name: prog.name,
            bundesland: prog.bundesland,
            geaendert: false,
            grund: "API-Fehler",
          })
          continue
        }

        const data = await response.json()
        const antwort = data.choices?.[0]?.message?.content || ""
        const hatGeaendert = antwort.toUpperCase().startsWith("JA")

        if (hatGeaendert) {
          // Status auf PRUEFEN setzen
          await querySecondBrain(
            `UPDATE foerderprogramme SET status = 'PRUEFEN', updated_at = NOW() WHERE id = $1`,
            [prog.id]
          )
          geaendert.push(prog.id)
        } else {
          // Nur Timestamp aktualisieren
          await querySecondBrain(
            `UPDATE foerderprogramme SET updated_at = NOW() WHERE id = $1`,
            [prog.id]
          )
        }

        results.push({
          programm_id: prog.id,
          programm_name: prog.name,
          bundesland: prog.bundesland,
          geaendert: hatGeaendert,
          grund: antwort.slice(0, 200),
        })

        // Rate-Limit: 1 Sekunde zwischen Anfragen
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
      } catch (progError) {
        console.error(`Fehler bei Programm ${prog.name}:`, progError)
        results.push({
          programm_id: prog.id,
          programm_name: prog.name,
          bundesland: prog.bundesland,
          geaendert: false,
          grund: "Verarbeitungsfehler",
        })
      }
    }

    return NextResponse.json({
      success: true,
      geprueft: results.length,
      geaendert: geaendert.length,
      geaenderte_ids: geaendert,
      details: results,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error("Cron foerder-recheck Fehler:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Interner Fehler beim Re-Check",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
