/**
 * WIZ-02: Webhook-Flow-Entscheidung für WordPress-Wizard-Anfragen.
 *
 * Backward-kompatibel: Der Auftrag wird IMMER erstellt (bestehende Kunden merken
 * nichts). Zusätzlich wird — nur wenn der A1-Angebots-Agent aktiv ist
 * (ang_agent_aktiv, NEVER #21) — ein AngebotsDraft + KI-Angebot generiert.
 *
 * Reine Funktionen (keine DB, kein Netz) → unit-testbar (tests/a1/wizard-webhook.test.ts).
 */

export interface WPWizardDaten {
  id?: number
  titel?: string
  waldbesitzer?: string
  email?: string
  telefon?: string
  flaeche?: string | number
  standort?: string
  bundesland?: string
  angelegt?: number // Unix Timestamp
  wizard_typ?: string
  wizard_daten?: {
    pflanzverband?: string
    schutztyp?: string[]
    schutzart?: string
    zauntyp?: string
    aufwuchsart?: string[]
    arbeitsmethode?: string
    baumarten?: string
    beschreibung?: string
    lat?: number
    lng?: number
    [key: string]: unknown
  }
  status?: string
  kommentar?: string
}

export interface WebhookFlow {
  /** Auftrag wird immer erstellt (backward-compat, Fallback). */
  auftragErstellen: boolean
  /** Nur wenn A1-Agent aktiv: AngebotsDraft + KI-Angebot generieren. */
  angebotsAgentTriggern: boolean
}

/**
 * Entscheidet den Webhook-Flow anhand des A1-Kill-Switches.
 * - ang_agent_aktiv=false → nur Auftrag (bisheriger Flow).
 * - ang_agent_aktiv=true  → Auftrag + AngebotsDraft-Flow.
 */
export function webhookFlowEntscheidung(angAgentAktiv: boolean): WebhookFlow {
  return {
    auftragErstellen: true,
    angebotsAgentTriggern: angAgentAktiv === true,
  }
}

/**
 * Baut aus den Wizard-Daten den rohen Anfragetext (JSON-String) für den
 * A1-Parser. Enthält Basisfelder + Wizard-Detaildaten; leere Werte werden
 * weggelassen, um den Parser nicht mit Rauschen zu füttern.
 */
export function buildRoheAnfrage(data: WPWizardDaten): string {
  const basis: Record<string, unknown> = {
    titel: data.titel,
    waldbesitzer: data.waldbesitzer,
    email: data.email,
    telefon: data.telefon,
    flaeche_ha: data.flaeche,
    standort: data.standort,
    bundesland: data.bundesland,
    wizard_typ: data.wizard_typ,
    kommentar: data.kommentar,
    ...(data.wizard_daten ?? {}),
  }
  const sauber: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(basis)) {
    if (v === null || v === undefined || v === "") continue
    if (Array.isArray(v) && v.length === 0) continue
    sauber[k] = v
  }
  return JSON.stringify(sauber)
}
