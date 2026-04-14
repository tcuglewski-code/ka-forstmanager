import { prisma } from "@/lib/prisma"

const WEBHOOK_SECRET = process.env.FM_WEBHOOK_SECRET || "ka_fm_sync_2026"

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-wp-webhook-secret")
    if (secret !== WEBHOOK_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const { source, form_id, form_title, submitted_at, data } = payload

    if (!source || !data) {
      return Response.json({ error: "Missing source or data" }, { status: 400 })
    }

    const anfrage = await prisma.wpAnfrage.create({
      data: {
        source,
        formId: form_id || null,
        formTitle: form_title || null,
        name: data.name || data["your-name"] || null,
        email: data.email || data["your-email"] || null,
        telefon: data.telefon || data["your-phone"] || null,
        leistung: data.leistung || null,
        nachricht: data.nachricht || data["your-message"] || null,
        rawData: data,
        submittedAt: submitted_at ? new Date(submitted_at) : null,
      },
    })

    return Response.json({ success: true, id: anfrage.id })
  } catch (error) {
    console.error("[WP Webhook] Error:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
