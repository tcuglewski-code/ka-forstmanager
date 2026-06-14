/**
 * A2 Material-Bedarf-Agent — zentrale Zod-Schemas (NEVER #23).
 *
 * ALLE JSON-Felder und LLM-Outputs werden über diese Schemas validiert.
 * Niemals JSON.parse() oder `as`-Cast ohne safeParse.
 */
import { z } from "zod"

// ── Input-Spezifikation (aus Angebot oder direkt) ───────────────────────────
export const MatLeistungsTypSchema = z.enum([
  "pflanzung",
  "saat",
  "kulturpflege",
  "kombination",
  "unbekannt",
])
export type MatLeistungsTyp = z.infer<typeof MatLeistungsTypSchema>

export const MatInputSpezifikationSchema = z.object({
  leistungsTyp: MatLeistungsTypSchema.default("pflanzung"),
  flaecheHa: z.number().nonnegative().nullable().default(null),
  baumarten: z.array(z.string()).default([]),
  pflanzverband: z.string().nullable().default(null), // z.B. "2x1m"
  verbissschutz: z.boolean().default(false),
  verbissschutzTyp: z.enum(["wuchshuelle", "spirale", "einzelschutz"]).default("wuchshuelle"),
  zaun: z.boolean().default(false),
  bundesland: z.string().nullable().default(null),
  notiz: z.string().nullable().default(null),
})
export type MatInputSpezifikation = z.infer<typeof MatInputSpezifikationSchema>

// ── LLM-Fallback Output (unbekannte Materialien) ────────────────────────────
export const MatLlmPositionSchema = z.object({
  bezeichnung: z.string().min(1),
  menge: z.number().nonnegative(),
  einheit: z.string().min(1), // stueck, kg, lm, m2
  konfidenz: z.number().min(0).max(1).default(0.5),
})
export const MatLlmPositionenSchema = z.object({
  positionen: z.array(MatLlmPositionSchema).default([]),
})
export type MatLlmPosition = z.infer<typeof MatLlmPositionSchema>

// ── Lager-Abgleich (Prisma-Json) ────────────────────────────────────────────
export const LagerAbgleichEintragSchema = z.object({
  bezeichnung: z.string(),
  bedarf: z.number(),
  bestand: z.number(),
  zuBestellen: z.number(),
  lagerArtikelId: z.string().nullable().default(null),
})
export const LagerAbgleichSchema = z.object({
  verfuegbar: z.array(LagerAbgleichEintragSchema).default([]),
  teilweise: z.array(LagerAbgleichEintragSchema).default([]),
  fehlt: z.array(LagerAbgleichEintragSchema).default([]),
})
export type LagerAbgleich = z.infer<typeof LagerAbgleichSchema>

// ── Bestellvorschlag-Positionen (Prisma-Json) ───────────────────────────────
export const BestellPositionSnapshotSchema = z.object({
  materialPositionId: z.string(),
  bezeichnung: z.string(),
  menge: z.number(),
  preis: z.number().nullable().default(null),
})
export const BestellPositionenSnapshotSchema = z.array(BestellPositionSnapshotSchema)
export type BestellPositionSnapshot = z.infer<typeof BestellPositionSnapshotSchema>

/**
 * Sicherer JSON-Parser für Prisma-Json-Felder. Gibt fallback statt Crash (NEVER #23).
 */
export function safeParseJson<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback
  const result = schema.safeParse(value)
  return result.success ? result.data : fallback
}

/**
 * Extrahiert das erste JSON-Objekt/Array aus einem LLM-Text und validiert es.
 * Wirft nie — gibt { ok:false } bei Fehler.
 */
export function parseLlmJson<T>(
  schema: z.ZodType<T>,
  raw: string
): { ok: true; data: T } | { ok: false; error: string } {
  let candidate = raw.trim()
  candidate = candidate.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  const objMatch = candidate.match(/[{[][\s\S]*[}\]]/)
  if (objMatch) candidate = objMatch[0]
  let json: unknown
  try {
    json = JSON.parse(candidate)
  } catch (e) {
    return { ok: false, error: `JSON-Parse fehlgeschlagen: ${(e as Error).message}` }
  }
  const result = schema.safeParse(json)
  if (!result.success) {
    return { ok: false, error: `Schema-Validierung fehlgeschlagen: ${result.error.message}` }
  }
  return { ok: true, data: result.data }
}
