/**
 * DOK-003: /api/dokumente/scans/[id]
 * GET   — Scan + Positionen + AuditLog
 * PATCH — Status-Update (nur erlaubte Übergänge) + AuditLog
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DokAktion, DokStatus } from "@prisma/client"

/** Erlaubte Status-Übergänge der Dokumenten-Pipeline */
const ERLAUBTE_UEBERGAENGE: Record<DokStatus, DokStatus[]> = {
  AUSSTEHEND: ["IN_VERARBEITUNG", "ABGELEHNT"],
  IN_VERARBEITUNG: ["REVIEW_ERFORDERLICH", "GEBUCHT", "FEHLER", "ABGELEHNT"],
  REVIEW_ERFORDERLICH: ["GEBUCHT", "ABGELEHNT"],
  GEBUCHT: [], // Storno via eigenem Flow, nicht via PATCH
  ABGELEHNT: ["AUSSTEHEND"], // erneute Verarbeitung möglich
  FEHLER: ["AUSSTEHEND"],
}

const STATUS_AKTION: Partial<Record<DokStatus, DokAktion>> = {
  IN_VERARBEITUNG: "REVIEW_GESTARTET",
  REVIEW_ERFORDERLICH: "REVIEW_GESTARTET",
  GEBUCHT: "GEBUCHT",
  ABGELEHNT: "ABGELEHNT",
  FEHLER: "FEHLER",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const scan = await prisma.dokumentenScan.findFirst({
    where: { id, deletedAt: null },
    include: {
      positionen: true,
      auditLog: { orderBy: { erstelltAm: "desc" } },
    },
  })
  if (!scan) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  return NextResponse.json(scan)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const body = (await req.json()) as { status?: string; grund?: string }
    const neuerStatus = body.status

    if (!neuerStatus || !Object.keys(DokStatus).includes(neuerStatus)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
    }

    const scan = await prisma.dokumentenScan.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    })
    if (!scan) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

    const ziel = neuerStatus as DokStatus
    const aktuell = scan.status as DokStatus
    if (!ERLAUBTE_UEBERGAENGE[aktuell].includes(ziel)) {
      return NextResponse.json(
        { error: `Übergang ${scan.status} → ${ziel} nicht erlaubt` },
        { status: 409 }
      )
    }

    const userId = (session.user as { id?: string }).id || session.user.email || "unbekannt"
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

    const aktualisiert = await prisma.dokumentenScan.update({
      where: { id },
      data: {
        status: ziel,
        ...(body.grund ? { routingGrund: body.grund } : {}),
        auditLog: {
          create: {
            aktion: STATUS_AKTION[ziel] ?? "REVIEW_GESTARTET",
            userId,
            ipAdresse: ip,
            details: { von: scan.status, nach: ziel, grund: body.grund ?? null },
          },
        },
      },
    })

    return NextResponse.json(aktualisiert)
  } catch (error) {
    console.error("[DokumentenScan] PATCH fehlgeschlagen:", error)
    return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 })
  }
}
