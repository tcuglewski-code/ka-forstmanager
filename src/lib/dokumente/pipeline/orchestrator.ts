/**
 * DOK-006: Verarbeitungs-Pipeline-Orchestrator.
 *
 * Verarbeitet einen DokumentenScan (status=AUSSTEHEND):
 *   1. Original laden (Storage)
 *   2. Parse: XML → XRechnung-Parser (deterministisch) | PDF/Bild → OCR-Adapter
 *   3. Artikel-Matching je Position (DOK-012-014)
 *   4. Bestellabgleich (DOK-015/016) inkl. ohne-Bestellung (DOK-057)
 *   5. Doppelbuchungs-Check (DOK-008)
 *   6. Konfidenz-Routing (DOK-007) — Fail-Closed
 *   7. Kill-Switch (NEVER #21): Auto-Buchung nur wenn
 *      SystemConfig dok_ki_auto_buchung_aktiv === "true" (Default: Shadow-Mode)
 *
 * Ergebnis: Scan landet in REVIEW_ERFORDERLICH oder (künftig) GEBUCHT;
 * Fehler → FEHLER (max 3 Versuche via Process-Route).
 */
import { readFile } from "fs/promises"
import { prisma } from "@/lib/prisma"
import type { DokumentenScan, MatchStatus, Prisma } from "@prisma/client"
import { parseXRechnung, type ExtrahiertesRechnungsDokument } from "../parser/xrechnung"
import { getOcrAdapter, type OcrExtraktion } from "../ocr/ocr-adapter"
import { matchArtikel } from "../matching/artikel-matcher"
import { gleicheAbBestellung, findeReferenzBeleg } from "../matching/bestell-abgleich"
import { isDoppelbuchung } from "../doppelbuchung"
import { routeDocument, DEFAULT_ROUTING_CONFIG, type RoutingConfig } from "../konfidenz-routing"

export interface PipelineErgebnis {
  scanId: string
  status: "REVIEW_ERFORDERLICH" | "GEBUCHT" | "FEHLER"
  routingGrund: string
  kostenEur: number
}

interface KanonischePosition {
  artikelBezeichnung: string
  lieferantArtikelNr: string | null
  menge: number
  einheit: string
  einzelpreis: number
  gesamtpreis: number
  mwstSatz: number
  konfidenz: number
  artikelId: string | null
  matchStatus: MatchStatus
  matchBegruendung: string
}

interface KanonischesExtrakt {
  rechnungsNr: string | null
  datum: string | null
  lieferantName: string | null
  lieferantUstId: string | null
  gesamtBetrag: number | null
  nettoBetrag: number | null
  waehrung: string
  mwstHinweise: string[]
  feldKonfidenzen: Record<string, number>
}

