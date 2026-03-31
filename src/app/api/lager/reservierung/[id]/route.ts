// KL-1: Reservierung Status ändern
// PATCH /api/lager/reservierung/[id] — Status aktualisieren (verbrauchen, zurück)
// DELETE /api/lager/reservierung/[id] — Reservierung stornieren

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH — Status ändern (verbrauchen oder zurückgeben)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await auth()
    
    const { id } = await params
    const body = await req.json()
    const { status, menge } = body

    // Reservierung laden
    const reservierung = await prisma.lagerReservierung.findUnique({
      where: { id },
      include: { artikel: true },
    })

    if (!reservierung) {
      return NextResponse.json({ error: "Reservierung nicht gefunden" }, { status: 404 })
    }

    // Status-Wechsel validieren
    const validStatus = ["RESERVIERT", "VERBRAUCHT", "ZURUECK"]
    if (status && !validStatus.includes(status)) {
      return NextResponse.json(
        { error: `Ungültiger Status. Erlaubt: ${validStatus.join(", ")}` },
        { status: 400 }
      )
    }

    // Bei VERBRAUCHT: Bestand reduzieren
    if (status === "VERBRAUCHT" && reservierung.status === "RESERVIERT") {
      const verbrauchteMenge = menge || reservierung.menge

      // Bestand reduzieren
      await prisma.lagerArtikel.update({
        where: { id: reservierung.artikelId },
        data: {
          bestand: { decrement: verbrauchteMenge },
        },
      })

      // Bewegung protokollieren
      await prisma.lagerBewegung.create({
        data: {
          artikelId: reservierung.artikelId,
          typ: "ausgang",
          menge: -verbrauchteMenge,
          referenz: `Auftrag: ${reservierung.auftragId}`,
          auftragId: reservierung.auftragId,
          notiz: "Reservierung verbraucht",
        },
      })
    }

    // Bei ZURUECK: Reservierung aufheben (Bestand bleibt unverändert)
    if (status === "ZURUECK" && reservierung.status === "RESERVIERT") {
      // Keine Bestandsänderung nötig, da noch nicht vom Bestand abgezogen
    }

    // Reservierung aktualisieren
    const updated = await prisma.lagerReservierung.update({
      where: { id },
      data: {
        status: status || reservierung.status,
        menge: menge !== undefined ? parseFloat(String(menge)) : reservierung.menge,
        verbrauchtAm: status === "VERBRAUCHT" ? new Date() : undefined,
      },
      include: {
        artikel: {
          select: { name: true, einheit: true, bestand: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[Reservierung PATCH] Fehler:", error)
    return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 })
  }
}

// DELETE — Reservierung stornieren
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await auth()
    
    const { id } = await params

    await prisma.lagerReservierung.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Reservierung DELETE] Fehler:", error)
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 })
  }
}
