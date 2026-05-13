import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ============================================================
// Mitarbeiter Profil — Persönliche Daten (Sprint AS)
// App-Onboarding: Telefon, Notfallkontakt, Führerschein, Bankverbindung
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mitarbeiterId, telefon, notfallkontakt, fuehrerschein, iban, bic, bankName } = body

    if (!mitarbeiterId) {
      return NextResponse.json({ error: "mitarbeiterId fehlt" }, { status: 400 })
    }

    // Primär: Direkt in Mitarbeiter-Tabelle schreiben, damit Notfallkontakt
    // im FM-Profil sichtbar wird (Sprint AS Bugfix 2026-05).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}
    if (telefon != null) data.telefon = telefon
    if (fuehrerschein != null) data.fuehrerschein = fuehrerschein
    if (iban != null) data.iban = iban
    if (bankName != null) data.bankname = bankName
    if (notfallkontakt && typeof notfallkontakt === "object") {
      if (notfallkontakt.name != null) {
        data.notfallName = notfallkontakt.name
        data.notfallkontakt = notfallkontakt.name // Legacy-Feld zusätzlich
      }
      if (notfallkontakt.telefon != null) {
        data.notfallTelefon = notfallkontakt.telefon
        data.notfalltelefon = notfallkontakt.telefon // Legacy-Feld zusätzlich
      }
      if (notfallkontakt.beziehung != null) data.notfallBeziehung = notfallkontakt.beziehung
    }

    if (Object.keys(data).length > 0) {
      await prisma.mitarbeiter.update({
        where: { id: mitarbeiterId },
        data,
      }).catch((err) => {
        console.warn("[mitarbeiter/profil] Mitarbeiter-Update fehlgeschlagen:", err)
      })
    }

    // Sekundär: SystemConfig als Backup für Felder ohne Mitarbeiter-Spalte (z.B. bic)
    const profilData = { telefon, notfallkontakt, fuehrerschein, iban, bic, bankName, updatedAt: new Date().toISOString() }
    await prisma.systemConfig.upsert({
      where: { key: `mitarbeiter_profil_${mitarbeiterId}` },
      update: { value: JSON.stringify(profilData) },
      create: {
        key: `mitarbeiter_profil_${mitarbeiterId}`,
        value: JSON.stringify(profilData),
      },
    }).catch(() => null)

    return NextResponse.json({ success: true, message: "Profil gespeichert" })
  } catch (err) {
    console.error("[mitarbeiter/profil] Fehler:", err)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const mitarbeiterId = url.searchParams.get("mitarbeiterId")
  
  if (!mitarbeiterId) return NextResponse.json({ error: "mitarbeiterId fehlt" }, { status: 400 })

  const config = await prisma.systemConfig.findUnique({
    where: { key: `mitarbeiter_profil_${mitarbeiterId}` }
  }).catch(() => null)

  if (!config) return NextResponse.json({ profil: null })
  
  return NextResponse.json({ profil: JSON.parse(String(config.value)) })
}
