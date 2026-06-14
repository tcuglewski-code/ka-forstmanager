/**
 * A2 Material-Bedarf-Agent — zentrale Konfiguration, Modell-Konstante, Kill-Switch.
 */
import { prisma } from "@/lib/prisma"

// Modell für KI-Fallback-Calls (env-überschreibbar). Default: claude-opus-4-8.
export const MATERIAL_KI_MODEL = process.env.MATERIAL_KI_MODEL || "claude-opus-4-8"
// Günstigeres Modell für einfache Schätzungen.
export const MATERIAL_KI_MODEL_FAST =
  process.env.MATERIAL_KI_MODEL_FAST || MATERIAL_KI_MODEL

export const KI_ENABLED = process.env.KI_ENABLED === "true"

// SystemConfig-Keys
export const MAT_CONFIG_KEYS = {
  agentAktiv: "mat_agent_aktiv", // Kill-Switch (Default false, NEVER #21)
  llmBudgetMonatCent: "mat_llm_budget_monat_cent", // Default 3000 (=30€)
  verbissPufferProzent: "mat_verbiss_puffer_prozent", // Default 5
  pfahlAbstandM: "mat_pfahl_abstand_m", // Default 3
} as const

const DEFAULTS: Record<string, string> = {
  [MAT_CONFIG_KEYS.agentAktiv]: "false",
  [MAT_CONFIG_KEYS.llmBudgetMonatCent]: "3000",
  [MAT_CONFIG_KEYS.verbissPufferProzent]: "5",
  [MAT_CONFIG_KEYS.pfahlAbstandM]: "3",
}

export async function getMatConfig(key: string): Promise<string> {
  const row = await prisma.systemConfig.findUnique({ where: { key } })
  return row?.value ?? DEFAULTS[key] ?? ""
}

export async function getMatConfigNumber(key: string, fallback: number): Promise<number> {
  const v = await getMatConfig(key)
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Kill-Switch: ist der Material-Bedarf-Agent aktiv? (NEVER #21) */
export async function isMatAgentAktiv(): Promise<boolean> {
  const v = await getMatConfig(MAT_CONFIG_KEYS.agentAktiv)
  return v === "true"
}

/** Default-Keys in SystemConfig anlegen (idempotent). */
export async function seedMatConfig(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await prisma.systemConfig.findUnique({ where: { key } })
    if (!existing) {
      await prisma.systemConfig.create({ data: { key, value } })
    }
  }
}
