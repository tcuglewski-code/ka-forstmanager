/**
 * API-Route: /api/buchhaltung/stundeneintraege
 * Sprint GB-05: Steuerberater-Zugang (Read-Only)
 * 
 * Erlaubt nur GET-Anfragen für Rollen: admin, ka_admin, accountant
 * Keine Schreiboperationen erlaubt
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth, canAccessAccounting } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    
    if (!canAccessAccounting(session.user)) {
      return NextResponse.json({ error: "Keine Berechtigung für Buchhaltungsdaten" }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const von = searchParams.get("von")
    const bis = searchParams.get("bis")
    const mitarbeiterId = searchParams.get("mitarbeiterId")
    const auftragId = searchParams.get("auftragId")
    const genehmigt = searchParams.get("genehmigt")
    
    const where: Record<string, unknown> = {}
    
    if (von || bis) {
      where.datum = {}
      if (von) (where.datum as Record<string, Date>).gte = new Date(von)
      if (bis) (where.datum as Record<string, Date>).lte = new Date(bis)
    }
    
    if (mitarbeiterId) {
      where.mitarbeiterId = mitarbeiterId
    }
    
    if (auftragId) {
      where.auftragId = auftragId
    }
    
    if (genehmigt !== null && genehmigt !== undefined) {
      where.genehmigt = genehmigt === "true"
    }
    
    const [stundeneintraege, total] = await Promise.all([
      prisma.stundeneintrag.findMany({
        where,
        include: {
          mitarbeiter: {
            select: {
              id: true,
              vorname: true,
              nachname: true,
            }
          },
          auftrag: {
            select: {
              id: true,
              titel: true,
              nummer: true,
            }
          },
        },
        orderBy: { datum: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stundeneintrag.count({ where }),
    ])
    
    // Aggregierte Statistiken für Steuerberater
    const statsResult = await prisma.stundeneintrag.aggregate({
      where,
      _sum: {
        stunden: true,
      },
      _count: true,
    })
    
    return NextResponse.json({
      data: stundeneintraege,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        gesamtStunden: statsResult._sum.stunden || 0,
        anzahlEintraege: statsResult._count,
      },
      meta: {
        readonly: true,
        accessLevel: "accountant",
      }
    })
  } catch (error) {
    console.error("Buchhaltung Stundeneinträge API Error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// Explizit alle Schreiboperationen ablehnen
export async function POST() {
  return NextResponse.json(
    { error: "Schreibzugriff nicht erlaubt. Steuerberater haben nur Lesezugriff." },
    { status: 403 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: "Schreibzugriff nicht erlaubt. Steuerberater haben nur Lesezugriff." },
    { status: 403 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Schreibzugriff nicht erlaubt. Steuerberater haben nur Lesezugriff." },
    { status: 403 }
  )
}
