/**
 * A8 Rechnungs-Agent — Zod-Schemas (REC-003)
 * NEVER #23: alle JSON-/Engine-Outputs Zod-validiert, kein `as`-Cast.
 */
import { z } from "zod"

export const PositionTypSchema = z.enum(["leistung", "material", "fahrt"])
export type PositionTyp = z.infer<typeof PositionTypSchema>

export const MwstSatzSchema = z.union([
  z.literal(0),
  z.literal(7),
  z.literal(19),
])

/** Eine extrahierte Rechnungsposition (Engine-Output). */
export const ExtraktPositionSchema = z.object({
  beschreibung: z.string().min(1),
  menge: z.number().positive(),
  einheit: z.string().min(1),
  einzelpreis: z.number().min(0),
  gesamt: z.number(),
  mwstSatz: MwstSatzSchema,
  typ: PositionTypSchema,
  auftragPositionId: z.string().nullable().optional(),
  angebotPositionId: z.string().nullable().optional(),
  herkunft: z.enum(["auftrag", "angebot", "material", "protokoll", "manuell"]),
})
export type ExtraktPosition = z.infer<typeof ExtraktPositionSchema>

/** Gesamter Engine-Extrakt, der in RechnungsDraft.extraktJson persistiert wird. */
export const EngineExtraktSchema = z.object({
  quelleTyp: z.enum(["auftrag", "angebot", "manuell"]),
  auftragId: z.string().nullable().optional(),
  angebotId: z.string().nullable().optional(),
  waldbesitzerName: z.string().nullable().optional(),
  waldbesitzerEmail: z.string().email().nullable().optional(),
  leistungszeitraum: z.string().nullable().optional(),
  positionen: z.array(ExtraktPositionSchema),
  nettoGesamt: z.number(),
  mwstGesamt: z.number(),
  bruttoGesamt: z.number(),
  // Hinweise: z.B. Preisabweichung Angebot↔Auftrag (F97), Reverse-Charge (B32)
  hinweise: z.array(z.string()).default([]),
})
export type EngineExtrakt = z.infer<typeof EngineExtraktSchema>

/** MwSt-Gruppierung für PDF-Ausweis (mehrere Sätze pro Rechnung). */
export const MwstGruppeSchema = z.object({
  satz: MwstSatzSchema,
  netto: z.number(),
  steuer: z.number(),
})
export type MwstGruppe = z.infer<typeof MwstGruppeSchema>
