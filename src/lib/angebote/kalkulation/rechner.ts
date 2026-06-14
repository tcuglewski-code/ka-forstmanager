/**
 * A1 — Kalkulations-Engine (ANG-015)
 * DETERMINISTISCH (KEIN LLM). Wandelt eine AnfrageSpezifikation + Preisbuch-
 * Kontext in eine Zod-validierte KalkulationsDetails um.
 *
 * Anti-Halluzination (REVIEW-STANDARD):
 *  - Jede Position referenziert eine reale preisbuchId (quelle="preisbuch").
 *  - Mengen, die nur geschätzt werden können (Stunden, kg), erzeugen eine
 *    Warnung + reduzierte Konfidenz und werden im GF-Review präzisiert.
 *  - Preis = basispreis × (1 + Σ Aufschläge) × Menge (rein multiplikativ).
 */
import type { PreisbuchAufschlag } from "@prisma/client"
import {
  AnfrageSpezifikation,
  KalkulationsDetails,
  KalkulationsDetailsSchema,
  KalkulationsPosition,
  PositionsAufschlag,
  AufschlagBedingungSchema,
  safeParseJson,
  type TemplatePosition,
} from "@/lib/angebote/zod-schemas"
import {
  findeEintrag,
  findeTemplate,
  templatePositionen,
  type PreisbuchKontext,
} from "@/lib/angebote/kalkulation/preisbuch-query"

/** Standard-Pflanzdichten je Leistungstyp (Stk/ha) — konservative Defaults. */
const PFLANZDICHTE: Record<string, number> = {
  erstaufforstung_laub: 2500,
  erstaufforstung_nadel: 2000,
  kombination: 2500,
}

function pflanzdichte(leistungsTyp: string): number {
  return PFLANZDICHTE[leistungsTyp] ?? 2500
}

/** Näherung des Zaun-Umfangs (lm) aus der Fläche (ha), Quadrat angenommen. */
function umfangAusFlaeche(flaecheHa: number): number {
  const seite = Math.sqrt(flaecheHa * 10_000) // m
  return Math.round(4 * seite)
}

/** Bestimmt aus den bekannten Formel-Keys die Menge (kein eval, Security). */
function mengeFuerFormel(
  formel: string,
  spez: AnfrageSpezifikation
): { menge: number; geschaetzt: boolean } {
  const flaeche = spez.flaeche ?? 0
  switch (formel) {
    case "1":
      return { menge: 1, geschaetzt: false }
    case "flaeche":
      return { menge: flaeche, geschaetzt: false }
    case "baumanzahl":
      return { menge: Math.round(flaeche * pflanzdichte(spez.leistungsTyp)), geschaetzt: false }
    case "zaunlaenge":
      return { menge: flaeche > 0 ? umfangAusFlaeche(flaeche) : 0, geschaetzt: false }
    case "stunden":
      // grobe Schätzung: 8h pro ha — muss im Review präzisiert werden
      return { menge: Math.max(8, Math.round(flaeche * 8)), geschaetzt: true }
    case "menge_kg":
      return { menge: Math.max(1, Math.round(flaeche * 2)), geschaetzt: true }
    default:
      return { menge: 0, geschaetzt: true }
  }
}

/** Monat (1-12) aus ISO-Datum oder null. */
function monatAus(datum: string | null): number | null {
  if (!datum) return null
  const d = new Date(datum)
  return Number.isNaN(d.getTime()) ? null : d.getMonth() + 1
}

/**
 * Ermittelt aus dem Kontext + Spezifikation die zutreffenden globalen
 * Aufschläge (eintragId=null). Subunternehmer wird positionsabhängig
 * separat behandelt.
 */
function ermittleGlobaleAufschlaege(
  spez: AnfrageSpezifikation,
  kontext: PreisbuchKontext
): { aufschlag: PreisbuchAufschlag; faktor: number }[] {
  const treffer: { aufschlag: PreisbuchAufschlag; faktor: number }[] = []
  const global = kontext.aufschlaege.filter((a) => a.aktiv && a.eintragId === null)
  const monat = monatAus(spez.zeitraum?.von ?? null)
  const winter = monat !== null && [11, 12, 1, 2].includes(monat)

  for (const a of global) {
    const bed = safeParseJson(AufschlagBedingungSchema, a.bedingung, {})
    let trifft = false
    switch (a.typ) {
      case "steilheit":
        trifft =
          spez.steilheit !== null &&
          spez.steilheit >= (bed.min ?? -Infinity) &&
          spez.steilheit < (bed.max ?? Infinity)
        break
      case "entfernung":
        trifft =
          spez.entfernungKm !== null &&
          spez.entfernungKm >= (bed.min ?? -Infinity) &&
          spez.entfernungKm < (bed.max ?? Infinity)
        break
      case "menge":
        trifft =
          spez.flaeche !== null &&
          spez.flaeche >= (bed.min ?? -Infinity) &&
          spez.flaeche < (bed.max ?? Infinity)
        break
      case "saison":
        trifft = bed.wert === "winter" && winter
        break
      case "bodenart":
        trifft = bed.wert != null && bed.wert === spez.bodenart
        break
      default:
        trifft = false
    }
    if (trifft) treffer.push({ aufschlag: a, faktor: a.faktor })
  }
  return treffer
}

export interface KalkulationsErgebnis {
  details: KalkulationsDetails
  templateName: string | null
}

