import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTelegramNotification } from "@/lib/telegram"
import { stripHtml } from "@/lib/sanitize"

const MC_API_URL = "https://mission-control-tawny-omega.vercel.app/api/tasks"
const MC_BYPASS_TOKEN = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"
const ADMIN_CHAT_IDS = process.env.TELEGRAM_ADMIN_CHAT_IDS ?? ""

interface FeedbackBody {
  typ: "bug" | "wunsch" | "frage"
  text: string
  seite?: string
  nutzer?: string
  // Honeypot field
  website?: string
}

const TYP_LABELS: Record<string, string> = {
  bug: "🐛 Bug",
  wunsch: "💡 Wunsch",
  frage: "❓ Frage",
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedbackBody = await req.json()

    // Honeypot check - if filled, likely a bot
    if (body.website) {
      return NextResponse.json({ success: true }) // Silent fail for bots
    }

    // Validation
    if (!body.typ || !body.text) {
      return NextResponse.json(
        { error: "Typ und Text sind erforderlich" },
        { status: 400 }
      )
    }

    if (!["bug", "wunsch", "frage"].includes(body.typ)) {
      return NextResponse.json(
        { error: "Ungültiger Typ" },
        { status: 400 }
      )
    }

    if (body.text.length < 5 || body.text.length > 5000) {
      return NextResponse.json(
        { error: "Text muss zwischen 5 und 5000 Zeichen lang sein" },
        { status: 400 }
      )
    }

    // 1. Save to database (sanitize user input)
    const feedback = await prisma.feedbackEintrag.create({
      data: {
        typ: body.typ,
        text: stripHtml(body.text),
        seite: stripHtml(body.seite) || null,
        nutzer: stripHtml(body.nutzer) || null,
      },
    })

    // 2. Send Telegram notification (fire-and-forget)
    const telegramMessage = 
      `🔔 <b>Neues Feedback</b> — ${TYP_LABELS[body.typ]}\n\n` +
      `<b>Von:</b> ${body.nutzer ?? "Anonym"}\n` +
      `<b>Seite:</b> ${body.seite ?? "Unbekannt"}\n\n` +
      `"${body.text.substring(0, 500)}${body.text.length > 500 ? "..." : ""}"`

    if (ADMIN_CHAT_IDS) {
      const adminIds = ADMIN_CHAT_IDS.split(",").map((id) => id.trim()).filter(Boolean)
      // Fire-and-forget
      Promise.allSettled(
        adminIds.map((chatId) => sendTelegramNotification(chatId, telegramMessage))
      ).catch(() => {})
    }

    // 3. Create task in Mission Control (fire-and-forget)
    const mcTitle = `Feedback: ${body.typ} — ${body.text.substring(0, 50)}${body.text.length > 50 ? "..." : ""}`
    
    fetch(MC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vercel-bypass-automation-protection": MC_BYPASS_TOKEN,
      },
      body: JSON.stringify({
        title: mcTitle,
        description: body.text,
        tags: ["feedback", body.typ],
        priority: body.typ === "bug" ? "high" : "medium",
      }),
    }).catch(() => {}) // Fire-and-forget

    return NextResponse.json({
      success: true,
      id: feedback.id,
    })
  } catch (error) {
    console.error("[Feedback API] Error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

// GET endpoint for admin page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const typ = searchParams.get("typ")

    const where = typ && typ !== "alle" ? { typ } : {}

    const feedbacks = await prisma.feedbackEintrag.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error("[Feedback API GET] Error:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
