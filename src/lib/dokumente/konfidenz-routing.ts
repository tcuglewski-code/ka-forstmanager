/**
 * DOK-007: Konfidenz-basiertes Routing für Dokumenten-Scans.
 *
 * Entscheidet anhand von Extraktions-Konfidenz, Dokumenttyp, Währung,
 * Betrag und Doppelbuchungs-Status, ob ein Scan automatisch gebucht
 * werden darf oder in den Review muss.
 */
import type { DokumentenScan } from "@prisma/client"

export type RoutingAction = "AUTO_BUCHEN" | "REVIEW" | "ABGELEHNT"

export interface RoutingEntscheidung {
  action: RoutingAction
  grund: string
}

export interface RoutingConfig {
  /** Konfidenz ab der ein Feld als sicher gilt (Default 0.85) */
  schwelleHigh: number
  /** Konfidenz unter der ein Scan abgelehnt wird (Default 0.60) */
  schwelleLow: number
  /** Bruttobetrag ab dem Vier-Augen-Review Pflicht ist (Default 500 EUR) */
  vierAugenBetrag: number
}

export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  schwelleHigh: 0.85,
  schwelleLow: 0.6,
  vierAugenBetrag: 500,
}

export interface RoutingInput extends Partial<DokumentenScan> {
  /** Feld-Konfidenzen aus der Extraktion (0..1) */
  feldKonfidenzen?: number[]
  /** ISO-Währungscode aus der Extraktion */
  waehrung?: string
  /** Bruttobetrag aus der Extraktion */
  bruttoBetrag?: number
  /** Ergebnis der Doppelbuchungs-Prüfung (DOK-008) */
  istDoppelbuchung?: boolean
}

export function routeDocument(
  scan: RoutingInput,
  config: RoutingConfig = DEFAULT_ROUTING_CONFIG
): RoutingEntscheidung {
  const konfidenzen =
    scan.feldKonfidenzen ??
    (typeof scan.gesamtKonfidenz === "number" ? [scan.gesamtKonfidenz] : [])

  // Harte Ablehnung: gar keine verwertbare Extraktion
  if (konfidenzen.length === 0) {
    return { action: "REVIEW", grund: "Keine Konfidenzwerte vorhanden" }
  }

  const minKonfidenz = Math.min(...konfidenzen)

  if (minKonfidenz < config.schwelleLow) {
    return {
      action: "ABGELEHNT",
      grund: `Konfidenz ${minKonfidenz.toFixed(2)} unter Minimum ${config.schwelleLow}`,
    }
  }

  if (scan.istDoppelbuchung) {
    return { action: "REVIEW", grund: "Mögliche Doppelbuchung erkannt" }
  }

  if (scan.typ === "GUTSCHRIFT") {
    return { action: "REVIEW", grund: "Gutschriften erfordern immer manuelle Prüfung" }
  }

  if (scan.waehrung && scan.waehrung.toUpperCase() !== "EUR") {
    return { action: "REVIEW", grund: `Fremdwährung ${scan.waehrung} erfordert Prüfung` }
  }

  if (minKonfidenz < config.schwelleHigh) {
    return {
      action: "REVIEW",
      grund: `Konfidenz ${minKonfidenz.toFixed(2)} unter Auto-Schwelle ${config.schwelleHigh}`,
    }
  }

  if (
    typeof scan.bruttoBetrag === "number" &&
    scan.bruttoBetrag >= config.vierAugenBetrag
  ) {
    return {
      action: "REVIEW",
      grund: `Betrag ${scan.bruttoBetrag.toFixed(2)} EUR ≥ Vier-Augen-Grenze ${config.vierAugenBetrag} EUR`,
    }
  }

  return { action: "AUTO_BUCHEN", grund: "Alle Konfidenzwerte hoch, keine Sonderfälle" }
}
