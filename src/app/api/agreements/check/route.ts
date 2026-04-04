/**
 * AGB-Versionscheck API (Sprint KB: CV-02/03)
 * 
 * Prüft ob ein User alle aktuellen Vertragsversionen akzeptiert hat
 * Für Login-Flow und Middleware-Checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Aktuelle Vertragsversionen (aus Config oder DB)
// Bei Änderung müssen User neu akzeptieren
const REQUIRED_AGREEMENTS: Record<string, { version: string; required: boolean }> = {
  AGB: { version: '2024-04-01', required: true },
  DATENSCHUTZ: { version: '2024-04-01', required: true },
}

// Optionale Agreements (User muss nicht, kann aber)
const OPTIONAL_AGREEMENTS: Record<string, string> = {
  KI_ANNEX: '2024-04-01',
  NEWSLETTER: '2024-04-01',
}

/**
 * GET: Prüfe ob User alle Pflicht-AGBs akzeptiert hat
 * 
 * Response:
 * - allAccepted: boolean
 * - pending: Array mit ausstehenden Agreements
 * - accepted: Array mit akzeptierten Agreements
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Alle Akzeptanzen des Users laden
    const agreements = await prisma.userAgreement.findMany({
      where: { userId: user.id },
      orderBy: { acceptedAt: 'desc' },
    })

    // Gruppiere nach Typ und nimm die neueste
    const latestByType: Record<string, typeof agreements[0]> = {}
    for (const agreement of agreements) {
      // WIDERRUF-Einträge behandeln
      if (agreement.agreementType.startsWith('WIDERRUF_')) {
        const originalType = agreement.agreementType.replace('WIDERRUF_', '')
        // Widerruf überschreibt vorherige Akzeptanz
        if (!latestByType[`REVOKED_${originalType}`]) {
          latestByType[`REVOKED_${originalType}`] = agreement
        }
      } else if (!latestByType[agreement.agreementType]) {
        latestByType[agreement.agreementType] = agreement
      }
    }

    // Prüfe Pflicht-Agreements
    const pending: Array<{
      type: string
      currentVersion: string
      acceptedVersion: string | null
      reason: string
    }> = []

    const accepted: Array<{
      type: string
      version: string
      acceptedAt: Date
    }> = []

    for (const [type, config] of Object.entries(REQUIRED_AGREEMENTS)) {
      if (!config.required) continue

      const latest = latestByType[type]
      const revoked = latestByType[`REVOKED_${type}`]

      // Wurde widerrufen?
      if (revoked && (!latest || revoked.acceptedAt > latest.acceptedAt)) {
        pending.push({
          type,
          currentVersion: config.version,
          acceptedVersion: null,
          reason: 'Einwilligung widerrufen',
        })
        continue
      }

      if (!latest) {
        pending.push({
          type,
          currentVersion: config.version,
          acceptedVersion: null,
          reason: 'Nie akzeptiert',
        })
      } else if (latest.agreementVersion !== config.version) {
        pending.push({
          type,
          currentVersion: config.version,
          acceptedVersion: latest.agreementVersion,
          reason: 'Neue Version verfügbar',
        })
      } else {
        accepted.push({
          type,
          version: latest.agreementVersion,
          acceptedAt: latest.acceptedAt,
        })
      }
    }

    // Optionale Agreements
    const optional: Array<{
      type: string
      currentVersion: string
      status: 'accepted' | 'not_accepted' | 'revoked'
      acceptedAt?: Date
    }> = []

    for (const [type, version] of Object.entries(OPTIONAL_AGREEMENTS)) {
      const latest = latestByType[type]
      const revoked = latestByType[`REVOKED_${type}`]

      if (revoked && (!latest || revoked.acceptedAt > latest.acceptedAt)) {
        optional.push({ type, currentVersion: version, status: 'revoked' })
      } else if (latest?.agreementVersion === version) {
        optional.push({ type, currentVersion: version, status: 'accepted', acceptedAt: latest.acceptedAt })
      } else {
        optional.push({ type, currentVersion: version, status: 'not_accepted' })
      }
    }

    return NextResponse.json({
      allAccepted: pending.length === 0,
      pending,
      accepted,
      optional,
      requiredCount: Object.keys(REQUIRED_AGREEMENTS).filter(k => REQUIRED_AGREEMENTS[k].required).length,
      acceptedCount: accepted.length,
    })
  } catch (error) {
    console.error('Agreements check error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
