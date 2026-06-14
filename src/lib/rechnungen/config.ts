/**
 * A8 Rechnungs-Agent — Konfiguration & Kill-Switch (REC-001)
 *
 * Kill-Switch-Pattern analog zu DOK-KI (src/app/api/settings/dokumente-ki).
 * Keys in SystemConfig:
 *  - rechnungs_agent_aktiv  ("true"/"false", NEVER #21 — Default "false" = Shadow-Mode)
 *
 * Firmenstammdaten kommen aus ENV (COMPANY_*) für §14-UStG-Pflichtangaben.
 */
import { prisma } from "@/lib/prisma"

export const RECHNUNG_CONFIG_KEYS = {
  agentAktiv: "rechnungs_agent_aktiv",
} as const

export const RECHNUNG_CONFIG_DEFAULTS: Record<string, string> = {
  [RECHNUNG_CONFIG_KEYS.agentAktiv]: "false", // NEVER #21: Default aus = Shadow-Mode
}

/**
 * Liest den Kill-Switch. Default false (Agent inaktiv / Shadow-Mode).
 * Erlaubt manuelles Erstellen weiterhin — blockiert nur Agent-Automatik
 * (z.B. POST /api/rechnungen/generieren).
 */
export async function istAgentAktiv(): Promise<boolean> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: RECHNUNG_CONFIG_KEYS.agentAktiv },
  })
  return (row?.value ?? RECHNUNG_CONFIG_DEFAULTS[RECHNUNG_CONFIG_KEYS.agentAktiv]) === "true"
}

export interface FirmenStammdaten {
  name: string
  strasse: string
  plz: string
  ort: string
  iban: string
  bic: string
  steuernummer: string
  ustIdNr?: string
  email?: string
  telefon?: string
  kleinunternehmer: boolean
}

/**
 * Firmenstammdaten für Rechnungs-PDF + §14-UStG-Pflichtangaben.
 * Aus ENV (COMPANY_*) — keine Secrets, nur Stammdaten.
 */
export function getFirmenStammdaten(): FirmenStammdaten {
  return {
    name: process.env.COMPANY_NAME || "Koch Aufforstung",
    strasse: process.env.COMPANY_STRASSE || "",
    plz: process.env.COMPANY_PLZ || "",
    ort: process.env.COMPANY_ORT || "",
    iban: process.env.COMPANY_IBAN || "",
    bic: process.env.COMPANY_BIC || "",
    steuernummer: process.env.COMPANY_STEUERNUMMER || "",
    ustIdNr: process.env.COMPANY_UST_IDNR || undefined,
    email: process.env.COMPANY_EMAIL || undefined,
    telefon: process.env.COMPANY_TELEFON || undefined,
    kleinunternehmer: process.env.COMPANY_KLEINUNTERNEHMER === "true",
  }
}
