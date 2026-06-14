/**
 * A8 Rechnungs-Agent — Engine: Rechnungsentwurf aus Auftrag/A1-Angebot/A2-Material (REC-003)
 *
 * Deterministisch (kein LLM → keine Kosten, NEVER #22).
 * Extrahiert Positionen aus:
 *  1. Letztem Angebot (AngebotsPosition) → typ=leistung, mwstSatz aus Angebot
 *  2. MaterialBedarf (MaterialPosition)  → typ=material, 19 %
 * Fallback: Auftrag-Eckdaten, wenn kein Angebot vorhanden.
 *
 * Output ist Zod-validiert (EngineExtraktSchema, NEVER #23).
 */
import { prisma } from "@/lib/prisma"
import {
  EngineExtraktSchema,
  type EngineExtrakt,
  type ExtraktPosition,
} from "./zod-schemas"
import { bestimmeMwstSatz, berechneSummen, runde2 } from "./mwst-logik"
import { getFirmenStammdaten } from "./config"

/** PreisbuchEinheit-Enum → lesbare Einheit fürs PDF. */
function einheitLabel(e: string): string {
  const map: Record<string, string> = {
    ha: "ha",
    stueck: "Stk",
    lm: "lfm",
    m2: "m²",
    stunde: "Std",
    pauschale: "pauschal",
    kg: "kg",
  }
  return map[e] ?? e
}

export interface EngineErgebnis {
  ok: boolean
  fehlerText?: string
  extrakt?: EngineExtrakt
}

/**
 * Baut den (validierten) Rechnungs-Extrakt für einen Auftrag.
 * Reine Lese-Operation; persistiert nichts.
 */
