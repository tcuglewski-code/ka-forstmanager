/**
 * A1 — Varianten-Generator Gut/Besser/Best (ANG-017)
 * DETERMINISTISCH. Erzeugt drei Preis-Stufen durch Variation der optionalen
 * Schutz-Leistungen und ruft je Stufe die LLM-freie Kalkulations-Engine auf.
 *
 *  - gut    : Basis (Pflanzung + Pflege), kein Einzelschutz, kein Zaun
 *  - besser : + Verbissschutz (Einzelschutz)
 *  - best   : + Verbissschutz + Wildschutzzaun
 */
import type { AnfrageSpezifikation, KalkulationsDetails } from "@/lib/angebote/zod-schemas"
import { kalkuliereAngebot } from "@/lib/angebote/kalkulation/rechner"
import type { PreisbuchKontext } from "@/lib/angebote/kalkulation/preisbuch-query"

export type VariantenStufe = "gut" | "besser" | "best"

export interface VariantenErgebnis {
  stufe: VariantenStufe
  details: KalkulationsDetails
  templateName: string | null
}

const STUFEN: { stufe: VariantenStufe; verbissschutz: boolean; zaun: boolean }[] = [
  { stufe: "gut", verbissschutz: false, zaun: false },
  { stufe: "besser", verbissschutz: true, zaun: false },
  { stufe: "best", verbissschutz: true, zaun: true },
]

export function erzeugeVarianten(
  spez: AnfrageSpezifikation,
  kontext: PreisbuchKontext
): VariantenErgebnis[] {
  return STUFEN.map(({ stufe, verbissschutz, zaun }) => {
    const variantenSpez: AnfrageSpezifikation = { ...spez, verbissschutz, zaun }
    const { details, templateName } = kalkuliereAngebot(variantenSpez, kontext)
    return { stufe, details, templateName }
  })
}
