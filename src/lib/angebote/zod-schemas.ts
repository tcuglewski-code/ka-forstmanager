/**
 * A1 Angebots-Agent — Zentrale Zod-Schemas (NEVER #23)
 *
 * ALLE JSON-Felder und LLM-Outputs werden über diese Schemas validiert.
 * Niemals JSON.parse() oder `as`-Cast ohne safeParse — verhindert das
 * parseBaumarten-Crash-Pattern (NEVER #23).
 */
import { z } from "zod";

// ── Preisbuch: metadatenJson (ANG-001) ──────────────────────────────────────
export const PreisbuchMetadatenSchema = z
  .object({
    pflanzverbandMin: z.number().optional(),
    pflanzverbandMax: z.number().optional(),
    baumart: z.string().optional(),
    sortierung: z.string().optional(),
    herkunftsgebiet: z.string().optional(),
    hinweis: z.string().optional(),
  })
  .passthrough();
export type PreisbuchMetadaten = z.infer<typeof PreisbuchMetadatenSchema>;

// ── Preisbuch: Aufschlag bedingung (ANG-002) ────────────────────────────────
export const AufschlagBedingungSchema = z
  .object({
    min: z.number().nullish(),
    max: z.number().nullish(),
    wert: z.string().nullish(),
  })
  .passthrough();
export type AufschlagBedingung = z.infer<typeof AufschlagBedingungSchema>;

// ── KalkulationsTemplate: positionenJson + berechnungsLogikJson (ANG-003) ────
export const TemplatePositionSchema = z.object({
  kategorieName: z.string(),
  eintragName: z.string().optional(),
  mengenFormel: z.string(), // bekannte Formel-Keys, kein eval (Security)
  beschreibung: z.string().optional(),
  optional: z.boolean().default(false),
});
export const TemplatePositionenSchema = z.array(TemplatePositionSchema);
export type TemplatePosition = z.infer<typeof TemplatePositionSchema>;

export const TemplateBerechnungsLogikSchema = z
  .object({
    formeln: z.record(z.string(), z.string()).optional(),
    hinweis: z.string().optional(),
  })
  .passthrough();

// ── AnfrageSpezifikation (ANG-013) — LLM-Output Parsing ─────────────────────
export const LeistungsTypSchema = z.enum([
  "erstaufforstung_laub",
  "erstaufforstung_nadel",
  "kulturpflege",
  "saatgut",
  "kombination",
  "unbekannt",
]);
export type LeistungsTyp = z.infer<typeof LeistungsTypSchema>;

export const AnfrageSpezifikationSchema = z.object({
  leistungsTyp: LeistungsTypSchema,
  flaeche: z.number().nullable(), // ha
  baumarten: z.array(z.string()).default([]),
  region: z.string().nullable(),
  bundesland: z.string().nullable().default(null),
  steilheit: z.number().nullable(), // Grad oder %
  entfernungKm: z.number().nullable(),
  bodenart: z.string().nullable().default(null), // normal, steinig, nass
  verbissschutz: z.boolean().default(false),
  zaun: z.boolean().default(false),
  budgetEur: z.number().nullable(),
  zeitraum: z
    .object({ von: z.string().nullable(), bis: z.string().nullable() })
    .default({ von: null, bis: null }),
  besonderheiten: z.array(z.string()).default([]),
  rueckfragenErforderlich: z.array(z.string()).default([]),
  konfidenz: z.number().min(0).max(1).default(0.5),
});
export type AnfrageSpezifikation = z.infer<typeof AnfrageSpezifikationSchema>;

// ── Position-Aufschläge (ANG-010) ───────────────────────────────────────────
export const PositionsAufschlagSchema = z.object({
  typ: z.string(),
  name: z.string().optional(),
  faktor: z.number(),
  betrag: z.number(),
});
export const PositionsAufschlaegeSchema = z.array(PositionsAufschlagSchema);
export type PositionsAufschlag = z.infer<typeof PositionsAufschlagSchema>;

