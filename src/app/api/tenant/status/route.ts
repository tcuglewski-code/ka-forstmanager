/**
 * GET /api/tenant/status — Tenant-Status für Grace-Period Banner
 * Sprint OG: IMPL-CHURN-07
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const TENANT_ID = process.env.TENANT_ID || "koch-aufforstung"

export async function GET() {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Tenant laden
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_ID },
      select: {
        id: true,
        name: true,
        status: true,
        contractEndDate: true,
        graceEndDate: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Verbleibende Tage berechnen
    let daysRemaining: number | null = null
    if (tenant.status === "grace_period" && tenant.graceEndDate) {
      const now = new Date()
      const endDate = new Date(tenant.graceEndDate)
      daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Readonly-Modus: grace_period oder archived
    const isReadonly = tenant.status === "grace_period" || tenant.status === "archived"

    return NextResponse.json({
      status: tenant.status,
      contractEndDate: tenant.contractEndDate,
      graceEndDate: tenant.graceEndDate,
      daysRemaining,
      isReadonly,
    })
  } catch (error) {
    console.error("Error fetching tenant status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
