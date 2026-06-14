/**
 * A1 Angebots-Agent — zentrale Konfiguration, Modell-Konstante, Kill-Switch.
 */
import { prisma } from "@/lib/prisma";

// Modell für KI-Calls (env-überschreibbar). Default: claude-opus-4-8.
export const ANGEBOTE_KI_MODEL =
  process.env.ANGEBOTE_KI_MODEL || "claude-opus-4-8";

// Günstigeres Modell für einfache Aufgaben (Parsing, Follow-up-Text).
export const ANGEBOTE_KI_MODEL_FAST =
  process.env.ANGEBOTE_KI_MODEL_FAST || ANGEBOTE_KI_MODEL;

export const KI_ENABLED = process.env.KI_ENABLED === "true";

// SystemConfig-Keys
export const CONFIG_KEYS = {
  agentAktiv: "ang_agent_aktiv", // Kill-Switch (Default false)
  llmBudgetMonatCent: "ang_llm_budget_monat_cent", // Default 5000 (=50€)
  followupAktiv: "ang_followup_aktiv",
  followupIntervall1: "ang_followup_intervall_1", // Tage
  followupIntervall2: "ang_followup_intervall_2",
  followupIntervall3: "ang_followup_intervall_3",
  mwstStandard: "ang_mwst_standard",
} as const;

const DEFAULTS: Record<string, string> = {
  [CONFIG_KEYS.agentAktiv]: "false",
  [CONFIG_KEYS.llmBudgetMonatCent]: "5000",
  [CONFIG_KEYS.followupAktiv]: "true",
  [CONFIG_KEYS.followupIntervall1]: "3",
  [CONFIG_KEYS.followupIntervall2]: "7",
  [CONFIG_KEYS.followupIntervall3]: "14",
  [CONFIG_KEYS.mwstStandard]: "19",
};

export async function getConfig(key: string): Promise<string> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getConfigMap(): Promise<Record<string, string>> {
  const rows = await prisma.systemConfig.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

/** Kill-Switch: ist der KI-Angebots-Agent aktiv? (NEVER #21) */
export async function isAgentAktiv(): Promise<boolean> {
  const v = await getConfig(CONFIG_KEYS.agentAktiv);
  return v === "true";
}

/** Default-Keys in SystemConfig anlegen (idempotent). */
export async function seedAngebotsConfig(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await prisma.systemConfig.findUnique({ where: { key } });
    if (!existing) {
      await prisma.systemConfig.create({ data: { key, value } });
    }
  }
}

/** Token-Generator für Tracking/Portal-Links (URL-safe, ~32 Zeichen). */
export function generateToken(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
