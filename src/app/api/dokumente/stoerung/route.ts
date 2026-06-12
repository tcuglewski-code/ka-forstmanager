/**
 * DOK-064: Störungs-Erkennung der Dokumenten-Pipeline.
 * GET /api/dokumente/stoerung → Banner-Status für die Review-UI:
 *  - ≥3 FEHLER in den letzten 24h, oder
 *  - ≥10 Scans hängen länger als 1h in AUSSTEHEND/IN_VERARBEITUNG
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vor24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const vor1h = new Date(Date.now() - 60 * 60 * 1000)

  const [fehler24h, backlog] = await Promise.all([
    prisma.dokumentenScan.count({
      where: { status: "FEHLER", aktualisiertAm: { gte: vor24h }, deletedAt: null },
    }),
    prisma.dokumentenScan.count({
      where: {
        status: { in: ["AUSSTEHEND", "IN_VERARBEITUNG"] },
        erstelltAm: { lt: vor1h },
        deletedAt: null,
      },
    }),
  ])

  const gruende: string[] = []
  if (fehler24h >= 3) gruende.push(`${fehler24h} Verarbeitungsfehler in 24h`)
  if (backlog >= 10) gruende.push(`${backlog} Dokumente hängen >1h in der Warteschlange`)

  return NextResponse.json({
    stoerung: gruende.length > 0,
    gruende,
    fehler24h,
    backlog,
  })
}
