/**
 * A1 — Preisbuch-Query (ANG-014)
 * Deterministischer Lookup (KEIN LLM). Lädt aktive, zeitlich gültige
 * Preisbuch-Einträge, globale Aufschläge und aktive Templates.
 */
import { prisma } from "@/lib/prisma"
import type { PreisbuchEintrag, PreisbuchAufschlag, KalkulationsTemplate, PreisbuchKategorie } from "@prisma/client"
import { safeParseJson, TemplatePositionenSchema, TemplateBerechnungsLogikSchema, type TemplatePosition } from "@/lib/angebote/zod-schemas"

export interface PreisbuchKontext {
  kategorien: PreisbuchKategorie[]
  eintraege: (PreisbuchEintrag & { kategorie: PreisbuchKategorie })[]
  aufschlaege: PreisbuchAufschlag[]
  templates: KalkulationsTemplate[]
}

/** Lädt den vollständigen Preisbuch-Kontext für die Kalkulation. */
export async function ladePreisbuchKontext(): Promise<PreisbuchKontext> {
  const jetzt = new Date()
  const [kategorien, eintraege, aufschlaege, templates] = await Promise.all([
    prisma.preisbuchKategorie.findMany({ where: { aktiv: true } }),
    prisma.preisbuchEintrag.findMany({
      where: {
        aktiv: true,
        AND: [
          { OR: [{ gueltigVon: null }, { gueltigVon: { lte: jetzt } }] },
          { OR: [{ gueltigBis: null }, { gueltigBis: { gte: jetzt } }] },
        ],
      },
      include: { kategorie: true },
    }),
    prisma.preisbuchAufschlag.findMany({ where: { aktiv: true } }),
    prisma.kalkulationsTemplate.findMany({ where: { aktiv: true }, orderBy: { reihenfolge: "asc" } }),
  ])
  return { kategorien, eintraege, aufschlaege, templates }
}

/** Findet ein Template anhand des Leistungstyps (oder null). */
export function findeTemplate(kontext: PreisbuchKontext, leistungsTyp: string): KalkulationsTemplate | null {
  return kontext.templates.find((t) => t.leistungsTyp === leistungsTyp) ?? null
}

/** Liest die (Zod-validierten) Positionen eines Templates. */
export function templatePositionen(template: KalkulationsTemplate): TemplatePosition[] {
  return safeParseJson(TemplatePositionenSchema, template.positionenJson, [])
}

/** Liest die Berechnungslogik eines Templates. */
export function templateLogik(template: KalkulationsTemplate): { formeln?: Record<string, string> } {
  return safeParseJson(TemplateBerechnungsLogikSchema, template.berechnungsLogikJson, {})
}

/** Sucht einen Preisbuch-Eintrag nach Kategorie-Name + Bezeichnung. */
export function findeEintrag(
  kontext: PreisbuchKontext,
  kategorieName: string,
  bezeichnung?: string
): (PreisbuchEintrag & { kategorie: PreisbuchKategorie }) | null {
  const inKat = kontext.eintraege.filter((e) => e.kategorie.name === kategorieName)
  if (bezeichnung) {
    const exact = inKat.find((e) => e.bezeichnung === bezeichnung)
    if (exact) return exact
  }
  return inKat[0] ?? null
}
