import { NextRequest, NextResponse } from "next/server"
import { cleanupAiAuditLogs } from "@/lib/ai-audit"

/**
 * DSGVO Art. 30 + EU AI Act: AiAuditLog Bereinigung
 * Löscht Einträge älter als 90 Tage.
 * Trigger: Vercel Cron (wöchentlich Sonntag 03:30)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const deletedCount = await cleanupAiAuditLogs(90)

    return NextResponse.json({
      success: true,
      deletedCount,
      retentionDays: 90,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[cleanup-ai-audit] Fehler:", error)
    return NextResponse.json(
      { error: "Interner Fehler", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
