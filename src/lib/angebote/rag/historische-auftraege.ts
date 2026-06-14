/**
 * A1 — RAG: Historische Vergleichsaufträge (ANG-018)
 * DETERMINISTISCH (KEIN LLM). Findet ähnliche abgeschlossene Aufträge anhand
 * von Leistungstyp, Region/Bundesland und Fläche und liefert deren reale
 * Ist-Kosten (aus Rechnungen) als Plausibilitäts-Anker für die Kalkulation.
 */
import { prisma } from "@/lib/prisma"
import {
  VergleichsAuftraegeSchema,
  type AnfrageSpezifikation,
  type VergleichsAuftrag,
} from "@/lib/angebote/zod-schemas"

const TYP_MAPPING: Record<string, string[]> = {
  erstaufforstung_laub: ["aufforstung", "erstaufforstung", "pflanzung"],
  erstaufforstung_nadel: ["aufforstung", "erstaufforstung", "pflanzung"],
  kulturpflege: ["pflege", "kulturpflege", "freistellen"],
  saatgut: ["saatgut"],
  kombination: ["aufforstung", "pflanzung", "kombination"],
}

/** Einfaches Ähnlichkeits-Scoring (0..1). */
function score(
  spez: AnfrageSpezifikation,
  a: { typ: string; flaeche_ha: number | null; bundesland: string | null; standort: string | null }
): number {
  let s = 0
  const typen = TYP_MAPPING[spez.leistungsTyp] ?? []
  if (typen.some((t) => a.typ?.toLowerCase().includes(t))) s += 0.4
  if (spez.bundesland && a.bundesland && a.bundesland.toLowerCase() === spez.bundesland.toLowerCase()) s += 0.2
  if (
    spez.region &&
    a.standort &&
    a.standort.toLowerCase().includes(spez.region.toLowerCase())
  )
    s += 0.2
  if (spez.flaeche !== null && a.flaeche_ha) {
    const diff = Math.abs(a.flaeche_ha - spez.flaeche) / Math.max(spez.flaeche, a.flaeche_ha)
    if (diff < 0.5) s += 0.2 * (1 - diff)
  }
  return s
}

/**
 * Findet bis zu `limit` ähnliche Aufträge mit realen Ist-Kosten.
 * Wirft nie — gibt bei Fehler ein leeres, valides Array zurück.
 */
export async function findeAehnlicheAuftraege(
  spez: AnfrageSpezifikation,
  limit = 3
): Promise<VergleichsAuftrag[]> {
  try {
    // Kandidaten mit Rechnungen laden (nur abgeschlossene mit Ist-Kosten)
    const auftraege = await prisma.auftrag.findMany({
      where: {
        deletedAt: null,
        rechnungen: { some: { deletedAt: null } },
      },
      select: {
        nummer: true,
        titel: true,
        typ: true,
        flaeche_ha: true,
        bundesland: true,
        standort: true,
        rechnungen: {
          where: { deletedAt: null },
          select: { betrag: true, bruttoBetrag: true, nettoBetrag: true },
        },
      },
      take: 200,
    })

    const bewertet = auftraege
      .map((a) => {
        const istKosten = a.rechnungen.reduce(
          (sum, r) => sum + (r.bruttoBetrag ?? r.betrag ?? 0),
          0
        )
        return {
          a,
          score: score(spez, a),
          istKosten,
        }
      })
      .filter((x) => x.score > 0.3 && x.istKosten > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, limit)

    const ergebnis: VergleichsAuftrag[] = bewertet.map((x) => ({
      nummer: x.a.nummer ?? null,
      titel: x.a.titel,
      typ: x.a.typ,
      flaecheHa: x.a.flaeche_ha ?? null,
      region: x.a.standort ?? x.a.bundesland ?? null,
      istKosten: round2(x.istKosten),
      istKostenProHa: x.a.flaeche_ha && x.a.flaeche_ha > 0 ? round2(x.istKosten / x.a.flaeche_ha) : null,
    }))

    // Zod-Validierung (NEVER #23) — bei Bruch leeres Array
    const parsed = VergleichsAuftraegeSchema.safeParse(ergebnis)
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
