/**
 * PATCH /api/app/protokolle/[id]/korrektur — Korrektur eines Tagesprotokolls
 *
 * Speichert nachträgliche Änderungen mit Begründung im AuditLog.
 * Berechtigt: Ersteller des Protokolls, Gruppenführer der Gruppe, Admin.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

const FIELD_MAP: Record<string, string> = {
  pause_minuten: "pauseMinuten",
  pauseMinuten: "pauseMinuten",
  arbeitsbeginn: "arbeitsbeginn",
  arbeitsende: "arbeitsende",
  wetter: "witterung",
  witterung: "witterung",
  notizen: "bericht",
  bericht: "bericht",
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  const proto = await prisma.tagesprotokoll.findUnique({ where: { id } })
  if (!proto) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let allowed = isAdmin || (ownId !== null && proto.erstellerId === ownId)
  if (!allowed && isGF && ownId && proto.gruppeId) {
    const g = await prisma.gruppe.findFirst({
      where: { id: proto.gruppeId, gruppenfuehrerId: ownId },
      select: { id: true },
    })
    allowed = !!g
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const grund: string = String(body.grund ?? "").trim()
  if (!grund) {
    return NextResponse.json({ error: "Grund für die Korrektur ist erforderlich" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oldValue: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newValue: Record<string, any> = {}

  for (const [k, v] of Object.entries(body)) {
    if (k === "grund") continue
    const dbField = FIELD_MAP[k]
    if (!dbField) continue
    data[dbField] = v
    oldValue[dbField] = (proto as unknown as Record<string, unknown>)[dbField] ?? null
    newValue[dbField] = v
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine korrigierbaren Felder im Payload" }, { status: 400 })
  }

  try {
    const updated = await prisma.tagesprotokoll.update({ where: { id }, data })
    await prisma.auditLog
      .create({
        data: {
          userId: typeof appUser.sub === "string" ? appUser.sub : null,
          action: "UPDATE",
          entityType: "Tagesprotokoll",
          entityId: id,
          oldValue,
          newValue: { ...newValue, _grund: grund },
        },
      })
      .catch((err: unknown) => console.warn("[korrektur] AuditLog-Fehler:", err))

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[app/protokolle/korrektur]", err)
    return NextResponse.json({ error: "Fehler bei der Korrektur" }, { status: 500 })
  }
}
