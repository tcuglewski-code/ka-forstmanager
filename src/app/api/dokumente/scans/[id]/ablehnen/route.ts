/**
 * DOK-031: POST /api/dokumente/scans/[id]/ablehnen
 *
 * Ablehnung eines Scans im Review (REVIEW_ERFORDERLICH/FEHLER → ABGELEHNT).
 * Grund ist Pflicht (Audit-Nachvollziehbarkeit). Keine Lagerbuchung.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const BodySchema = z.object({ grund: z.string().min(3).max(500) })
const ERLAUBT = ["REVIEW_ERFORDERLICH", "FEHLER", "AUSSTEHEND"]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: "Ablehnungsgrund fehlt (min. 3 Zeichen)" }, { status: 400 })
    }

    const scan = await prisma.dokumentenScan.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    })
    if (!scan) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    if (!ERLAUBT.includes(scan.status)) {
      return NextResponse.json(
        { error: `Ablehnung aus ${scan.status} nicht möglich` },
        { status: 409 }
      )
    }

    const userId = (session.user as { id?: string }).id || session.user.email || "unbekannt"
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

    const aktualisiert = await prisma.dokumentenScan.update({
      where: { id },
      data: {
        status: "ABGELEHNT",
        routingGrund: parsed.data.grund,
        auditLog: {
          create: {
            aktion: "ABGELEHNT",
            userId,
            ipAdresse: ip,
            details: { von: scan.status, grund: parsed.data.grund },
          },
        },
      },
    })

    return NextResponse.json({ ok: true, status: aktualisiert.status })
  } catch (error) {
    console.error("[DokumentenScan] Ablehnen fehlgeschlagen:", error)
    return NextResponse.json({ error: "Ablehnung fehlgeschlagen" }, { status: 500 })
  }
}
