/**
 * API Route: /api/settings/rechnung
 * 
 * GET: Aktuelle Rechnungseinstellungen abrufen
 * POST: Rechnungseinstellungen speichern
 * 
 * Speichert in SystemConfig Tabelle:
 * - company_iban
 * - company_bic
 * - company_vat_id
 * - company_tax_number
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

const SETTING_KEYS = [
  "company_iban",
  "company_bic",
  "company_vat_id",
  "company_tax_number",
]

// GET: Einstellungen laden
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }
  if (!isAdminOrGF(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: SETTING_KEYS },
      },
    })

    // In Objekt umwandeln
    const settings: Record<string, string> = {}
    for (const config of configs) {
      settings[config.key] = config.value
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[Settings/Rechnung] Fehler beim Laden:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Einstellungen" },
      { status: 500 }
    )
  }
}

// POST: Einstellungen speichern
export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }
  if (!isAdminOrGF(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Nur erlaubte Keys speichern
    for (const key of SETTING_KEYS) {
      const value = body[key]
      if (typeof value === "string") {
        await prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Settings/Rechnung] Fehler beim Speichern:", error)
    return NextResponse.json(
      { error: "Fehler beim Speichern der Einstellungen" },
      { status: 500 }
    )
  }
}
