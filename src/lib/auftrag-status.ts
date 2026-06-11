// AUDIT-FIX: [K1/K5] Zentrale Auftrag-Status-Definition (Single Source of Truth).
// Vorher: drei inkonsistente "Offen"-Definitionen (Dashboard notIn / Reports 4er-Whitelist / Analytics ungefiltert)
// und keine Status-Validierung im Dashboard-PATCH.

/** Alle im System verwendeten Auftrag-Status (Dashboard- + App-Workflow). */
export const AUFTRAG_STATUSES = [
  // Dashboard-Workflow
  "anfrage",
  "angebot",
  "geplant",
  "aktiv",
  "in_bearbeitung",
  "maengel_offen",
  "abnahme",
  "abgeschlossen",
  "storniert",
  // App-Workflow (mobile)
  "offen",
  "in_arbeit",
  "bereit",
  "geprueft",
  "nacharbeit",
  "abrechnungsbereit",
  "pausiert",
] as const

export type AuftragStatus = (typeof AUFTRAG_STATUSES)[number]

/** Finale Status — ein Auftrag mit diesem Status gilt NICHT als "offen". */
export const CLOSED_STATUSES = ["abgeschlossen", "storniert"] as const

/** Prisma-Filter für "offene" Aufträge — überall identisch verwenden. */
export const OPEN_STATUS_FILTER = { notIn: [...CLOSED_STATUSES] as string[] }

export function isValidAuftragStatus(status: unknown): status is AuftragStatus {
  return typeof status === "string" && (AUFTRAG_STATUSES as readonly string[]).includes(status)
}
