// Sprint AH: GPS-Tracking für Arbeitseinsätze
// GET: GPS-Track eines Einsatzes abrufen
// POST: GPS-Punkte zu einem Einsatz hinzufügen

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GPS-Punkt Typ
interface GpsPunkt {
  lat: number
  lon: number
  timestamp: string // ISO 8601
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params

  const einsatz = await prisma.ernteEinsatz.findUnique({
    where: { id },
    select: { id: true, gpsTrack: true, datum: true, baumart: true, ort: true },
  })

  if (!einsatz) {
    return NextResponse.json({ error: "Einsatz nicht gefunden" }, { status: 404 })
  }

  return NextResponse.json({
    einsatzId: id,
    datum: einsatz.datum,
    baumart: einsatz.baumart,
    ort: einsatz.ort,
    gpsTrack: (einsatz.gpsTrack as unknown as GpsPunkt[]) ?? [],
    punkteAnzahl: Array.isArray(einsatz.gpsTrack) ? (einsatz.gpsTrack as unknown as GpsPunkt[]).length : 0,
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Einzelner Punkt oder Array von Punkten
  const neuePunkte: GpsPunkt[] = Array.isArray(body) ? body : [body]

  // Validierung
  for (const punkt of neuePunkte) {
    if (typeof punkt.lat !== "number" || typeof punkt.lon !== "number") {
      return NextResponse.json(
        { error: "Ungültige GPS-Daten: lat und lon müssen Zahlen sein" },
        { status: 400 }
      )
    }
    if (punkt.lat < -90 || punkt.lat > 90 || punkt.lon < -180 || punkt.lon > 180) {
      return NextResponse.json(
        { error: "GPS-Koordinaten außerhalb des gültigen Bereichs" },
        { status: 400 }
      )
    }
  }

  // Bestehenden Track laden
  const einsatz = await prisma.ernteEinsatz.findUnique({
    where: { id },
    select: { gpsTrack: true },
  })

  if (!einsatz) {
    return NextResponse.json({ error: "Einsatz nicht gefunden" }, { status: 404 })
  }

  // Timestamp hinzufügen falls nicht vorhanden
  const punkteMitTimestamp = neuePunkte.map((p) => ({
    lat: p.lat,
    lon: p.lon,
    timestamp: p.timestamp ?? new Date().toISOString(),
  }))

  // Neue Punkte zum bestehenden Track hinzufügen
  const bestehendeTrack = Array.isArray(einsatz.gpsTrack) ? (einsatz.gpsTrack as unknown as GpsPunkt[]) : []
  const aktualisiertTrack = [...bestehendeTrack, ...punkteMitTimestamp]

  const aktualisiert = await prisma.ernteEinsatz.update({
    where: { id },
    data: { gpsTrack: aktualisiertTrack as unknown as import('@prisma/client').Prisma.InputJsonValue },
    select: { id: true, gpsTrack: true },
  })

  return NextResponse.json({
    einsatzId: id,
    gpsTrack: aktualisiert.gpsTrack,
    punkteAnzahl: aktualisiertTrack.length,
    neuePunkte: punkteMitTimestamp.length,
  })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params

  const aktualisiert = await prisma.ernteEinsatz.update({
    where: { id },
    data: { gpsTrack: [] },
    select: { id: true },
  })

  return NextResponse.json({ einsatzId: aktualisiert.id, message: "GPS-Track gelöscht" })
}
