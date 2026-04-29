import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10 MB

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default
  const data = await pdfParse(buffer)
  return data.text
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "KI nicht konfiguriert" }, { status: 503 })
    }

    let text: string

    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      // PDF file upload
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 })
      }
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Nur PDF-Dateien erlaubt" }, { status: 400 })
      }
      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json({ error: "PDF darf maximal 10 MB groß sein" }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      text = await extractTextFromPDF(buffer)

      if (!text.trim()) {
        return NextResponse.json(
          { error: "PDF ist ein Scan oder enthält keinen Text. Bitte Text-PDF hochladen oder Positionen manuell eingeben." },
          { status: 422 }
        )
      }
    } else {
      // JSON text input (legacy)
      const body = await req.json()
      text = body.text
      if (!text || typeof text !== "string") {
        return NextResponse.json({ error: "Text ist erforderlich" }, { status: 400 })
      }
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
