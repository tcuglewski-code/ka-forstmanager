import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"

/**
 * GET /api/rechnungen/[id]/versions
 * Sprint GB-03: Alle Versionen einer Rechnung abrufen
 * 
 * Response:
 * - versions: Array aller gespeicherten Versionen (neueste zuerst)
 * - currentVersion: Aktuelle Versionsnummer + 1 (nächste Version bei Änderung)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  try {
    const { id } = await params
    
    // Rechnung existiert?
    const rechnung = await prisma.rechnung.findUnique({
      where: { id },
      select: { id: true, nummer: true },
    })
    
    if (!rechnung) {
      return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
    }
    
    // Alle Versionen laden
    const versions = await prisma.rechnungVersion.findMany({
      where: { rechnungId: id },
      orderBy: { versionNummer: 'desc' },
    })
    
    // Aktuelle Versionsnummer (höchste + 1)
    const currentVersion = versions.length > 0 
      ? versions[0].versionNummer + 1 
      : 1
    
    return NextResponse.json({
      rechnungId: id,
      rechnungNummer: rechnung.nummer,
      currentVersion,
      totalVersions: versions.length,
      versions: versions.map(v => ({
        id: v.id,
        versionNummer: v.versionNummer,
        createdAt: v.createdAt,
        erstelltVon: v.erstelltVonName || v.erstelltVon || 'System',
        aenderungsgrund: v.aenderungsgrund,
        // Snapshot-Daten
        nummer: v.nummer,
        betrag: v.betrag,
        mwst: v.mwst,
        status: v.status,
        rechnungsDatum: v.rechnungsDatum,
        faelligAm: v.faelligAm,
        nettoBetrag: v.nettoBetrag,
        bruttoBetrag: v.bruttoBetrag,
        rabatt: v.rabatt,
        rabattBetrag: v.rabattBetrag,
        rabattGrund: v.rabattGrund,
        zahlungsBedingung: v.zahlungsBedingung,
        notizen: v.notizen,
        positionen: v.positionenSnapshot,
      })),
    })
  } catch (error) {
    console.error("[RECHNUNG VERSIONS GET]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

/**
 * GET /api/rechnungen/[id]/versions/[versionId]
 * Einzelne Version mit Diff zur vorherigen Version
 */
