/**
 * API-Route: /api/buchhaltung/rechnungen
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
    const status = searchParams.get("status")
    const von = searchParams.get("von")
    const bis = searchParams.get("bis")
    
    const where: Record<string, unknown> = {
      deletedAt: null, // Nur aktive Rechnungen
    }
    
    if (status) {
      where.status = status
    }
    
    if (von || bis) {
      where.rechnungsDatum = {}
      if (von) (where.rechnungsDatum as Record<string, Date>).gte = new Date(von)
      if (bis) (where.rechnungsDatum as Record<string, Date>).lte = new Date(bis)
    }
    
    const [rechnungen, total] = await Promise.all([
      prisma.rechnung.findMany({
        where,
        include: {
          auftrag: {
            select: {
              id: true,
              titel: true,
              nummer: true,
              waldbesitzer: true,
            }
          },
          positionen: true,
        },
        orderBy: { rechnungsDatum: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rechnung.count({ where }),
    ])
    
    return NextResponse.json({
      data: rechnungen,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      meta: {
        readonly: true,
        accessLevel: "accountant",
      }
    })
  } catch (error) {
    console.error("Buchhaltung Rechnungen API Error:", error)
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
