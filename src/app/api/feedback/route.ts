import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTelegramNotification } from "@/lib/telegram"
import { stripHtml } from "@/lib/sanitize"

const MC_API_URL = "https://mission-control-tawny-omega.vercel.app/api"
const MC_TOKEN = "mc_live_25bd2bb6768f354f703e99434277af7f51e9cf02ced263df23a1c633ffd175f7"
const MC_BYPASS_TOKEN = "rpFNEmGS7CB0FunapN20rLGDCG0foMzx"
const ADMIN_CHAT_IDS = process.env.TELEGRAM_ADMIN_CHAT_IDS ?? ""

const VALID_TYPES = ["bug", "wunsch", "frage", "ux_problem", "datenfehler", "performance"]
const VALID_SEVERITIES = ["blocker", "kritisch", "hoch", "mittel", "niedrig"]

interface FeedbackBody {
  typ: string
  text: string
  seite?: string
  nutzer?: string
  severity?: string
  browserInfo?: Record<string, unknown>
  screenshotUrl?: string
  technicalContext?: Record<string, unknown>
  expectedBehavior?: string
  website?: string // honeypot
}

const TYP_LABELS: Record<string, string> = {
  bug: "Bug",
  wunsch: "Wunsch",
  frage: "Frage",
  ux_problem: "UX-Problem",
  datenfehler: "Datenfehler",
  performance: "Performance",
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedbackBody = await req.json()

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ success: true })
    }

    // Validation
    if (!body.typ || !body.text) {
      return NextResponse.json(
        { error: "Typ und Text sind erforderlich" },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(body.typ)) {
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

    const sev = body.severity && VALID_SEVERITIES.includes(body.severity) ? body.severity : "mittel"

    // 1. Save to database
    const feedback = await prisma.feedbackEintrag.create({
      data: {
        typ: body.typ,
        text: stripHtml(body.text),
        seite: stripHtml(body.seite) || null,
        nutzer: stripHtml(body.nutzer) || null,
        severity: sev,
        browserInfo: body.browserInfo ?? undefined,
        screenshotUrl: body.screenshotUrl || null,
        technicalContext: body.technicalContext ?? undefined,
        expectedBehavior: body.expectedBehavior ? stripHtml(body.expectedBehavior) : null,
      },
    })

    // 2. Send Telegram notification (fire-and-forget)
    const sevEmoji = sev === "blocker" ? "🔴" : sev === "hoch" ? "🟠" : sev === "mittel" ? "🟡" : "🟢"
    const telegramMessage =
      `🔔 <b>Neues Feedback</b> — ${TYP_LABELS[body.typ] ?? body.typ} ${sevEmoji} ${sev}\n\n` +
      `<b>Von:</b> ${body.nutzer ?? "Anonym"}\n` +
      `<b>Seite:</b> ${body.seite ?? "Unbekannt"}\n\n` +
      `"${body.text.substring(0, 500)}${body.text.length > 500 ? "..." : ""}"`

    if (ADMIN_CHAT_IDS) {
      const adminIds = ADMIN_CHAT_IDS.split(",").map((id) => id.trim()).filter(Boolean)
      Promise.allSettled(
        adminIds.map((chatId) => sendTelegramNotification(chatId, telegramMessage))
      ).catch(() => {})
    }

    // 3. Forward to Mission Control debug-reports API (fire-and-forget)
    fetch(`${MC_API_URL}/debug-reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MC_TOKEN}`,
        "x-vercel-bypass-automation-protection": MC_BYPASS_TOKEN,
      },
      body: JSON.stringify({
        productKey: "forstmanager",
        productName: "ForstManager",
        environment: process.env.NODE_ENV || "production",
        type: body.typ,
        severity: sev,
        title: `${TYP_LABELS[body.typ] ?? body.typ}: ${body.text.substring(0, 80)}`,
        description: body.text,
        expectedBehavior: body.expectedBehavior,
        route: body.seite,
        userEmail: body.nutzer,
        screenshotUrl: body.screenshotUrl,
        browserInfo: body.browserInfo,
        technicalContext: body.technicalContext,
      }),
    }).catch(() => {}) // fire-and-forget, MC route built in Phase 2

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
