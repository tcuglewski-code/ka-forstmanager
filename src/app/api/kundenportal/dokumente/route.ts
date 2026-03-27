// Sprint AL: Kundenportal Dokumentenliste
// GET: Alle Dokumente eines Kunden abrufen (aus Nextcloud + Datenbank)
// DELETE: Dokument löschen

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { dateiListeAbrufen, dateiLoeschen } from "@/lib/nextcloud"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const url = new URL(req.url)
  const kundeId = url.searchParams.get("kundeId")
  const auftragId = url.searchParams.get("auftragId")

  if (!kundeId) {
    return NextResponse.json({ error: "kundeId fehlt" }, { status: 400 })
  }

  try {
    // Nextcloud-Dateien laden
    const nextcloudPfad = `/Koch-Aufforstung/Kunden/${kundeId}`
    const nextcloudDateien = await dateiListeAbrufen(nextcloudPfad)

    // Datenbank-Dokumente laden
    const dbDokumente = await prisma.dokument.findMany({
      where: {
        ...(auftragId ? { auftragId } : {}),
        nextcloudPath: { startsWith: nextcloudPfad },
      },
      orderBy: { createdAt: "desc" },
    })

    // Kombinieren: Nextcloud-Dateien mit DB-Daten anreichern
    const dateien = nextcloudDateien.filter((d) => !d.istOrdner).map((datei) => {
      const dbEintrag = dbDokumente.find((d) => d.nextcloudPath === datei.pfad)
      return {
        name: datei.name,
        pfad: datei.pfad,
        groesse: datei.groesse,
        geaendertAm: datei.geaendertAm,
        contentType: datei.contentType,
        // DB-Daten (falls vorhanden)
        id: dbEintrag?.id ?? null,
        typ: dbEintrag?.typ ?? "sonstiges",
        hochgeladenVon: dbEintrag?.hochgeladenVon ?? null,
        createdAt: dbEintrag?.createdAt ?? null,
      }
    })

    return NextResponse.json({
      kundeId,
      pfad: nextcloudPfad,
      dateien,
      anzahl: dateien.length,
    })
  } catch (err) {
    console.error("[Kundenportal Dokumente] Fehler:", err)
    return NextResponse.json({ error: "Fehler beim Laden der Dokumente" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const url = new URL(req.url)
  const pfad = url.searchParams.get("pfad")
  const dokumentId = url.searchParams.get("id")

  if (!pfad) {
    return NextResponse.json({ error: "pfad fehlt" }, { status: 400 })
  }

  // Sicherheitscheck: Nur Dateien im Kunden-Verzeichnis löschen
  if (!pfad.startsWith("/Koch-Aufforstung/Kunden/")) {
    return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 })
  }

  try {
    // Nextcloud-Datei löschen
    const geloescht = await dateiLoeschen(pfad)

    // DB-Eintrag löschen (falls vorhanden)
    if (dokumentId) {
      await prisma.dokument.delete({ where: { id: dokumentId } }).catch(() => {})
    }

    if (!geloescht) {
      return NextResponse.json({ error: "Datei konnte nicht gelöscht werden" }, { status: 500 })
    }

    return NextResponse.json({ erfolg: true, pfad })
  } catch (err) {
    console.error("[Kundenportal Delete] Fehler:", err)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
