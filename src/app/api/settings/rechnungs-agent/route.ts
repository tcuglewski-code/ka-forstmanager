/**
 * A8 Rechnungs-Agent — Kill-Switch-API (REC-021)
 *
 * GET:  liest rechnungs_agent_aktiv (Default false = Shadow-Mode, NEVER #21).
 * POST: { aktiv: boolean } — nur Admin darf umschalten.
 *
 * Solange der Agent inaktiv ist, liefert POST /api/rechnungen/generieren 503.
 * Manuelles Erstellen bleibt unberührt.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { z } from "zod"
import { RECHNUNG_CONFIG_KEYS, RECHNUNG_CONFIG_DEFAULTS, istAgentAktiv } from "@/lib/rechnungen/config"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const aktiv = await istAgentAktiv()
  return NextResponse.json({ aktiv, default: RECHNUNG_CONFIG_DEFAULTS[RECHNUNG_CONFIG_KEYS.agentAktiv] === "true" })
}

const ToggleSchema = z.object({ aktiv: z.boolean() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const parsed = ToggleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten (aktiv: boolean erwartet)" }, { status: 400 })

  const value = parsed.data.aktiv ? "true" : "false"
  await prisma.systemConfig.upsert({
    where: { key: RECHNUNG_CONFIG_KEYS.agentAktiv },
    update: { value },
    create: { key: RECHNUNG_CONFIG_KEYS.agentAktiv, value },
  })

  await prisma.activityLog.create({
    data: {
      action: parsed.data.aktiv ? "AGENT_AKTIVIERT" : "AGENT_DEAKTIVIERT",
      entityType: "system",
      entityId: RECHNUNG_CONFIG_KEYS.agentAktiv,
      entityName: `Rechnungs-Agent ${parsed.data.aktiv ? "aktiviert" : "deaktiviert (Shadow-Mode)"}`,
      metadata: JSON.stringify({ by: session.user?.id ?? null }),
    },
  }).catch((e) => console.error("[A8-KILLSWITCH] ActivityLog:", e))

  return NextResponse.json({ ok: true, aktiv: parsed.data.aktiv })
}
