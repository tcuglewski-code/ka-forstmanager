import { prisma } from "./prisma"

interface AuditLogParams {
  userId?: string
  action: "CREATE" | "UPDATE" | "DELETE"
  entityType: string
  entityId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ip?: string
}

export async function logAudit(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({ data: params })
  } catch (error) {
    console.error("[AuditLog] Failed to log:", error)
  }
}
