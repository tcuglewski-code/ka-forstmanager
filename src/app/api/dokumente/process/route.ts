/**
 * DOK-006: Verarbeitungs-Worker für die Dokumenten-Pipeline.
 *
 * POST /api/dokumente/process — Auth via CRON_SECRET.
 * - Reclaim: Scans > 15 min in IN_VERARBEITUNG → zurück auf AUSSTEHEND
 * - Holt bis zu 5 AUSSTEHENDe Scans (älteste zuerst)
 * - Max 3 Verarbeitungsversuche, danach FEHLER + Audit
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verarbeiteScan } from "@/lib/dokumente/pipeline/orchestrator"

export const maxDuration = 120

const MAX_VERSUCHE = 3
const RECLAIM_MINUTEN = 15
const BATCH_SIZE = 5

function istAutorisiert(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${secret}` || req.headers.get("x-cron-secret") === secret
}

export async function POST(req: NextRequest) {
  return verarbeiteBatch(req)
}

/** Vercel Cron ruft Pfade per GET auf (Authorization: Bearer CRON_SECRET). */
export async function GET(req: NextRequest) {
  return verarbeiteBatch(req)
}

async function verarbeiteBatch(req: NextRequest) {
  if (!istAutorisiert(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. Reclaim hängender Jobs
  const reclaimGrenze = new Date(Date.now() - RECLAIM_MINUTEN * 60 * 1000)
  const reclaimed = await prisma.dokumentenScan.updateMany({
    where: { status: "IN_VERARBEITUNG", verarbeitungBegonnenAm: { lt: reclaimGrenze } },
    data: { status: "AUSSTEHEND" },
  })

  // 2. Batch holen
  const scans = await prisma.dokumentenScan.findMany({
    where: { status: "AUSSTEHEND", deletedAt: null },
    orderBy: { erstelltAm: "asc" },
    take: BATCH_SIZE,
  })

  const ergebnisse: { scanId: string; status: string; grund?: string }[] = []

  for (const scan of scans) {
    // Locking: nur weiter wenn WIR den Scan auf IN_VERARBEITUNG setzen konnten
    const lock = await prisma.dokumentenScan.updateMany({
      where: { id: scan.id, status: "AUSSTEHEND" },
      data: {
        status: "IN_VERARBEITUNG",
        verarbeitungBegonnenAm: new Date(),
        verarbeitungsVersuche: { increment: 1 },
      },
    })
    if (lock.count === 0) continue // anderer Worker war schneller

    try {
      const ergebnis = await verarbeiteScan(scan)
      ergebnisse.push({ scanId: scan.id, status: ergebnis.status, grund: ergebnis.routingGrund })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const versuche = scan.verarbeitungsVersuche + 1
      const endgueltig = versuche >= MAX_VERSUCHE
      await prisma.dokumentenScan.update({
        where: { id: scan.id },
        data: {
          status: endgueltig ? "FEHLER" : "AUSSTEHEND",
          routingGrund: endgueltig ? `Verarbeitung ${versuche}× fehlgeschlagen: ${message}` : null,
          auditLog: {
            create: {
              aktion: "FEHLER",
              systemAktion: true,
              details: { versuch: versuche, fehler: message.slice(0, 500), endgueltig },
            },
          },
        },
      })
      ergebnisse.push({
        scanId: scan.id,
        status: endgueltig ? "FEHLER" : "RETRY",
        grund: message.slice(0, 200),
      })
    }
  }

  return NextResponse.json({
    verarbeitet: ergebnisse.length,
    reclaimed: reclaimed.count,
    ergebnisse,
  })
}
