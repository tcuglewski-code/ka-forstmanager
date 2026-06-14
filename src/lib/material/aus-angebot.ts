/**
 * A2 — A1-Integration (MAT-010).
 *
 * Liest ein A1-Angebot (anfrageSpezifikationJson + Positionen) und mappt es
 * auf eine MatInputSpezifikation. Alle JSON-Felder werden Zod-validiert (NEVER #23).
 */
import { prisma } from "@/lib/prisma"
import { AnfrageSpezifikationSchema } from "@/lib/angebote/zod-schemas"
import { safeParseJson as safeParseAngebotJson } from "@/lib/angebote/zod-schemas"
import {
  MatInputSpezifikationSchema,
  type MatInputSpezifikation,
  type MatLeistungsTyp,
} from "@/lib/material/zod-schemas"

/** A1-Leistungstyp → A2-Leistungstyp. */
function mapLeistungsTyp(a1: string): MatLeistungsTyp {
  switch (a1) {
    case "erstaufforstung_laub":
    case "erstaufforstung_nadel":
      return "pflanzung"
    case "saatgut":
      return "saat"
    case "kulturpflege":
      return "kulturpflege"
    case "kombination":
      return "kombination"
    default:
      return "unbekannt"
  }
}

/** Versucht aus den Angebots-Positionen einen Pflanzverband zu lesen (best effort). */
function pflanzverbandAusPositionen(bezeichnungen: string[]): string | null {
  for (const b of bezeichnungen) {
    const m = b.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*m?/i)
    if (m) return `${m[1]}x${m[2]}m`
  }
  return null
}

/**
 * Baut aus einem Angebot eine MatInputSpezifikation. Gibt null, wenn das
 * Angebot nicht existiert.
 */
export async function spezifikationAusAngebot(
  angebotId: string
): Promise<MatInputSpezifikation | null> {
  const angebot = await prisma.angebot.findUnique({
    where: { id: angebotId },
    include: { positionen: { select: { bezeichnung: true } } },
  })
  if (!angebot) return null

  const spez = safeParseAngebotJson(
    AnfrageSpezifikationSchema,
    angebot.anfrageSpezifikationJson,
    AnfrageSpezifikationSchema.parse({
      leistungsTyp: "unbekannt",
      flaeche: null,
      baumarten: [],
      region: null,
      steilheit: null,
      entfernungKm: null,
      verbissschutz: false,
      zaun: false,
      budgetEur: null,
    })
  )

  const bezeichnungen = angebot.positionen.map((p) => p.bezeichnung)

  return MatInputSpezifikationSchema.parse({
    leistungsTyp: mapLeistungsTyp(spez.leistungsTyp),
    flaecheHa: angebot.flaeche_ha ?? spez.flaeche ?? null,
    baumarten: spez.baumarten,
    pflanzverband: pflanzverbandAusPositionen(bezeichnungen),
    verbissschutz: spez.verbissschutz,
    zaun: spez.zaun,
    bundesland: spez.bundesland,
    notiz: `aus Angebot ${angebot.nummer ?? angebot.id}`,
  })
}
