// KH-1: API Route für KI Dokument-Analyse
// POST /api/ki/dokument-analyse — Nimmt File, gibt vorausgefüllte Felder zurück

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { analysiereDokument, isKIVerfuegbar } from "@/lib/ki/dokument-auswertung"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60 // Erlaubt längere Verarbeitungszeit

export async function POST(req: NextRequest) {
  try {
    // Auth prüfen
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // KI verfügbar?
    const kiStatus = isKIVerfuegbar()
    if (!kiStatus.verfuegbar) {
      return NextResponse.json(
        { error: "KI-Features nicht verfügbar", grund: kiStatus.grund },
        { status: 503 }
      )
    }

    // Consent prüfen
    const consent = await prisma.userConsent.findUnique({
      where: {
        userId_consentType: {
          userId: session.user.id,
          consentType: "KI_VERARBEITUNG",
        },
      },
    })

    if (!consent || consent.revokedAt) {
      return NextResponse.json(
        { error: "KI-Einwilligung erforderlich", code: "CONSENT_REQUIRED" },
        { status: 403 }
      )
    }

    // Form Data parsen
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 })
    }

    // Dateigröße prüfen (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Datei zu groß (max 10MB)" },
        { status: 400 }
      )
    }

    // MIME-Type prüfen
    const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Nicht unterstütztes Format: ${file.type}. Unterstützt: JPEG, PNG, GIF, WebP` },
        { status: 400 }
      )
    }

    // File zu Base64 konvertieren
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // KI-Analyse durchführen
    const extractedData = await analysiereDokument(base64, file.type)

    // Ergebnis zurückgeben
    return NextResponse.json({
      success: true,
      data: extractedData,
      meta: {
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
        confidence: extractedData.confidence,
      },
    })
  } catch (error) {
    console.error("[KI Dokument-Analyse] Fehler:", error)
    
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    return NextResponse.json(
      { error: "KI-Analyse fehlgeschlagen", details: message },
      { status: 500 }
    )
  }
}
