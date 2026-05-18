/**
 * POST /api/app/auftraege/[id]/zuweisungen — Mitarbeiter einem Auftrag zuweisen
 *
 * Fügt den Mitarbeiter zur Gruppe des Auftrags hinzu (GruppeMitglied).
 * Berechtigt: Admin oder Gruppenführer der Gruppe.
 *
 * Body:
 *  - mitarbeiterId | mitarbeiter_id: string
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  if (!isAdmin && !isGF) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const mitarbeiterId: string | null = body.mitarbeiterId ?? body.mitarbeiter_id ?? null
  if (!mitarbeiterId) {
    return NextResponse.json(
      { error: "Ungültige Daten", detail: "mitarbeiterId ist erforderlich" },
      { status: 400 }
    )
  }

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    select: { id: true, gruppeId: true, titel: true },
  })
  if (!auftrag) return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })
  if (!auftrag.gruppeId) {
    return NextResponse.json(
      { error: "Auftrag hat keine Gruppe — bitte zuerst Gruppe zuweisen" },
      { status: 400 }
    )
  }

  // GF: muss Führer der Gruppe sein
  if (!isAdmin && ownId) {
    const isLeader = await prisma.gruppe.findFirst({
      where: { id: auftrag.gruppeId, gruppenfuehrerId: ownId },
      select: { id: true },
    })
    if (!isLeader) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Idempotent: existierende Mitgliedschaft tolerieren
  const existing = await prisma.gruppeMitglied.findFirst({
    where: { gruppeId: auftrag.gruppeId, mitarbeiterId },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ success: true, alreadyMember: true, mitarbeiterId, auftragId: id })
  }

  try {
    await prisma.gruppeMitglied.create({
      data: { gruppeId: auftrag.gruppeId, mitarbeiterId },
    })
    return NextResponse.json({ success: true, mitarbeiterId, auftragId: id }, { status: 201 })
  } catch (err) {
    console.error("[app/auftraege/zuweisungen]", err)
    return NextResponse.json({ error: "Fehler beim Zuweisen" }, { status: 500 })
  }
}
