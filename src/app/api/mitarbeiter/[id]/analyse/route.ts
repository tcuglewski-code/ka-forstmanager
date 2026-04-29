import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import Anthropic from "@anthropic-ai/sdk"

const MC_API = "https://mission-control-tawny-omega.vercel.app/api"
const MC_TOKEN = "mc_live_25bd2bb6768f354f703e99434277af7f51e9cf02ced263df23a1c633ffd175f7"
const MC_BYPASS = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "KI nicht konfiguriert" }, { status: 503 })
  }

  const { id: mitarbeiterId } = await params

  const body = await req.json()
  const { screenshot } = body as { screenshot: string }

  if (!screenshot) {
    return NextResponse.json({ error: "Screenshot fehlt" }, { status: 400 })
  }

  // Extract base64 data from data URL
  const base64Match = screenshot.match(/^data:image\/(jpeg|png|gif|webp);base64,(.+)$/)
  if (!base64Match) {
    return NextResponse.json({ error: "Ungültiges Screenshot-Format" }, { status: 400 })
  }

  const mediaType = base64Match[1] === "jpg" ? "image/jpeg" : `image/${base64Match[1]}` as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
  const base64Data = base64Match[2]

  // Send to Anthropic Vision API
  const anthropic = new Anthropic({ apiKey })
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data },
          },
          {
            type: "text",
            text: `Analysiere diesen Mitarbeiter-Datensatz aus dem ForstManager.
Identifiziere:
1. Fehlende oder unvollständige Daten (z.B. fehlende Bankdaten, Notfallkontakt, Qualifikationen)
2. Anomalien oder Auffälligkeiten (z.B. abgelaufene Qualifikationen, fehlende Stunden)
3. Verbesserungsvorschläge (z.B. ausstehende Schulungen, fehlende Dokumente)

Gib die Ergebnisse als JSON-Array zurück. Jedes Element hat:
- "title": kurzer Task-Titel (max 80 Zeichen, Deutsch)
- "description": Beschreibung was zu tun ist (1-2 Sätze, Deutsch)
- "priority": "high" | "medium" | "low"

Antworte NUR mit dem JSON-Array, kein anderer Text.`,
          },
        ],
      },
    ],
  })

  // Parse AI response
  const textContent = message.content.find((c) => c.type === "text")
  if (!textContent || textContent.type !== "text") {
    return NextResponse.json({ error: "Keine Analyse erhalten" }, { status: 500 })
  }

  let tasks: Array<{ title: string; description: string; priority: string }>
  try {
    // Extract JSON from response (might be wrapped in markdown code block)
    const jsonStr = textContent.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    tasks = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json(
      { error: "KI-Antwort konnte nicht verarbeitet werden", raw: textContent.text },
      { status: 500 }
    )
  }

  // Create tasks in Mission Control
  const created: string[] = []
  for (const task of tasks) {
    try {
      const res = await fetch(`${MC_API}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MC_TOKEN}`,
          "x-vercel-bypass-automation-protection": MC_BYPASS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: `${task.description}\n\n---\nGeneriert aus Mitarbeiter-Analyse (ID: ${mitarbeiterId})`,
          priority: task.priority,
          status: "TODO",
          projectId: "cmmv4rso4000381skvztzqrjh",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        created.push(data.id || task.title)
      }
    } catch {
      // Skip failed task creation, continue with others
    }
  }

  return NextResponse.json({
    analysiert: tasks.length,
    erstellt: created.length,
    tasks,
  })
}
