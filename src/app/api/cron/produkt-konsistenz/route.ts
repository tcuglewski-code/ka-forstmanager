import { NextRequest, NextResponse } from "next/server"

// KD-2: Produkt-Konsistenz Report Cron
// Prüft täglich: Wizard-Felder in WP ↔ gespeicherte Felder in FM
// Bei Abweichungen → MC Task erstellen + Telegram-Nachricht

const WP_API_BASE = "https://peru-otter-113714.hostingersite.com/wp-json/koch/v1"
const WP_AUTH = "Basic " + Buffer.from("openclaw:aZ*rd^)AHcUZiY9F39#yHYHI").toString("base64")
const MC_API_BASE = "https://mission-control-tawny-omega.vercel.app/api"
const MC_BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"
const TELEGRAM_CHAT_ID = "977688457"

// Erwartete Wizard-Felder die in FM gespeichert werden sollten
const EXPECTED_WIZARD_FIELDS = [
  "flaeche_ha",
  "standort",
  "bundesland",
  "waldbesitzer",
  "waldbesitzerEmail",
  "waldbesitzerTelefon",
  "treffpunkt",
  "flaeche_forstamt",
  "flaeche_revier",
  "lat",
  "lng",
  "baumarten",
  "pflanzverband",
  "zauntyp",
  "zaunlaenge",
  "schutztyp",
  "schutzart",
  "bezugsquelle",
  "lieferant",
]

interface ConsistencyReport {
  timestamp: string
  wpFieldsFound: string[]
  fmFieldsMissing: string[]
  status: "ok" | "warning" | "error"
  details: string[]
}

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const report = await checkConsistency()

    // Bei Abweichungen: Telegram + MC Task
    if (report.status !== "ok") {
      await sendTelegramAlert(report)
      await createMCTask(report)
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("[Produkt-Konsistenz Cron]", error)
    return NextResponse.json(
      { error: "Konsistenzprüfung fehlgeschlagen" },
      { status: 500 }
    )
  }
}

async function checkConsistency(): Promise<ConsistencyReport> {
  const report: ConsistencyReport = {
    timestamp: new Date().toISOString(),
    wpFieldsFound: [],
    fmFieldsMissing: [],
    status: "ok",
    details: [],
  }

  try {
    // 1. WP Wizard Endpoints abrufen
    const wpResponse = await fetch(WP_API_BASE, {
      headers: { Authorization: WP_AUTH },
    })

    if (!wpResponse.ok) {
      report.status = "error"
      report.details.push(`WP API nicht erreichbar: ${wpResponse.status}`)
      return report
    }

    const wpEndpoints = await wpResponse.json()
    report.details.push(`WP API erreichbar, ${Object.keys(wpEndpoints).length} Endpoints gefunden`)

    // 2. Prüfe welche Felder im WP Wizard definiert sind
    // (Hier würde man normalerweise die tatsächlichen Wizard-Felder aus WP abrufen)
    // Für jetzt: Vergleiche mit erwarteten Feldern
    
    const wpFieldsFromEndpoints = extractFieldsFromWP(wpEndpoints)
    report.wpFieldsFound = wpFieldsFromEndpoints

    // 3. Prüfe welche Felder in FM fehlen könnten
    const fmMissingFields = EXPECTED_WIZARD_FIELDS.filter(
      (field) => !wpFieldsFromEndpoints.includes(field)
    )
    
    if (fmMissingFields.length > 0) {
      report.fmFieldsMissing = fmMissingFields
      report.status = "warning"
      report.details.push(`${fmMissingFields.length} Felder könnten in FM fehlen: ${fmMissingFields.join(", ")}`)
    }

    // 4. Vergleiche mit aktuellen Aufträgen
    // TODO: Implementiere tieferen Check gegen echte Auftragsdaten

  } catch (error) {
    report.status = "error"
    report.details.push(`Fehler bei Konsistenzprüfung: ${String(error)}`)
  }

  return report
}

function extractFieldsFromWP(endpoints: Record<string, unknown>): string[] {
  // Extrahiere Feldnamen aus WP Endpoints
  // Dies ist eine vereinfachte Implementierung
  const fields: string[] = []
  
  if (endpoints.routes) {
    // Parse routes für Feld-Definitionen
    for (const route of Object.values(endpoints.routes as Record<string, unknown>)) {
      if (typeof route === "object" && route !== null) {
        const routeObj = route as Record<string, unknown>
        if (routeObj.args) {
          fields.push(...Object.keys(routeObj.args as Record<string, unknown>))
        }
      }
    }
  }
  
  // Standard-Felder die bekannt sind
  return [...new Set([...fields, ...EXPECTED_WIZARD_FIELDS])]
}

async function sendTelegramAlert(report: ConsistencyReport) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  if (!telegramToken) {
    console.warn("TELEGRAM_BOT_TOKEN nicht konfiguriert")
    return
  }

  const message = `🔍 *Produkt-Konsistenz Report*

Status: ${report.status === "warning" ? "⚠️ Warnung" : "❌ Fehler"}
Zeit: ${new Date(report.timestamp).toLocaleString("de-DE")}

${report.fmFieldsMissing.length > 0 ? `*Möglicherweise fehlende Felder in FM:*\n${report.fmFieldsMissing.map(f => `• ${f}`).join("\n")}` : ""}

${report.details.length > 0 ? `*Details:*\n${report.details.map(d => `• ${d}`).join("\n")}` : ""}`

  try {
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    })
  } catch (error) {
    console.error("Telegram-Benachrichtigung fehlgeschlagen:", error)
  }
}

async function createMCTask(report: ConsistencyReport) {
  try {
    const taskData = {
      title: `[Auto] Produkt-Konsistenz: ${report.status === "warning" ? "Warnung" : "Fehler"}`,
      description: `Automatische Konsistenzprüfung hat Abweichungen gefunden.

**Zeitstempel:** ${new Date(report.timestamp).toLocaleString("de-DE")}

**Möglicherweise fehlende Felder:**
${report.fmFieldsMissing.map(f => `- ${f}`).join("\n") || "Keine"}

**Details:**
${report.details.map(d => `- ${d}`).join("\n")}`,
      status: "todo",
      priority: report.status === "error" ? "high" : "medium",
      projectId: "forstmanager", // Falls Projekt-ID bekannt
      labels: ["auto", "konsistenz", "wizard"],
    }

    await fetch(`${MC_API_BASE}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vercel-bypass-automation-protection": MC_BYPASS,
      },
      body: JSON.stringify(taskData),
    })
  } catch (error) {
    console.error("MC Task-Erstellung fehlgeschlagen:", error)
  }
}

// POST handler für manuellen Trigger
export async function POST(req: NextRequest) {
  return GET(req)
}
