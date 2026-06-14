/**
 * A2 — Reforest-Berechnungs-Engine (MAT-005).
 *
 * Rein deterministisch, KEIN LLM, KEIN DB-Zugriff (unit-testbar, NEVER #23/#24).
 * Alle Schwellen (Puffer, Pfahlabstand) werden als Parameter übergeben, damit
 * Formeln in Unit-Tests fixiert bleiben und Config nicht hartkodiert verstreut.
 */

export interface Pflanzverband {
  x: number
  y: number
}

export type VerbissschutzTyp = "wuchshuelle" | "spirale" | "einzelschutz"

/**
 * Parst einen Pflanzverband-String ("2x1m", "1,5×1,5", "1 x 1") → {x, y}.
 * Fallback bei unlesbarem Input: 2×1 m (Reforest-Standard).
 */
export function parsePflanzverband(input: string | null | undefined): Pflanzverband {
  const FALLBACK: Pflanzverband = { x: 2, y: 1 }
  if (!input || typeof input !== "string") return FALLBACK
  const norm = input.toLowerCase().replace(/,/g, ".").replace(/[×*]/g, "x").replace(/\s+/g, "")
  const m = norm.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/)
  if (!m) return FALLBACK
  const x = parseFloat(m[1])
  const y = parseFloat(m[2])
  if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) return FALLBACK
  return { x, y }
}

/** Pflanzenzahl = ceil(ha × 10000 / (x × y)). Kein Untermaß (immer aufrunden). */
export function berechnePflanzenzahl(flaecheHa: number, verbandX: number, verbandY: number): number {
  if (!(flaecheHa > 0) || !(verbandX > 0) || !(verbandY > 0)) return 0
  return Math.ceil((flaecheHa * 10000) / (verbandX * verbandY))
}

/**
 * Verbissschutz 1:1 zur Pflanzenzahl + Puffer (Default 5 %) für Ausfall/Nachlieferung.
 * Gilt für Wuchshülle, Spirale, Einzelschutz gleichermaßen.
 */
export function berechneVerbissschutz(
  pflanzenzahl: number,
  _typ: VerbissschutzTyp = "wuchshuelle",
  pufferProzent = 5
): number {
  if (!(pflanzenzahl > 0)) return 0
  return Math.ceil(pflanzenzahl * (1 + pufferProzent / 100))
}

/**
 * Zaunlänge (Umfang) aus Fläche, Annahme Rechteck mit Seitenverhältnis v.
 * A = ha × 10000 [m²]; b = √(A×v); h = √(A/v); Umfang = 2×(b+h).
 */
export function berechneZaunlaenge(flaecheHa: number, verhaeltnis = 1.5): number {
  if (!(flaecheHa > 0) || !(verhaeltnis > 0)) return 0
  const a = flaecheHa * 10000
  const b = Math.sqrt(a * verhaeltnis)
  const h = Math.sqrt(a / verhaeltnis)
  return Math.round(2 * (b + h))
}

/** Pfahlanzahl = ceil(zaunlaenge / abstand) + 1 (Eck-/Endpfahl). */
export function berechnePfahlanzahl(zaunlaenge: number, abstandM = 3): number {
  if (!(zaunlaenge > 0) || !(abstandM > 0)) return 0
  return Math.ceil(zaunlaenge / abstandM) + 1
}

/** Saatgut-Lookup kg/ha je Baumart (Reforest-Richtwerte). */
const SAATGUT_KG_PRO_HA: Record<string, number> = {
  eiche: 25,
  buche: 80,
  fichte: 3,
  kiefer: 1,
  douglasie: 2,
  erle: 8,
  birke: 1,
  ahorn: 5,
  esche: 6,
  laerche: 4,
  lärche: 4,
}

export interface SaatgutErgebnis {
  mengeKg: number
  anmerkung: string
  bekannt: boolean
}

/**
 * Saatgutmenge in kg für eine Baumart auf gegebener Fläche.
 * Unbekannte Baumart → mengeKg 0 + bekannt=false (triggert LLM-Fallback).
 */
export function berechneSaatgut(flaecheHa: number, baumart: string): SaatgutErgebnis {
  if (!(flaecheHa > 0)) {
    return { mengeKg: 0, anmerkung: "Fläche 0 oder ungültig", bekannt: false }
  }
  const key = (baumart || "").trim().toLowerCase().split(/\s+/)[0]
  const proHa = SAATGUT_KG_PRO_HA[key]
  if (proHa === undefined) {
    return { mengeKg: 0, anmerkung: `Saatgut-Richtwert für "${baumart}" unbekannt — bitte prüfen`, bekannt: false }
  }
  return {
    mengeKg: Math.ceil(proHa * flaecheHa * 100) / 100, // 2 Nachkommastellen
    anmerkung: `${proHa} kg/ha × ${flaecheHa} ha`,
    bekannt: true,
  }
}
