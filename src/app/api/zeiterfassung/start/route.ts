/**
 * POST /api/zeiterfassung/start — Stempeluhr Einstempeln (App-Alias)
 * Body: { user_id?: string, timestamp?: number, auftragId?: string, notiz?: string }
 * Response: { success: true, session_id: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"

const ACTIVE_TYPE = "stempeluhr_aktiv"

export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId) return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const { auftragId, notiz } = body as { auftragId?: string; notiz?: string }

  // Already active? Return existing session
  const existing = await prisma.stundeneintrag.findFirst({
    where: { mitarbeiterId, typ: ACTIVE_TYPE },
    orderBy: { createdAt: "desc" },
  })
  if (existing) {
    return NextResponse.json({
      success: true,
      session_id: existing.id,
      already_active: true,
      start_time: existing.createdAt.toISOString(),
    })
  }

  const session = await prisma.stundeneintrag.create({
    data: {
      mitarbeiterId,
      datum: new Date(),
      stunden: 0,
      typ: ACTIVE_TYPE,
      auftragId: auftragId ?? null,
      notiz: notiz ?? null,
      genehmigt: false,
    },
  })

  return NextResponse.json(
    {
      success: true,
      session_id: session.id,
      start_time: session.createdAt.toISOString(),
    },
    { status: 201 }
  )
}
