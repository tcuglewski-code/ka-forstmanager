/**
 * Vertragsversionierung API (Sprint KB: CV-02/03)
 * 
 * Speichert AGB-Akzeptanz mit Timestamp, IP, User-Agent
 * Immutable Log: Einträge werden nie gelöscht oder geändert
 * DSGVO Art. 7: Nachweis der Einwilligung
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth-helpers'
import { createHash } from 'crypto'

// Aktuelle Vertragsversionen (aus Config oder DB laden)
const CURRENT_VERSIONS: Record<string, string> = {
  AGB: '2024-04-01',
  DATENSCHUTZ: '2024-04-01',
  KI_ANNEX: '2024-04-01',
  NEWSLETTER: '2024-04-01',
}

// Dokumenten-URLs (für Archivierung)
const DOCUMENT_URLS: Record<string, string> = {
  AGB: '/rechtliches/agb',
  DATENSCHUTZ: '/datenschutz',
  KI_ANNEX: '/rechtliches/ki-annex',
  NEWSLETTER: '/rechtliches/newsletter',
}

/**
 * GET: Akzeptierte Verträge des Users abrufen
 * 
 * Query-Parameter:
 * - type: Filterung nach agreementType (optional)
 * - checkCurrent: true → prüft ob aktuelle Versionen akzeptiert (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const checkCurrent = searchParams.get('checkCurrent') === 'true'

    const where: Record<string, unknown> = { userId: user.id }
    if (type) {
      where.agreementType = type
    }

    const agreements = await prisma.userAgreement.findMany({
      where,
      orderBy: { acceptedAt: 'desc' },
    })

    // Gruppiere nach Typ und nimm die neueste Akzeptanz
    const latestByType: Record<string, typeof agreements[0]> = {}
    for (const agreement of agreements) {
      if (!latestByType[agreement.agreementType]) {
        latestByType[agreement.agreementType] = agreement
      }
    }

    // Prüfe ob aktuelle Versionen akzeptiert sind
    const versionStatus: Record<string, { 
      accepted: boolean
      currentVersion: string
      acceptedVersion: string | null
      acceptedAt: Date | null 
    }> = {}

    if (checkCurrent) {
      for (const [agreementType, currentVersion] of Object.entries(CURRENT_VERSIONS)) {
        const latest = latestByType[agreementType]
        versionStatus[agreementType] = {
          accepted: latest?.agreementVersion === currentVersion,
          currentVersion,
          acceptedVersion: latest?.agreementVersion || null,
          acceptedAt: latest?.acceptedAt || null,
        }
      }
    }

    return NextResponse.json({
      agreements,
      latestByType,
      ...(checkCurrent && { versionStatus, allCurrentAccepted: Object.values(versionStatus).every(v => v.accepted) }),
    })
  } catch (error) {
    console.error('Agreements GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST: AGB-Akzeptanz speichern
 * 
 * Body:
 * - agreementType: AGB | DATENSCHUTZ | KI_ANNEX | NEWSLETTER | ...
 * - agreementVersion: (optional, default: aktuelle Version)
 * - documentContent: (optional) Volltext für Hash-Generierung
 * - acceptedVia: WEB | APP | API (optional, default: WEB)
 * 
 * Automatisch erfasst:
 * - Timestamp
 * - IP-Adresse
 * - User-Agent
 * - Session-ID
 * - Dokument-Hash (wenn Content mitgeliefert)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      agreementType,
      agreementVersion,
      documentContent,
      acceptedVia = 'WEB',
      deviceInfo,
    } = body

    // Validierung
    if (!agreementType) {
      return NextResponse.json(
        { error: 'agreementType ist ein Pflichtfeld' },
        { status: 400 }
      )
    }

    const validTypes = ['AGB', 'DATENSCHUTZ', 'KI_ANNEX', 'NEWSLETTER', 'NUTZUNGSBEDINGUNGEN', 'WIDERRUF']
    if (!validTypes.includes(agreementType)) {
      return NextResponse.json(
        { error: `agreementType muss einer von: ${validTypes.join(', ')} sein` },
        { status: 400 }
      )
    }

    // Version bestimmen
    const version = agreementVersion || CURRENT_VERSIONS[agreementType] || new Date().toISOString().split('T')[0]

    // Forensische Daten extrahieren
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Session-ID aus Cookie oder Header
    const sessionId = req.cookies.get('session')?.value 
      || req.headers.get('x-session-id') 
      || null

    // Dokument-Hash generieren (falls Content mitgeliefert)
    let documentHash: string | undefined
    if (documentContent) {
      documentHash = createHash('sha256').update(documentContent).digest('hex')
    }

    // Dokument-URL
    const documentUrl = DOCUMENT_URLS[agreementType] || null

    // Prüfe ob bereits dieselbe Version akzeptiert wurde
    const existing = await prisma.userAgreement.findFirst({
      where: {
        userId: user.id,
        agreementType,
        agreementVersion: version,
      },
    })

    if (existing) {
      return NextResponse.json({
        message: 'Diese Version wurde bereits akzeptiert',
        agreement: existing,
        alreadyAccepted: true,
      })
    }

    // Neue Akzeptanz erstellen (IMMUTABLE - wird nie geändert)
    const agreement = await prisma.userAgreement.create({
      data: {
        userId: user.id,
        agreementType,
        agreementVersion: version,
        ipAddress,
        userAgent: userAgent.substring(0, 500), // Limitieren für DB
        deviceInfo,
        acceptedVia,
        sessionId,
        documentHash,
        documentUrl,
      },
    })

    // Activity Log
    await prisma.activityLog.create({
      data: {
        action: 'AGREEMENT_ACCEPTED',
        entityType: 'UserAgreement',
        entityId: agreement.id,
        entityName: `${agreementType} v${version}`,
        userId: user.id,
        metadata: JSON.stringify({
          agreementType,
          agreementVersion: version,
          ipAddress,
          acceptedVia,
        }),
      },
    })

    return NextResponse.json({
      message: `${agreementType} v${version} erfolgreich akzeptiert`,
      agreement,
      alreadyAccepted: false,
    }, { status: 201 })
  } catch (error) {
    console.error('Agreements POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE: Widerruf einer Einwilligung
 * 
 * Erstellt einen neuen WIDERRUF-Eintrag (originalAgreement wird nicht gelöscht!)
 * Nur für widerrufbare Einwilligungen (Newsletter, Marketing)
 * 
 * Body:
 * - agreementType: Typ der zu widerrufenden Einwilligung
 * - reason: (optional) Begründung des Widerrufs
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { agreementType, reason } = body

    // Nur bestimmte Typen sind widerrufbar
    const revocableTypes = ['NEWSLETTER', 'MARKETING', 'KI_ANNEX']
    if (!revocableTypes.includes(agreementType)) {
      return NextResponse.json(
        { error: `${agreementType} kann nicht widerrufen werden. Widerrufbar: ${revocableTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Prüfe ob überhaupt eine Einwilligung existiert
    const existing = await prisma.userAgreement.findFirst({
      where: {
        userId: user.id,
        agreementType,
      },
      orderBy: { acceptedAt: 'desc' },
    })

    if (!existing) {
      return NextResponse.json(
        { error: `Keine ${agreementType}-Einwilligung vorhanden` },
        { status: 404 }
      )
    }

    // Forensische Daten
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Widerruf als neuen Eintrag (IMMUTABLE LOG!)
    const revocation = await prisma.userAgreement.create({
      data: {
        userId: user.id,
        agreementType: `WIDERRUF_${agreementType}`,
        agreementVersion: existing.agreementVersion,
        ipAddress,
        userAgent: userAgent.substring(0, 500),
        acceptedVia: 'WEB',
        documentUrl: reason || 'Nutzer hat Einwilligung widerrufen',
      },
    })

    // Activity Log
    await prisma.activityLog.create({
      data: {
        action: 'AGREEMENT_REVOKED',
        entityType: 'UserAgreement',
        entityId: revocation.id,
        entityName: `${agreementType} widerrufen`,
        userId: user.id,
        metadata: JSON.stringify({
          originalAgreementType: agreementType,
          reason,
          ipAddress,
        }),
      },
    })

    return NextResponse.json({
      message: `${agreementType}-Einwilligung erfolgreich widerrufen`,
      revocation,
    })
  } catch (error) {
    console.error('Agreements DELETE error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
