import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const TENANT_ID = "koch-aufforstung"
const ALLOWED_ROLES = ["ka_admin", "super_admin", "admin", "supervisor"]

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !ALLOWED_ROLES.includes(role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [insight, config] = await Promise.all([
    prisma.aiInsight.findFirst({
      where: { tenantId: TENANT_ID, insightType: "business_strategy" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.tenantConfig.findUnique({ where: { tenantId: TENANT_ID } }),
  ])

  return NextResponse.json({
    insight,
    config: config
      ? {
          aiEnabled: config.aiEnabled,
          aiModel: config.aiModel,
          aiFrequency: config.aiFrequency,
          aiLastRun: config.aiLastRun,
        }
      : null,
  })
}