// ── Kalkulations-Position + Ergebnis (ANG-015) ──────────────────────────────
export const KalkulationsPositionSchema = z.object({
  bezeichnung: z.string(),
  menge: z.number(),
  einheit: z.string(),
  einzelpreis: z.number(),
  aufschlaege: PositionsAufschlaegeSchema.default([]),
  gesamtpreis: z.number(),
  mwstSatz: z.number().default(19),
  preisbuchId: z.string().nullable().default(null),
  quelle: z.enum(["preisbuch", "historisch", "geschaetzt", "manuell"]).default("preisbuch"),
  konfidenz: z.number().min(0).max(1).default(1),
});
export type KalkulationsPosition = z.infer<typeof KalkulationsPositionSchema>;

export const KalkulationsDetailsSchema = z.object({
  positionen: z.array(KalkulationsPositionSchema),
  gesamtNetto: z.number(),
  gesamtBrutto: z.number(),
  mwstBetrag: z.number(),
  aufschlaegeSumme: z.number().default(0),
  konfidenz: z.number().min(0).max(1).default(1),
  warnungen: z.array(z.string()).default([]),
});
export type KalkulationsDetails = z.infer<typeof KalkulationsDetailsSchema>;

// ── Text-Generierung Output (ANG-016) ───────────────────────────────────────
export const TextGenerierungSchema = z.object({
  einleitung: z.string(),
  positionsTexte: z.array(z.object({ bezeichnung: z.string(), text: z.string() })).default([]),
  schlussText: z.string(),
});
export type TextGenerierung = z.infer<typeof TextGenerierungSchema>;

// ── Varianten Output (ANG-017) ──────────────────────────────────────────────
export const VariantenBeschreibungSchema = z.object({
  gut: z.object({ titel: z.string(), verkaufstext: z.string(), begruendung: z.string() }),
  besser: z.object({ titel: z.string(), verkaufstext: z.string(), begruendung: z.string() }),
  best: z.object({ titel: z.string(), verkaufstext: z.string(), begruendung: z.string() }),
});
export type VariantenBeschreibung = z.infer<typeof VariantenBeschreibungSchema>;

export const VariantenSnapshotSchema = z.array(KalkulationsPositionSchema);

// ── RAG: Vergleichsaufträge (ANG-018) ───────────────────────────────────────
export const VergleichsAuftragSchema = z.object({
  nummer: z.string().nullable(),
  titel: z.string(),
  typ: z.string(),
  flaecheHa: z.number().nullable(),
  region: z.string().nullable(),
  istKosten: z.number().nullable(),
  istKostenProHa: z.number().nullable(),
});
export const VergleichsAuftraegeSchema = z.array(VergleichsAuftragSchema);
export type VergleichsAuftrag = z.infer<typeof VergleichsAuftragSchema>;

// ── Förder-Hinweis (ANG-019) ────────────────────────────────────────────────
export const FoerderHinweisSchema = z.object({
  hinweis: z.string(),
  programme: z.array(z.string()).default([]),
});
export type FoerderHinweis = z.infer<typeof FoerderHinweisSchema>;

// ── Follow-up-Text (ANG-030) ────────────────────────────────────────────────
export const FollowUpTextSchema = z.object({
  betreff: z.string(),
  text: z.string(),
});
export type FollowUpText = z.infer<typeof FollowUpTextSchema>;

/**
 * Sicherer JSON-Parser für Prisma-Json-Felder.
 * Gibt fallback zurück statt zu crashen (NEVER #23).
 */
export function safeParseJson<T>(
  schema: z.ZodType<T>,
  value: unknown,
  fallback: T
): T {
  if (value === null || value === undefined) return fallback;
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

/**
 * Extrahiert das erste JSON-Objekt/Array aus einem LLM-Text und validiert es.
 * Wirft nie — gibt { ok:false } bei Fehler.
 */
export function parseLlmJson<T>(
  schema: z.ZodType<T>,
  raw: string
): { ok: true; data: T } | { ok: false; error: string } {
  let candidate = raw.trim();
  // Markdown-Codefences entfernen
  candidate = candidate.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Erstes { ... } oder [ ... ] greifen
  const objMatch = candidate.match(/[{[][\s\S]*[}\]]/);
  if (objMatch) candidate = objMatch[0];
  let json: unknown;
  try {
    json = JSON.parse(candidate);
  } catch (e) {
    return { ok: false, error: `JSON-Parse fehlgeschlagen: ${(e as Error).message}` };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: `Schema-Validierung fehlgeschlagen: ${result.error.message}` };
  }
  return { ok: true, data: result.data };
}
