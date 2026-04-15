import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// KG-1: DSGVO Consent API
// POST: Einwilligung erteilen/aktualisieren

const VALID_CONSENT_TYPES = ["KI_VERARBEITUNG", "FOTO_AUSWERTUNG", "MARKETING"] as const

type ConsentType = typeof VALID_CONSENT_TYPES[number]

interface ConsentRequest {
  consents: Record<ConsentType, boolean>
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body: ConsentRequest = await req.json()
    const { consents } = body

    if (!consents || typeof consents !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // IP und User-Agent für Audit-Log
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    const results = []

    for (const [consentType, granted] of Object.entries(consents)) {
      if (!VALID_CONSENT_TYPES.includes(consentType as ConsentType)) {
        continue
      }

      if (granted) {
        // Einwilligung erteilen
        const consent = await prisma.userConsent.upsert({
          where: {
            userId_consentType: {
              userId: session.user.id,
              consentType,
            },
          },
          update: {
            grantedAt: new Date(),
            revokedAt: null,
            ipAddress,
            userAgent,
          },
          create: {
            userId: session.user.id,
            consentType,
            ipAddress,
            userAgent,
          },
        })
        results.push({ type: consentType, status: "granted", id: consent.id })
      } else {
        // Einwilligung widerrufen
        const existing = await prisma.userConsent.findUnique({
          where: {
            userId_consentType: {
              userId: session.user.id,
              consentType,
            },
          },
        })

        if (existing) {
          await prisma.userConsent.update({
            where: { id: existing.id },
            data: {
              revokedAt: new Date(),
            },
          })
          results.push({ type: consentType, status: "revoked" })
        } else {
          results.push({ type: consentType, status: "not_found" })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Consent POST]", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
