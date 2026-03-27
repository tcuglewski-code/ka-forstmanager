// Sprint AL: Kundenportal Dokumenten-Upload
// Lädt Dateien in die Nextcloud hoch: /Koch-Aufforstung/Kunden/{kundeId}/

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { dateiHochladen, ordnerErstellen } from "@/lib/nextcloud"
import { prisma } from "@/lib/prisma"

// Erlaubte MIME-Typen
const ERLAUBTE_TYPEN = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]

// Maximale Dateigröße: 20 MB
const MAX_GROESSE_BYTES = 20 * 1024 * 1024

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  try {
    const formData = await req.formData()
    const datei = formData.get("datei") as File | null
    const kundeId = formData.get("kundeId") as string | null
    const auftragId = formData.get("auftragId") as string | null
    const dokumentTyp = (formData.get("typ") as string) ?? "sonstiges"

    // Validierung
    if (!datei) {
      return NextResponse.json({ error: "Keine Datei übermittelt" }, { status: 400 })
    }
    if (!kundeId) {
      return NextResponse.json({ error: "kundeId fehlt" }, { status: 400 })
    }

    // Dateityp prüfen
    if (!ERLAUBTE_TYPEN.includes(datei.type)) {
      return NextResponse.json(
        { error: `Dateityp nicht erlaubt: ${datei.type}. Erlaubt: PDF, Bilder, Word, Excel, Text` },
        { status: 400 }
      )
    }

    // Dateigröße prüfen
    if (datei.size > MAX_GROESSE_BYTES) {
      return NextResponse.json(
        { error: `Datei zu groß. Maximum: ${MAX_GROESSE_BYTES / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    // Dateiname bereinigen (Sonderzeichen entfernen)
    const sauberName = datei.name
      .replace(/[^a-zA-Z0-9.\-_äöüÄÖÜß ]/g, "_")
      .replace(/\s+/g, "_")

    // Zeitstempel-Präfix für Eindeutigkeit
    const zeitstempel = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const dateiname = `${zeitstempel}_${sauberName}`

    // Speicherpfad: /Koch-Aufforstung/Kunden/{kundeId}/
    const basisPfad = `/Koch-Aufforstung/Kunden/${kundeId}`
    const zielpfad = `${basisPfad}/${dateiname}`

    // Ordnerstruktur erstellen
    await ordnerErstellen("/Koch-Aufforstung")
    await ordnerErstellen("/Koch-Aufforstung/Kunden")
    await ordnerErstellen(basisPfad)

    // Datei hochladen
    const dateiBuffer = await datei.arrayBuffer()
    const ergebnis = await dateiHochladen(dateiBuffer, zielpfad, datei.type)

    if (!ergebnis.erfolg) {
      console.error("[Upload] Nextcloud-Fehler:", ergebnis.fehler)
      return NextResponse.json(
        { error: `Upload fehlgeschlagen: ${ergebnis.fehler}` },
        { status: 500 }
      )
    }

    // Dokument in Datenbank speichern
    const dokument = await prisma.dokument.create({
      data: {
        name: datei.name,
        typ: dokumentTyp,
        url: ergebnis.url,
        nextcloudPath: ergebnis.pfad,
        auftragId: auftragId ?? null,
        hochgeladenVon: (session.user as { id?: string })?.id ?? null,
      },
    })

    return NextResponse.json({
      erfolg: true,
      dokument,
      pfad: ergebnis.pfad,
      dateiname,
      groesse: datei.size,
    }, { status: 201 })

  } catch (err) {
    console.error("[Kundenportal Upload] Fehler:", err)
    return NextResponse.json(
      { error: "Interner Fehler beim Upload", details: String(err) },
      { status: 500 }
    )
  }
}
