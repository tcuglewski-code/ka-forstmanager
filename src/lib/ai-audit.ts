import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"

/**
 * Loggt einen KI-Aufruf in die AiAuditLog-Tabelle.
 * Speichert NUR den SHA-256 Hash des Prompts, niemals den Klartext.
 */
export async function logAiCall(params: {
  userId?: string | null
  prompt: string
  model: string
  tokenCount?: number
  route: string
}): Promise<void> {
  const promptHash = createHash("sha256").update(params.prompt).digest("hex")

  try {
    await prisma.aiAuditLog.create({
      data: {
        promptHash,
        userId: params.userId ?? undefined,
        model: params.model,
        tokenCount: params.tokenCount ?? 0,
        route: params.route,
      },
    })
  } catch (error) {
    // Audit-Logging darf nie den eigentlichen Request blockieren
    console.error("[AI-Audit] Logging fehlgeschlagen:", error)
  }
}

/**
 * Löscht AiAuditLog-Einträge älter als 90 Tage.
 * Wird vom cleanup-audit Cron aufgerufen.
 */
export async function cleanupAiAuditLogs(retentionDays = 90): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const result = await prisma.aiAuditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  })

  return result.count
}
