// GET /api/auftraege/[id]/export?format=gpx|kml
// Exportiert GPS-Koordinaten eines Auftrags als GPX oder KML-Datei

import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const format = new URL(req.url).searchParams.get("format") ?? "gpx"

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: { protokolle: true },
  })

  // Auftrag nicht gefunden
  if (!auftrag) {
    return new Response("Auftrag nicht gefunden", { status: 404 })
  }

  // Keine GPS-Daten vorhanden
  if (auftrag.lat == null || auftrag.lng == null) {
    const hinweis = `Für diesen Auftrag sind keine GPS-Daten vorhanden.\nAuftrag: ${auftrag.titel} (${auftrag.nummer ?? auftrag.id})`
    return new Response(hinweis, { status: 404 })
  }

  const dateiname = `auftrag-${auftrag.nummer ?? auftrag.id}`
  const titelEsc = escapeXml(auftrag.titel)
  const beschreibungEsc = escapeXml(
    [auftrag.waldbesitzer, auftrag.standort].filter(Boolean).join(" | ")
  )

  // ── GPX-Export ─────────────────────────────────────────────────────
  if (format === "gpx") {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="ForstManager Koch Aufforstung" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${titelEsc}</name>
    <desc>${beschreibungEsc}</desc>
  </metadata>
  <wpt lat="${auftrag.lat}" lon="${auftrag.lng}">
    <name>${titelEsc}</name>
    <desc>${escapeXml(auftrag.standort ?? "")}</desc>${auftrag.plusCode ? `\n    <cmt>Plus Code: ${escapeXml(auftrag.plusCode)}</cmt>` : ""}
  </wpt>
</gpx>`

    return new Response(gpx, {
      headers: {
        "Content-Type": "application/gpx+xml; charset=UTF-8",
        "Content-Disposition": `attachment; filename="${dateiname}.gpx"`,
      },
    })
  }

  // ── KML-Export ─────────────────────────────────────────────────────
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${titelEsc}</name>
    <description>${beschreibungEsc}</description>
    <Placemark>
      <name>${titelEsc}</name>
      <description>${beschreibungEsc}</description>
      <Point>
        <coordinates>${auftrag.lng},${auftrag.lat},0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`

  return new Response(kml, {
    headers: {
      "Content-Type": "application/vnd.google-earth.kml+xml; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${dateiname}.kml"`,
    },
  })
}

// ── Hilfsfunktion: XML-Sonderzeichen escapen ──────────────────────────────
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
