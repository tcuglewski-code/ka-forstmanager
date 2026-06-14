/**
 * A1 — Cron: Angebots-Follow-ups (ANG-032)
 * Verarbeitet fällige Follow-ups. Geschützt via CRON_SECRET. Respektiert den
 * globalen Follow-up-Schalter (ang_followup_aktiv).
 */
import { NextRequest, NextResponse } from "next/server"
import { getConfig, CONFIG_KEYS } from "@/lib/angebote/config"
import { verarbeiteFaelligeFollowUps } from "@/lib/angebote/versand/followup"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const aktiv = (await getConfig(CONFIG_KEYS.followupAktiv)) === "true"
  if (!aktiv) {
    return NextResponse.json({ ok: true, skipped: "Follow-up deaktiviert" })
  }

  const ergebnis = await verarbeiteFaelligeFollowUps()
  return NextResponse.json({ ok: true, ...ergebnis })
}