async function ladeOriginal(url: string): Promise<Buffer> {
  if (url.startsWith("file://")) {
    return readFile(url.replace("file://", ""))
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Original nicht ladbar: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function ausXRechnung(doc: ExtrahiertesRechnungsDokument): {
  extrakt: KanonischesExtrakt
  positionen: Omit<KanonischePosition, "artikelId" | "matchStatus" | "matchBegruendung">[]
} {
  return {
    extrakt: {
      rechnungsNr: doc.rechnungsNr,
      datum: doc.datum,
      lieferantName: doc.lieferantName,
      lieferantUstId: doc.lieferantUstId,
      gesamtBetrag: doc.gesamtBetrag,
      nettoBetrag: doc.nettoBetrag,
      waehrung: doc.waehrung,
      mwstHinweise: doc.mwstHinweise,
      feldKonfidenzen: {
        rechnungsNr: 1,
        datum: doc.datum ? 1 : 0.5,
        lieferantName: 1,
        gesamtBetrag: 1,
        // USt-Validierungs-Fehler drücken die Konfidenz → Review
        mwst: doc.mwstGueltig ? 1 : 0.5,
      },
    },
    positionen: doc.positionen,
  }
}

function ausOcr(ocr: OcrExtraktion): {
  extrakt: KanonischesExtrakt
  positionen: Omit<KanonischePosition, "artikelId" | "matchStatus" | "matchBegruendung">[]
} {
  const feldKonfidenzen: Record<string, number> = {}
  for (const [key, feld] of Object.entries(ocr.felder)) feldKonfidenzen[key] = feld.konfidenz
  const wert = (key: string): string | null => ocr.felder[key]?.wert ?? null
  const zahl = (key: string): number | null => {
    const w = wert(key)
    if (w === null) return null
    const n = Number(w.replace(",", "."))
    return Number.isFinite(n) ? n : null
  }
  return {
    extrakt: {
      rechnungsNr: wert("rechnungsNr"),
      datum: wert("datum"),
      lieferantName: wert("lieferantName"),
      lieferantUstId: wert("lieferantUstId"),
      gesamtBetrag: zahl("gesamtBetrag"),
      nettoBetrag: zahl("nettoBetrag"),
      waehrung: wert("waehrung") ?? "EUR",
      mwstHinweise: [],
      feldKonfidenzen,
    },
    positionen: ocr.positionen,
  }
}

async function ladeRoutingConfig(): Promise<RoutingConfig> {
  const keys = ["dok_ki_threshold_high", "dok_ki_threshold_low", "dok_ki_vier_augen_betrag"]
  const rows = await prisma.systemConfig.findMany({ where: { key: { in: keys } } })
  const map = new Map<string, number>(
    rows.map((r: { key: string; value: string }) => [r.key, Number(r.value)])
  )
  const val = (key: string, fallback: number): number => {
    const v = map.get(key)
    return v !== undefined && Number.isFinite(v) ? v : fallback
  }
  return {
    schwelleHigh: val("dok_ki_threshold_high", DEFAULT_ROUTING_CONFIG.schwelleHigh),
    schwelleLow: val("dok_ki_threshold_low", DEFAULT_ROUTING_CONFIG.schwelleLow),
    vierAugenBetrag: val("dok_ki_vier_augen_betrag", DEFAULT_ROUTING_CONFIG.vierAugenBetrag),
  }
}

/** NEVER #21: Kill-Switch — Default false (Shadow-Mode). */
export async function istAutoBuchungAktiv(): Promise<boolean> {
  const row = await prisma.systemConfig.findUnique({ where: { key: "dok_ki_auto_buchung_aktiv" } })
  return row?.value === "true"
}

export async function verarbeiteScan(scan: DokumentenScan): Promise<PipelineErgebnis> {
  const start = Date.now()
  const buffer = await ladeOriginal(scan.originalDateiUrl)
  let kostenEur = 0

  // --- Parse ---
  let daten: ReturnType<typeof ausXRechnung>
  let rohExtraktion: Prisma.InputJsonValue
  const head = buffer.toString("utf8", 0, Math.min(200, buffer.length))
  const istXml = head.includes("<?xml") || scan.originalDateiName.toLowerCase().endsWith(".xml")

  if (istXml) {
    const doc = parseXRechnung(buffer)
    daten = ausXRechnung(doc)
    rohExtraktion = JSON.parse(JSON.stringify(doc))
  } else {
    const ocr = await getOcrAdapter().extractFromDocument(
      buffer,
      scan.originalDateiName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      scan.typ
    )
    daten = ausOcr(ocr)
    rohExtraktion = JSON.parse(JSON.stringify(ocr))
    kostenEur += ocr.kostenEur
  }

  // --- Artikel-Matching ---
  const positionen: KanonischePosition[] = []
  for (const pos of daten.positionen) {
    const match = await matchArtikel(pos.artikelBezeichnung, pos.lieferantArtikelNr)
    kostenEur += match.kostenEur
    positionen.push({
      ...pos,
      artikelId: match.artikelId,
      matchStatus: match.status,
      matchBegruendung: match.begruendung,
    })
  }

  // --- Lieferanten-Match (Name, exakt/insensitive) ---
  let lieferantId: string | null = scan.lieferantId
  if (!lieferantId && daten.extrakt.lieferantName) {
    const lieferant = await prisma.lieferant.findFirst({
      where: { name: { equals: daten.extrakt.lieferantName, mode: "insensitive" } },
      select: { id: true },
    })
    lieferantId = lieferant?.id ?? null
  }

  // --- Bestellabgleich (DOK-015/016/057) ---
  const abgleich = await gleicheAbBestellung(
    lieferantId,
    positionen.map((p) => ({ artikelId: p.artikelId, menge: p.menge }))
  )

  // --- Gutschrift-Referenz (DOK-058) ---
  let referenzBelegId: string | null = null
  if (scan.typ === "GUTSCHRIFT") {
    referenzBelegId = await findeReferenzBeleg(lieferantId, daten.extrakt.rechnungsNr)
  }

  // --- Doppelbuchung (DOK-008) ---
  const doppelt = daten.extrakt.rechnungsNr
    ? await isDoppelbuchung(daten.extrakt.rechnungsNr, lieferantId)
    : false

  // --- Routing (DOK-007, Fail-Closed) ---
  const config = await ladeRoutingConfig()
  const feldKonfidenzen = [
    ...Object.values(daten.extrakt.feldKonfidenzen),
    ...positionen.map((p) => p.konfidenz),
    // Unmatchte Positionen / fehlende Bestellung drücken die Konfidenz
    ...positionen.map((p) => (p.artikelId ? 1 : 0.5)),
  ]
  let routing = routeDocument(
    {
      typ: scan.typ,
      feldKonfidenzen,
      waehrung: daten.extrakt.waehrung,
      bruttoBetrag: daten.extrakt.gesamtBetrag ?? undefined,
      istDoppelbuchung: doppelt,
    },
    config
  )
  if (routing.action === "AUTO_BUCHEN" && abgleich.ohneBestellung) {
    routing = { action: "REVIEW", grund: abgleich.grund }
  }
  if (daten.extrakt.mwstHinweise.length > 0 && routing.action === "AUTO_BUCHEN") {
    routing = { action: "REVIEW", grund: daten.extrakt.mwstHinweise.join("; ") }
  }

  // --- Kill-Switch (NEVER #21) ---
  let zielStatus: PipelineErgebnis["status"] = "REVIEW_ERFORDERLICH"
  let routingGrund = routing.grund
  if (routing.action === "AUTO_BUCHEN") {
    const aktiv = await istAutoBuchungAktiv()
    const alleGemappt = positionen.length > 0 && positionen.every((p) => p.artikelId)
    if (aktiv && alleGemappt) {
      zielStatus = "GEBUCHT"
      routingGrund = "Auto-Buchung: Konfidenz über Schwelle, alle Positionen gemappt"
    } else if (aktiv) {
      zielStatus = "REVIEW_ERFORDERLICH"
      routingGrund = "Auto-Buchung qualifiziert, aber nicht alle Positionen einem Artikel zugeordnet"
    } else {
      zielStatus = "REVIEW_ERFORDERLICH"
      routingGrund = "Auto-Buchung qualifiziert, aber Kill-Switch inaktiv (Shadow-Mode)"
    }
  } else if (routing.action === "ABGELEHNT") {
    zielStatus = "REVIEW_ERFORDERLICH"
    routingGrund = `Sehr niedrige Konfidenz: ${routing.grund}`
  }

  const gesamtKonfidenz =
    feldKonfidenzen.length > 0 ? Math.min(...feldKonfidenzen) : 0

  // --- Persistenz (+ Auto-Buchung in derselben Transaktion, DOK-029) ---
  const buchungsOps =
    zielStatus === "GEBUCHT"
      ? positionen.flatMap((p) => [
          prisma.lagerArtikel.update({
            where: { id: p.artikelId! },
            data: { bestand: { increment: p.menge } },
          }),
          prisma.lagerBewegung.create({
            data: {
              artikelId: p.artikelId!,
              typ: "eingang",
              menge: p.menge,
              referenz: scan.id,
              notiz: `Dokumenten-KI Auto-Buchung: ${scan.originalDateiName} (${scan.typ})`,
            },
          }),
        ])
      : []

  await prisma.$transaction([
    ...buchungsOps,
    prisma.extrahiertePosition.deleteMany({ where: { scanId: scan.id } }),
    prisma.dokumentenScan.update({
      where: { id: scan.id },
      data: {
        status: zielStatus,
        rohExtraktion,
        extrahierteDaten: JSON.parse(
          JSON.stringify({ ...daten.extrakt, referenzBelegId, bestellAbgleich: abgleich })
        ),
        gesamtKonfidenz,
        routingGrund,
        lieferantId,
        bestellungId: abgleich.bestellungId,
        verarbeitungsKostenJson: { gesamtEur: kostenEur },
        verarbeitungsDauerMs: Date.now() - start,
        positionen: {
          create: positionen.map((p) => ({
            artikelBezeichnung: p.artikelBezeichnung,
            artikelNummer: null,
            lieferantArtikelNr: p.lieferantArtikelNr,
            mengeErwartet: p.menge,
            einheit: p.einheit,
            einzelpreis: p.einzelpreis,
            gesamtpreis: p.gesamtpreis,
            mwstSatz: p.mwstSatz,
            konfidenz: p.konfidenz,
            matchStatus: p.matchStatus,
            lagerArtikelId: p.artikelId,
          })),
        },
        auditLog: {
          createMany: {
            data: [
              {
                aktion: "OCR_ABGESCHLOSSEN" as const,
                systemAktion: true,
                details: {
                  routing: routing.action,
                  grund: routingGrund,
                  kostenEur,
                  positionen: positionen.length,
                },
              },
              ...(zielStatus === "GEBUCHT"
                ? [
                    {
                      aktion: "GEBUCHT" as const,
                      systemAktion: true,
                      details: { bewegungen: positionen.length, autoBuchung: true },
                    },
                  ]
                : []),
            ],
          },
        },
      },
    }),
  ])

  return { scanId: scan.id, status: zielStatus, routingGrund, kostenEur }
}
