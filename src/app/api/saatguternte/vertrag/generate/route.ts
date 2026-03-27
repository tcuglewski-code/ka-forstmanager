// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { readFileSync } from "fs"
import { join } from "path"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      flaechenIds,       // string[] — IDs der RegisterFlaeche
      erntejahr,         // number z.B. 2026
      ernteKw,           // number z.B. 40
      entschaedigungKg,  // number z.B. 0.80
      ortVertragspartei, // string z.B. "Kassel"
      ortWaldbesitzer,   // string z.B. "Darmstadt"
      datum,             // string z.B. "27.03.2026"
    } = body

    if (!flaechenIds || !Array.isArray(flaechenIds) || flaechenIds.length === 0) {
      return NextResponse.json({ error: "Keine Flächen-IDs angegeben" }, { status: 400 })
    }

    // Flächen aus DB laden
    const flaechen = await prisma.registerFlaeche.findMany({
      where: { id: { in: flaechenIds } },
      orderBy: { forstamt: "asc" },
    })

    if (flaechen.length === 0) {
      return NextResponse.json({ error: "Keine Flächen gefunden" }, { status: 400 })
    }

    // Forstamt aus erster Fläche
    const forstamtName = flaechen[0].forstamt ?? "Unbekannt"

    // Tabellen-Daten für Template
    const FLAECHEN = flaechen.map((f) => ({
      REGISTER_NR: f.registerNr ?? "—",
      BAUMART: f.baumart ?? "—",
      REVIER: f.revier ?? f.forstamt ?? "—",
      ABTEILUNG: f.revier ?? "—",
      FLAECHE_HA: f.flaecheHa ? f.flaecheHa.toFixed(2) : "—",
      BEMERKUNGEN: f.sonderherkunft ? "SHK" : "",
    }))

    // Template laden
    const templatePath = join(
      process.cwd(),
      "public",
      "templates",
      "ernteüberlassungsvertrag-template.docx"
    )
    const content = readFileSync(templatePath, "binary")
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // Daten einsetzen
    doc.render({
      FORSTAMT_NAME: forstamtName,
      ERNTEJAHR: String(erntejahr ?? new Date().getFullYear()),
      ERNTE_KW: String(ernteKw ?? ""),
      ENTSCHAEDIGUNG_PRO_KG: typeof entschaedigungKg === "number"
        ? entschaedigungKg.toFixed(2)
        : String(entschaedigungKg ?? ""),
      VERTRAGSPARTEI_BLOCK: "Koch Aufforstung GmbH\nAn der Kirche 5\n34314 Espenau",
      ORT_VP: ortVertragspartei ?? "Espenau",
      ORT_WB: ortWaldbesitzer ?? "",
      DATUM: datum ?? new Date().toLocaleDateString("de-DE"),
      FLAECHEN,
    })

    const buffer = doc.getZip().generate({ type: "nodebuffer" })

    const filename = `Ernteüberlassungsvertrag_${forstamtName}_${erntejahr ?? ""}.docx`
      .replace(/\s+/g, "_")
      .replace(/[^\w.\-üäöÜÄÖß]/g, "_")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("Vertrag-Generate error:", error)
    return NextResponse.json(
      { error: error.message ?? "Generierungsfehler" },
      { status: 500 }
    )
  }
}
