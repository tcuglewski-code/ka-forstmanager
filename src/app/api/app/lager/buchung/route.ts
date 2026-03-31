import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface BuchungBody {
  artikelId: string
  typ: "eingang" | "ausgang" | "reserve" | "rueckgabe" | "korrektur"
  menge: number
  notiz?: string
  auftragId?: string
  mitarbeiterId?: string
  offlineId?: string // Für Offline-Queue Deduplication
}

// POST: Neue Buchung von Mobile App erstellen
export async function POST(req: NextRequest) {
  try {
    const body: BuchungBody = await req.json()
    const { artikelId, typ, menge, notiz, auftragId, mitarbeiterId, offlineId } = body

    if (!artikelId || !typ || !menge) {
      return NextResponse.json(
        { error: "artikelId, typ und menge sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe auf Duplikat (Offline-Sync)
    if (offlineId) {
      const existing = await prisma.lagerBewegung.findFirst({
        where: { referenz: `offline:${offlineId}` }
      })
      if (existing) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          bewegungId: existing.id,
          message: "Buchung bereits verarbeitet"
        })
      }
    }

    // Artikel prüfen
    const artikel = await prisma.lagerArtikel.findUnique({
      where: { id: artikelId }
    })

    if (!artikel) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 })
    }

    // Bestandsänderung berechnen
    let bestandsAenderung = 0
    if (typ === "eingang" || typ === "rueckgabe" || typ === "korrektur") {
      bestandsAenderung = Math.abs(menge)
    } else if (typ === "ausgang" || typ === "reserve") {
      bestandsAenderung = -Math.abs(menge)
      
      // Prüfe ob genug Bestand vorhanden
      if (artikel.bestand + bestandsAenderung < 0) {
        return NextResponse.json(
          { 
            error: "Nicht genügend Bestand",
            verfuegbar: artikel.bestand,
            angefordert: Math.abs(menge)
          },
          { status: 400 }
        )
      }
    }

    // Transaktion: Buchung erstellen + Bestand aktualisieren
    const [bewegung] = await prisma.$transaction([
      prisma.lagerBewegung.create({
        data: {
          artikelId,
          typ,
          menge: Math.abs(menge),
          notiz: notiz || null,
          auftragId: auftragId || null,
          mitarbeiterId: mitarbeiterId || null,
          referenz: offlineId ? `offline:${offlineId}` : null
        }
      }),
      prisma.lagerArtikel.update({
        where: { id: artikelId },
        data: { bestand: { increment: bestandsAenderung } }
      })
    ])

    // Aktuellen Bestand abrufen
    const aktualisierterArtikel = await prisma.lagerArtikel.findUnique({
      where: { id: artikelId },
      select: { bestand: true, mindestbestand: true }
    })

    return NextResponse.json({
      success: true,
      bewegungId: bewegung.id,
      neuerBestand: aktualisierterArtikel?.bestand,
      status: aktualisierterArtikel && aktualisierterArtikel.bestand <= aktualisierterArtikel.mindestbestand ? "kritisch" : "ok"
    }, { status: 201 })
  } catch (error) {
    console.error("Buchung Fehler:", error)
    return NextResponse.json({ error: "Fehler bei der Buchung" }, { status: 500 })
  }
}
