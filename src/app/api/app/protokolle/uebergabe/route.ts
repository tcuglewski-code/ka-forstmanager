/**
 * POST /api/app/protokolle/uebergabe — Schichtübergabe-Protokoll (Bearer-Auth)
 *
 * Speichert das Übergabe-Protokoll am Ende einer Schicht in SystemConfig
 * (Key: protokoll_uebergabe_<auftrag_id>_<timestamp>).
 * Optional: Telegram-Notification an die nachfolgende Gruppe.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const auftragId: string | null = body.auftrag_id ?? body.auftragId ?? null
  if (!auftragId) {
    return NextResponse.json(
      { error: "Ungültige Daten", detail: "auftrag_id ist erforderlich" },
      { status: 400 }
    )
  }

  const erstelltVon = (appUser.mitarbeiterId as string | null) ?? null
  const timestamp = new Date().toISOString()
  const key = `protokoll_uebergabe_${auftragId}_${timestamp}`

  const record = {
    auftragId,
    erstelltVon,
    erstelltVonName: body.erstellt_von_name ?? body.erstelltVonName ?? null,
    sessionId: body.session_id ?? body.sessionId ?? null,
    datum: body.datum ?? null,
    schichtEnde: body.schicht_ende ?? body.schichtEnde ?? null,
    anwesendeMitarbeiter: body.anwesende_mitarbeiter ?? body.anwesendeMitarbeiter ?? [],
    materialStatus: body.material_status ?? body.materialStatus ?? {},
    offeneAufgaben: body.offene_aufgaben ?? body.offeneAufgaben ?? "",
    nachfolgeHinweise: body.nachfolge_hinweise ?? body.nachfolgeHinweise ?? "",
    timestamp,
  }

  await prisma.systemConfig.upsert({
    where: { key },
    update: { value: JSON.stringify(record) },
    create: { key, value: JSON.stringify(record) },
  })

  return NextResponse.json({ success: true, key, timestamp }, { status: 201 })
}
