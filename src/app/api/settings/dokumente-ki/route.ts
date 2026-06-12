/**
 * DOK-033/034: GET/POST /api/settings/dokumente-ki
 *
 * Kill-Switch + Routing-Schwellen der Dokumenten-KI (admin-only).
 * Keys in SystemConfig:
 *  - dok_ki_auto_buchung_aktiv  ("true"/"false", NEVER #21 — Default false)
 *  - dok_ki_threshold_high      (Auto-Buchung ab dieser Konfidenz, Default 0.85)
 *  - dok_ki_threshold_low       (darunter Ablehnung, Default 0.60)
 *  - dok_ki_vier_augen_betrag   (ab diesem Brutto-Betrag immer Review, Default 500)
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"

const DEFAULTS: Record<string, string> = {
  dok_ki_auto_buchung_aktiv: "false",
  dok_ki_threshold_high: "0.85",
  dok_ki_threshold_low: "0.6",
  dok_ki_vier_augen_betrag: "500",
}

const BodySchema = z.object({
  dok_ki_auto_buchung_aktiv: z.enum(["true", "false"]).optional(),
  dok_ki_threshold_high: z.coerce.number().min(0.5).max(1).optional(),
  dok_ki_threshold_low: z.coerce.number().min(0).max(0.85).optional(),
  dok_ki_vier_augen_betrag: z.coerce.number().min(0).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  })
  const settings = { ...DEFAULTS }
  for (const row of rows) settings[row.key] = row.value
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Werte" }, { status: 400 })
  }
  // Konsistenz: low muss unter high bleiben
  const high = parsed.data.dok_ki_threshold_high
  const low = parsed.data.dok_ki_threshold_low
  if (high !== undefined && low !== undefined && low >= high) {
    return NextResponse.json({ error: "threshold_low muss kleiner als threshold_high sein" }, { status: 400 })
  }

  const userId = (session.user as { id?: string }).id || session.user.email || "unbekannt"
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
    if (key === "dok_ki_auto_buchung_aktiv") {
      console.log(`[DokumenteKI] Kill-Switch geändert auf ${value} durch ${userId}`)
    }
  }
  return NextResponse.json({ success: true })
}
