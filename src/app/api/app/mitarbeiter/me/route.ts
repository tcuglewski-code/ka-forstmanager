/**
 * GET /api/app/mitarbeiter/me — Aktuellen Mitarbeiter zurückgeben
 * App nutzt diesen Endpoint nach Login um eigene gruppe_id + rolle zu laden.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

// Normalisiert DB-Rollen auf App-kompatible Rollen (ka_*)
function normalizeRole(rolle: string | null | undefined): string | null {
  if (!rolle) return null
  const key = rolle
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .toLowerCase()
  const map: Record<string, string> = {
    admin: "ka_admin",
    administrator: "ka_admin",
    ka_admin: "ka_admin",
    gf_standard: "ka_gruppenfuehrer",
    gf_senior: "ka_gruppenfuehrer",
    gruppenfuehrer: "ka_gruppenfuehrer",
    ka_gruppenfuehrer: "ka_gruppenfuehrer",
    gf: "ka_gf",
    ka_gf: "ka_gf",
    foerster: "ka_foerster",
    ka_foerster: "ka_foerster",
    mitarbeiter: "ka_mitarbeiter",
    ka_mitarbeiter: "ka_mitarbeiter",
  }
  return map[key] ?? key
}

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  const sub = typeof appUser.sub === "string" ? appUser.sub : null

  if (!mitarbeiterId && sub) {
    const linked = await prisma.mitarbeiter.findFirst({
      where: { userId: sub },
      select: { id: true },
    })
    mitarbeiterId = linked?.id ?? null
  }

  if (!mitarbeiterId) {
    return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 404 })
  }

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
    select: {
      id: true,
      vorname: true,
      nachname: true,
      email: true,
      telefon: true,
      mobil: true,
      rolle: true,
      status: true,
      gruppen: {
        select: {
          gruppeId: true,
          rolle: true,
          gruppe: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!mitarbeiter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Primäre Gruppe: zuerst Mitgliedschaft, sonst geführte Gruppe
  let primaryGruppeId: string | null = mitarbeiter.gruppen[0]?.gruppeId ?? null
  let primaryGruppeName: string | null = mitarbeiter.gruppen[0]?.gruppe?.name ?? null

  if (!primaryGruppeId) {
    const ledGruppe = await prisma.gruppe.findFirst({
      where: { gruppenfuehrerId: mitarbeiterId },
      select: { id: true, name: true },
    })
    primaryGruppeId = ledGruppe?.id ?? null
    primaryGruppeName = ledGruppe?.name ?? null
  }

  const normalizedRolle = normalizeRole(mitarbeiter.rolle)
  const name = [mitarbeiter.vorname, mitarbeiter.nachname].filter(Boolean).join(" ")

  return NextResponse.json({
    ...mitarbeiter,
    name,
    username: mitarbeiter.email,
    gruppe_id: primaryGruppeId,
    gruppeId: primaryGruppeId,
    gruppe_name: primaryGruppeName,
    gruppeName: primaryGruppeName,
    role: normalizedRolle,
    roles: normalizedRolle ? [normalizedRolle] : [],
  })
}
