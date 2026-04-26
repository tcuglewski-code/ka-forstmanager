import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { text } = await req.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text ist erforderlich" }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "KI nicht konfiguriert" }, { status: 503 })
    }

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Extrahiere alle Baumarten/Pflanzen-Positionen aus diesem Text.
Gib NUR JSON zurück (kein Text davor/danach):
{"positionen": [{"baumart": string, "menge": number, "einheit": string, "preisProEinheit": number|null, "qualitaet": string|null}]}

Text:
${text.substring(0, 3000)}`,
        },
      ],
    })

    const content = message.content[0].type === "text" ? message.content[0].text : "{}"
    const extracted = JSON.parse(content.replace(/```json\n?|\n?```/g, ""))
    return NextResponse.json(extracted)
  } catch (error) {
    console.error("[AI Extract]", error)
    return NextResponse.json({ error: "KI-Extraktion fehlgeschlagen" }, { status: 500 })
  }
}
