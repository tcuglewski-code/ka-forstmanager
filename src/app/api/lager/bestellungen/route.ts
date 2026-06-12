import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, isAdminRole } from "@/lib/auth-helpers"

// GET: Liste aller Bestellungen
// AUDIT-FIX T-024: Auth erforderlich — Lieferantendaten/Preise waren ohne Login lesbar
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const bestellungen = await prisma.bestellung.findMany({
      include: {
        lieferant: {
          select: { id: true, name: true, email: true }
        },
        positionen: {
          include: {
            artikel: {
              select: { id: true, name: true, einheit: true }
            }
          }
        }
      },
      orderBy: { bestelldatum: "desc" }
    })
    
    return NextResponse.json(bestellungen)
  } catch (error) {
    console.error("Fehler beim Laden der Bestellungen:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// POST: Neue Bestellung erstellen
// AUDIT-FIX T-002: Auth + Admin-Check — Endpoint war komplett offen (Schreibzugriff ohne Login)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    if (!isAdminRole((user as { role?: string }).role)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    const body = await req.json()
    const { lieferantId, positionen, gesamtbetrag, notizen } = body

    if (!lieferantId || !positionen || positionen.length === 0) {
      return NextResponse.json(
        { error: "lieferantId und mindestens eine Position erforderlich" },
        { status: 400 }
      )
    }

    const bestellung = await prisma.bestellung.create({
      data: {
        lieferantId,
        gesamtbetrag: gesamtbetrag || 0,
        notizen,
        status: "ENTWURF",
        positionen: {
          create: positionen.map((p: { artikelId: string; menge: number; einzelpreis: number }) => ({
            artikelId: p.artikelId,
            menge: p.menge,
            einzelpreis: p.einzelpreis
          }))
        }
      },
      include: {
        lieferant: true,
        positionen: {
          include: { artikel: true }
        }
      }
    })

    return NextResponse.json(bestellung, { status: 201 })
  } catch (error) {
    console.error("Fehler beim Erstellen der Bestellung:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
