/**
 * POST /api/app/mitarbeiter/profil  — persönliche Profil-Daten speichern (Bearer-Auth)
 * PATCH /api/app/mitarbeiter/profil — alias für POST
 *
 * Schreibt in Mitarbeiter-Tabelle + SystemConfig (Backup).
 * Nur der Mitarbeiter selbst (oder Admin) darf das Profil ändern.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

async function handle(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"

  const targetId: string | null =
    body.mitarbeiterId ?? body.mitarbeiter_id ?? ownId ?? null

  if (!targetId) {
    return NextResponse.json({ error: "mitarbeiterId fehlt" }, { status: 400 })
  }
  if (!isAdmin && targetId !== ownId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { telefon, notfallkontakt, fuehrerschein, iban, bic, bankName } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}
  if (telefon != null) data.telefon = telefon
  if (fuehrerschein != null) data.fuehrerschein = fuehrerschein
  if (iban != null) data.iban = iban
  if (bankName != null) data.bankname = bankName
  if (notfallkontakt && typeof notfallkontakt === "object") {
    if (notfallkontakt.name != null) {
      data.notfallName = notfallkontakt.name
      data.notfallkontakt = notfallkontakt.name
    }
    if (notfallkontakt.telefon != null) {
      data.notfallTelefon = notfallkontakt.telefon
      data.notfalltelefon = notfallkontakt.telefon
    }
    if (notfallkontakt.beziehung != null) data.notfallBeziehung = notfallkontakt.beziehung
  }

  if (Object.keys(data).length > 0) {
    await prisma.mitarbeiter
      .update({ where: { id: targetId }, data })
      .catch((err: unknown) => console.warn("[app/mitarbeiter/profil] Update fehlgeschlagen:", err))
  }

  const profilData = { telefon, notfallkontakt, fuehrerschein, iban, bic, bankName, updatedAt: new Date().toISOString() }
  await prisma.systemConfig
    .upsert({
      where: { key: `mitarbeiter_profil_${targetId}` },
      update: { value: JSON.stringify(profilData) },
      create: { key: `mitarbeiter_profil_${targetId}`, value: JSON.stringify(profilData) },
    })
    .catch(() => null)

  return NextResponse.json({ success: true, message: "Profil gespeichert" })
}

export const POST = handle
export const PATCH = handle

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const targetId = url.searchParams.get("mitarbeiterId") ?? ownId
  if (!targetId) return NextResponse.json({ error: "mitarbeiterId fehlt" }, { status: 400 })

  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  if (!isAdmin && targetId !== ownId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const config = await prisma.systemConfig
    .findUnique({ where: { key: `mitarbeiter_profil_${targetId}` } })
    .catch(() => null)

  if (!config) return NextResponse.json({ profil: null })
  return NextResponse.json({ profil: JSON.parse(String(config.value)) })
}
