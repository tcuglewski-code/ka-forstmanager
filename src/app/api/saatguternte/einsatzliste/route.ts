import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const idsParam = req.nextUrl.searchParams.get("ids")
    if (!idsParam) {
      return NextResponse.json({ error: "Keine IDs angegeben" }, { status: 400 })
    }

    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ error: "Keine gültigen IDs" }, { status: 400 })
    }

    const flaechen = await prisma.registerFlaeche.findMany({
      where: { id: { in: ids } },
      include: {
        profil: {
          include: {
            ernten: {
              orderBy: { datum: "desc" },
              take: 1,
            },
          },
        },
        quelle: { select: { name: true, kuerzel: true } },
      },
    })

    // Maintain order from ids array
    const ordered = ids
      .map((id) => flaechen.find((f) => f.id === id))
      .filter(Boolean) as typeof flaechen

    const now = new Date()
    const datumStr = now.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    function fmt(d: Date | null | undefined): string {
      if (!d) return "–"
      return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    }

    const leerZeilen = Array(8)
      .fill(
        `<tr class="protokoll-row">
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>`
      )
      .join("\n")

    const flaechenHTML = ordered
      .map((f, idx) => {
        const koord =
          f.latDez != null && f.lonDez != null
            ? `${f.latDez.toFixed(5)}°N, ${f.lonDez.toFixed(5)}°O`
            : "–"

        const zulBis =
          f.zulassungBisText ??
          (f.zulassungBis
            ? f.zulassungBis.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "–")

        const hoehe =
          f.hoeheVon != null && f.hoeheBis != null
            ? `${f.hoeheVon} – ${f.hoeheBis} m`
            : f.hoeheVon != null
            ? `ab ${f.hoeheVon} m`
            : "–"

        const ansprechpartner = [f.ansprechpartner, f.ansprechpartnerTel, f.ansprechpartnerEmail]
          .filter(Boolean)
          .join(" | ") || "–"

        return `
        <div class="flaeche ${idx > 0 ? "page-break" : ""}">
          <div class="flaeche-header">
            <span class="flaeche-nr">Fläche ${idx + 1}</span>
            <h3>${f.registerNr} &mdash; ${f.baumart}</h3>
            <span class="badge ${f.zugelassen ? "badge-ok" : "badge-warn"}">${f.zugelassen ? "Zugelassen" : "Abgelaufen"}</span>
          </div>

          <table class="info-table">
            <tr><td class="label">Bundesland:</td><td>${f.bundesland}</td><td class="label">Forstamt:</td><td>${f.forstamt ?? "–"}</td></tr>
            <tr><td class="label">Revier:</td><td>${f.revier ?? "–"}</td><td class="label">Landkreis:</td><td>${f.landkreis ?? "–"}</td></tr>
            <tr><td class="label">Koordinaten:</td><td>${koord}</td><td class="label">Höhe:</td><td>${hoehe}</td></tr>
            <tr><td class="label">Fläche:</td><td>${f.flaecheHa != null ? f.flaecheHa.toFixed(2) + " ha" : "–"}</td><td class="label">Fläche red.:</td><td>${f.flaecheRedHa != null ? f.flaecheRedHa.toFixed(2) + " ha" : "–"}</td></tr>
            <tr><td class="label">Baumart wiss.:</td><td>${f.baumartWiss ?? "–"}</td><td class="label">Kategorie:</td><td>${f.kategorie ?? "–"}</td></tr>
            <tr><td class="label">Herkunftsgebiet:</td><td>${f.herkunftsgebiet ?? "–"}</td><td class="label">Ausgangsmaterial:</td><td>${f.ausgangsmaterial ?? "–"}</td></tr>
            <tr><td class="label">Ansprechpartner:</td><td colspan="3">${ansprechpartner}</td></tr>
            <tr><td class="label">Zulassung bis:</td><td>${zulBis}</td><td class="label">Quelle:</td><td>${f.quelle.name} (${f.quelle.kuerzel})</td></tr>
          </table>

          <h4>Ernteprotokoll</h4>
          <table class="protokoll-table">
            <thead>
              <tr>
                <th>Sammler</th>
                <th>Datum</th>
                <th>Menge (kg)</th>
                <th>Stunden</th>
                <th>Notizen</th>
              </tr>
            </thead>
            <tbody>
              ${leerZeilen}
            </tbody>
          </table>

          <div class="unterschrift">
            <div class="unterschrift-feld">
              Gruppenführer: ______________________________ &nbsp;&nbsp; Datum: ______________
            </div>
          </div>
        </div>`
      })
      .join("\n")

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Einsatzliste Saatguternte</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.4;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .doc-header {
      border-bottom: 3px solid #2d5016;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .doc-header .logo-block h1 {
      font-size: 18pt;
      color: #2d5016;
      font-weight: 700;
    }

    .doc-header .logo-block h2 {
      font-size: 12pt;
      color: #555;
      font-weight: 400;
      margin-top: 4px;
    }

    .doc-header .meta {
      text-align: right;
      font-size: 9pt;
      color: #666;
    }

    .print-btn {
      background: #2d5016;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12pt;
      margin-bottom: 20px;
      display: block;
    }

    .print-btn:hover { background: #3d6820; }

    .flaeche {
      border: 2px solid #2d5016;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      background: #fff;
    }

    .flaeche-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }

    .flaeche-nr {
      background: #2d5016;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 600;
    }

    .flaeche-header h3 {
      font-size: 14pt;
      color: #1a1a1a;
      font-weight: 700;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }

    .badge-ok { background: #d4edda; color: #155724; }
    .badge-warn { background: #f8d7da; color: #721c24; }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10pt;
    }

    .info-table td {
      padding: 4px 8px;
      border: 1px solid #ddd;
      vertical-align: top;
    }

    .info-table td.label {
      font-weight: 600;
      color: #444;
      background: #f5f5f5;
      width: 12%;
      white-space: nowrap;
    }

    h4 {
      font-size: 11pt;
      color: #2d5016;
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .protokoll-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }

    .protokoll-table th {
      background: #2d5016;
      color: white;
      padding: 6px 10px;
      text-align: left;
      font-size: 9pt;
    }

    .protokoll-table td {
      border: 1px solid #ccc;
      padding: 0;
      height: 28px;
    }

    .protokoll-row td {
      border: 1px solid #ccc;
    }

    .unterschrift {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px dashed #999;
    }

    .unterschrift-feld {
      font-size: 10pt;
      color: #444;
    }

    .page-break {
      page-break-before: always;
    }

    @page {
      size: A4;
      margin: 1.5cm;
    }

    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
      .container { padding: 0; }
      .flaeche { border: 2px solid #2d5016; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="doc-header">
      <div class="logo-block">
        <h1>🌲 Koch Aufforstung GmbH</h1>
        <h2>Einsatzliste Saatguternte</h2>
      </div>
      <div class="meta">
        <div>Erstellt: ${datumStr}</div>
        <div>Flächen: ${ordered.length}</div>
      </div>
    </div>

    <button class="print-btn no-print" onclick="window.print()">🖨️ Drucken / Als PDF speichern</button>

    ${flaechenHTML}
  </div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("GET /api/saatguternte/einsatzliste", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