export async function baueExtraktAusAuftrag(auftragId: string): Promise<EngineErgebnis> {
  const auftrag = await prisma.auftrag.findUnique({
    where: { id: auftragId },
    select: {
      id: true,
      titel: true,
      waldbesitzer: true,
      waldbesitzerEmail: true,
      zeitraum: true,
      startDatum: true,
      endDatum: true,
      flaeche_ha: true,
      angebote: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          gesamtpreis: true,
          mwstSatz: true,
          waldbesitzerName: true,
          waldbesitzerEmail: true,
          positionen: {
            orderBy: { reihenfolge: "asc" },
            select: {
              id: true,
              bezeichnung: true,
              menge: true,
              einheit: true,
              einzelpreis: true,
              gesamtpreis: true,
              mwstSatz: true,
            },
          },
        },
      },
      materialBedarfe: {
        orderBy: { erstelltAm: "desc" },
        select: {
          positionen: {
            orderBy: { reihenfolge: "asc" },
            select: {
              id: true,
              bezeichnung: true,
              menge: true,
              einheit: true,
              einzelpreis: true,
              gesamtpreis: true,
            },
          },
        },
      },
    },
  })

  if (!auftrag) {
    return { ok: false, fehlerText: "Auftrag nicht gefunden" }
  }

  const firma = getFirmenStammdaten()
  const kuOpts = { kleinunternehmer: firma.kleinunternehmer }
  const positionen: ExtraktPosition[] = []
  const hinweise: string[] = []

  const angebot = auftrag.angebote[0]

  // 1. Leistungspositionen aus Angebot
  if (angebot && angebot.positionen.length > 0) {
    for (const p of angebot.positionen) {
      // mwstSatz aus Angebot übernehmen, sofern gültig (0/7/19); sonst Default
      const satzRaw = p.mwstSatz
      const satz: 0 | 7 | 19 =
        kuOpts.kleinunternehmer ? 0 : satzRaw === 7 ? 7 : satzRaw === 0 ? 0 : 19
      const einzelpreis = runde2(p.einzelpreis)
      const gesamt = runde2(p.gesamtpreis ?? p.menge * einzelpreis)
      positionen.push({
        beschreibung: p.bezeichnung,
        menge: p.menge,
        einheit: einheitLabel(p.einheit),
        einzelpreis,
        gesamt,
        mwstSatz: satz,
        typ: "leistung",
        auftragPositionId: null,
        angebotPositionId: p.id,
        herkunft: "angebot",
      })
    }
  }

  // 2. Materialpositionen aus MaterialBedarf
  for (const mb of auftrag.materialBedarfe) {
    for (const mp of mb.positionen) {
      const einzelpreis = runde2(mp.einzelpreis ?? 0)
      const gesamt = runde2(mp.gesamtpreis ?? mp.menge * einzelpreis)
      if (gesamt <= 0) continue
      positionen.push({
        beschreibung: mp.bezeichnung,
        menge: mp.menge,
        einheit: einheitLabel(mp.einheit),
        einzelpreis,
        gesamt,
        mwstSatz: bestimmeMwstSatz("material", kuOpts),
        typ: "material",
        auftragPositionId: null,
        angebotPositionId: null,
        herkunft: "material",
      })
    }
  }

  // 3. Fallback: kein Angebot/Material → Pauschalposition aus Auftrag
  if (positionen.length === 0) {
    if (!angebot?.gesamtpreis) {
      return {
        ok: false,
        fehlerText:
          "Keine abrechenbaren Positionen gefunden (kein Angebot mit Positionen, kein Material, kein Gesamtpreis).",
      }
    }
    const netto = runde2(angebot.gesamtpreis)
    positionen.push({
      beschreibung: auftrag.titel || "Forstdienstleistung",
      menge: 1,
      einheit: "pauschal",
      einzelpreis: netto,
      gesamt: netto,
      mwstSatz: bestimmeMwstSatz("leistung", kuOpts),
      typ: "leistung",
      auftragPositionId: null,
      angebotPositionId: null,
      herkunft: "auftrag",
    })
    hinweise.push("Pauschalabrechnung aus Angebots-Gesamtpreis (keine Einzelpositionen vorhanden).")
  }

  // Preisabweichung Angebot↔extrahierte Summe (F97)
  const summen = berechneSummen(positionen)
  if (angebot?.gesamtpreis) {
    const diff = runde2(Math.abs(summen.nettoGesamt - runde2(angebot.gesamtpreis)))
    if (diff > 0.01) {
      hinweise.push(
        `Preisabweichung zum Angebot: Netto ${summen.nettoGesamt.toFixed(2)} € vs. Angebot ${runde2(
          angebot.gesamtpreis
        ).toFixed(2)} € (Δ ${diff.toFixed(2)} €).`
      )
    }
  }

  if (firma.kleinunternehmer) {
    hinweise.push("Kleinunternehmer gem. §19 UStG — kein Ausweis von Umsatzsteuer.")
  }

  const leistungszeitraum =
    auftrag.zeitraum ||
    (auftrag.startDatum && auftrag.endDatum
      ? `${auftrag.startDatum.toLocaleDateString("de-DE")} – ${auftrag.endDatum.toLocaleDateString("de-DE")}`
      : null)

  const extraktRaw = {
    quelleTyp: angebot ? ("angebot" as const) : ("auftrag" as const),
    auftragId: auftrag.id,
    angebotId: angebot?.id ?? null,
    waldbesitzerName: auftrag.waldbesitzer ?? angebot?.waldbesitzerName ?? null,
    waldbesitzerEmail: auftrag.waldbesitzerEmail ?? angebot?.waldbesitzerEmail ?? null,
    leistungszeitraum,
    positionen,
    nettoGesamt: summen.nettoGesamt,
    mwstGesamt: summen.mwstGesamt,
    bruttoGesamt: summen.bruttoGesamt,
    hinweise,
  }

  const parsed = EngineExtraktSchema.safeParse(extraktRaw)
  if (!parsed.success) {
    return {
      ok: false,
      fehlerText: `Engine-Validierung fehlgeschlagen: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    }
  }

  return { ok: true, extrakt: parsed.data }
}
