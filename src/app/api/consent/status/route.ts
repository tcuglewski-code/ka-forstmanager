import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// KG-1: DSGVO Consent Status API
// GET: Aktuellen Consent-Status abrufen

const CONSENT_TYPES = ["KI_VERARBEITUNG", "FOTO_AUSWERTUNG", "MARKETING"] as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const consents = await prisma.userConsent.findMany({
      where: {
        userId: session.user.id,
        consentType: { in: [...CONSENT_TYPES] },
      },
      select: {
        consentType: true,
        grantedAt: true,
        revokedAt: true,
      },
    })

    // Build consent status map
    const consentStatus: Record<string, boolean> = {}
    const consentDetails: Record<string, { grantedAt: Date | null; revokedAt: Date | null }> = {}

    for (const type of CONSENT_TYPES) {
      const consent = consents.find(c => c.consentType === type)
      // Consent ist aktiv wenn grantedAt existiert und revokedAt null ist
      consentStatus[type] = consent ? !consent.revokedAt : false
      consentDetails[type] = consent 
        ? { grantedAt: consent.grantedAt, revokedAt: consent.revokedAt }
        : { grantedAt: null, revokedAt: null }
    }

    return NextResponse.json({
      consents: consentStatus,
      details: consentDetails,
      userId: session.user.id,
    })
  } catch (error) {
    console.error("[Consent Status]", error)
    return NextResponse.json(
      { error: "Interner Serverfehler", details: String(error) },
      { status: 500 }
    )
  }
}
