import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const TENANT_ID = "koch-aufforstung"
const ALLOWED_ROLES = ["ka_admin", "super_admin", "admin", "supervisor"]
const ALLOWED_MODELS = ["claude-sonnet-4-5", "claude-opus-4-5", "claude-haiku-4-5"]
const ALLOWED_FREQUENCIES = ["daily", "weekly", "monthly"]

async function requireRole(req?: NextRequest) {
  // Service-to-service: shared bearer token (used by Mission Control)
  const serviceToken = process.env.ANALYTICS_CONFIG_TOKEN
  if (serviceToken && req) {
    const authHeader = req.headers.get("authorization") || ""
    if (authHeader === `Bearer ${serviceToken}`) return { user: { role: "service" } }
  }
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !ALLOWED_ROLES.includes(role || "")) return null
  return session
}

async function getOrCreateConfig() {
  let cfg = await prisma.tenantConfig.findUnique({ where: { tenantId: TENANT_ID } })
  if (!cfg) {
    cfg = await prisma.tenantConfig.create({
      data: { tenantId: TENANT_ID },
    })
  }
  return cfg
}

export async function GET(req: NextRequest) {
  const session = await requireRole(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cfg = await getOrCreateConfig()
  return NextResponse.json(cfg)
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (typeof body.aiEnabled === "boolean") data.aiEnabled = body.aiEnabled
  if (typeof body.aiModel === "string") {
    if (!ALLOWED_MODELS.includes(body.aiModel)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 })
    }
    data.aiModel = body.aiModel
  }
  if (typeof body.aiFrequency === "string") {
    if (!ALLOWED_FREQUENCIES.includes(body.aiFrequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
    }
    data.aiFrequency = body.aiFrequency
  }

  await getOrCreateConfig()
  const updated = await prisma.tenantConfig.update({
    where: { tenantId: TENANT_ID },
    data,
  })
  return NextResponse.json(updated)
}