/**
 * Hauptfunktion: berechnet ein deterministisches Angebot.
 * Gibt immer ein valides (Zod-geparstes) Ergebnis zurück — bei fehlendem
 * Template/Fläche mit Warnungen statt Crash.
 */
export function kalkuliereAngebot(
  spez: AnfrageSpezifikation,
  kontext: PreisbuchKontext
): KalkulationsErgebnis {
  const warnungen: string[] = []
  const template = findeTemplate(kontext, spez.leistungsTyp)

  if (!template) {
    warnungen.push(`Kein Kalkulations-Template für Leistungstyp "${spez.leistungsTyp}" gefunden.`)
    return {
      details: KalkulationsDetailsSchema.parse({
        positionen: [],
        gesamtNetto: 0,
        gesamtBrutto: 0,
        mwstBetrag: 0,
        aufschlaegeSumme: 0,
        konfidenz: 0,
        warnungen,
      }),
      templateName: null,
    }
  }

  if (spez.flaeche === null || spez.flaeche <= 0) {
    warnungen.push("Keine Fläche angegeben — Mengen können nicht berechnet werden.")
  }

  const positionsdefs: TemplatePosition[] = templatePositionen(template)
  const globaleAufschlaege = ermittleGlobaleAufschlaege(spez, kontext)
  const subunternehmer = kontext.aufschlaege.find(
    (a) => a.aktiv && a.eintragId === null && a.typ === "subunternehmer"
  )

  const positionen: KalkulationsPosition[] = []
  let gesamtNetto = 0
  let mwstBetrag = 0
  let aufschlaegeSumme = 0
  let konfidenzSumme = 0

  for (const def of positionsdefs) {
    // Verbissschutz/Zaun nur wenn angefragt
    if (def.kategorieName === "verbissschutz" && !spez.verbissschutz && def.optional) continue
    if (def.kategorieName === "zaunbau" && !spez.zaun && def.optional) continue

    const eintrag = findeEintrag(kontext, def.kategorieName, def.eintragName)
    if (!eintrag) {
      if (!def.optional) {
        warnungen.push(`Pflicht-Position "${def.eintragName ?? def.kategorieName}" nicht im Preisbuch gefunden.`)
      }
      continue
    }

    const { menge, geschaetzt } = mengeFuerFormel(def.mengenFormel, spez)
    if (menge <= 0) {
      if (!def.optional) {
        warnungen.push(`Menge für Pflicht-Position "${eintrag.bezeichnung}" ist 0.`)
      }
      continue
    }
    if (geschaetzt) {
      warnungen.push(`Menge für "${eintrag.bezeichnung}" (${menge} ${eintrag.einheit}) ist geschätzt — im Review prüfen.`)
    }

    const istFremdleistung =
      eintrag.lieferantTyp === "FREMDLEISTUNG" || def.kategorieName === "fremdleistung"

    // Aufschläge für diese Position zusammenstellen
    const posAufschlaege: PositionsAufschlag[] = []
    let faktorSumme = 0
    for (const g of globaleAufschlaege) {
      posAufschlaege.push({
        typ: g.aufschlag.typ,
        name: g.aufschlag.name,
        faktor: g.faktor,
        betrag: round2(eintrag.basispreis * g.faktor * menge),
      })
      faktorSumme += g.faktor
    }
    if (istFremdleistung && subunternehmer) {
      posAufschlaege.push({
        typ: subunternehmer.typ,
        name: subunternehmer.name,
        faktor: subunternehmer.faktor,
        betrag: round2(eintrag.basispreis * subunternehmer.faktor * menge),
      })
      faktorSumme += subunternehmer.faktor
    }

    const basisNetto = eintrag.basispreis * menge
    const gesamtpreis = round2(basisNetto * (1 + faktorSumme))
    const aufschlagAnteil = round2(basisNetto * faktorSumme)

    gesamtNetto += gesamtpreis
    mwstBetrag += round2(gesamtpreis * (eintrag.mwstSatz / 100))
    aufschlaegeSumme += aufschlagAnteil

    const konfidenz = geschaetzt ? 0.5 : 1
    konfidenzSumme += konfidenz

    positionen.push({
      bezeichnung: eintrag.bezeichnung,
      menge: round2(menge),
      einheit: eintrag.einheit,
      einzelpreis: eintrag.basispreis,
      aufschlaege: posAufschlaege,
      gesamtpreis,
      mwstSatz: eintrag.mwstSatz,
      preisbuchId: eintrag.id,
      quelle: "preisbuch",
      konfidenz,
    })
  }

  gesamtNetto = round2(gesamtNetto)
  mwstBetrag = round2(mwstBetrag)
  aufschlaegeSumme = round2(aufschlaegeSumme)
  const gesamtBrutto = round2(gesamtNetto + mwstBetrag)

  // Gesamt-Konfidenz: Mittel der Positions-Konfidenzen × Parser-Konfidenz
  const posKonfidenz = positionen.length > 0 ? konfidenzSumme / positionen.length : 0
  const konfidenz = round2(posKonfidenz * (spez.konfidenz ?? 0.5))

  if (positionen.length === 0) {
    warnungen.push("Keine kalkulierbaren Positionen ermittelt.")
  }

  return {
    details: KalkulationsDetailsSchema.parse({
      positionen,
      gesamtNetto,
      gesamtBrutto,
      mwstBetrag,
      aufschlaegeSumme,
      konfidenz,
      warnungen,
    }),
    templateName: template.name,
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
