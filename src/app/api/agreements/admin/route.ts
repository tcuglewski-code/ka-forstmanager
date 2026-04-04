/**
 * Admin-Route für Vertragsversionen (Sprint KB: CV-02/03)
 * 
 * Für Compliance-Audit: Übersicht aller AGB-Akzeptanzen
 * Nur Admin-Zugriff
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth'

/**
 * GET: Alle Agreements (Admin-only)
 * 
 * Query-Parameter:
 * - userId: Filter nach User (optional)
 * - type: Filter nach agreementType (optional)
 * - version: Filter nach Version (optional)
 * - from: Akzeptanzen ab Datum (ISO, optional)
 * - to: Akzeptanzen bis Datum (ISO, optional)
 * - page: Seite (default: 1)
 * - limit: Pro Seite (default: 50, max: 200)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const version = searchParams.get('version')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    // Filter aufbauen
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (type) where.agreementType = type
    if (version) where.agreementVersion = version
    if (from || to) {
      where.acceptedAt = {}
      if (from) (where.acceptedAt as Record<string, Date>).gte = new Date(from)
      if (to) (where.acceptedAt as Record<string, Date>).lte = new Date(to)
    }

    // Gesamtzahl
    const total = await prisma.userAgreement.count({ where })

    // Daten mit Pagination
    const agreements = await prisma.userAgreement.findMany({
      where,
      orderBy: { acceptedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    // Statistiken
    const stats = await prisma.userAgreement.groupBy({
      by: ['agreementType', 'agreementVersion'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    // Letzte 24h Akzeptanzen
    const last24h = await prisma.userAgreement.count({
      where: {
        acceptedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    // User ohne aktuelle AGB
    const usersWithoutCurrentAGB = await prisma.user.count({
      where: {
        active: true,
        agreements: {
          none: {
            agreementType: 'AGB',
            agreementVersion: '2024-04-01',
          },
        },
      },
    })

    return NextResponse.json({
      agreements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byTypeAndVersion: stats,
        last24hAcceptances: last24h,
        usersWithoutCurrentAGB,
      },
    })
  } catch (error) {
    console.error('Agreements admin GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST: Export für Compliance-Dokumentation
 * 
 * Body:
 * - format: "json" | "csv"
 * - type: Filter nach agreementType (optional)
 * - from: Ab Datum (optional)
 * - to: Bis Datum (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { format = 'json', type, from, to } = body

    const where: Record<string, unknown> = {}
    if (type) where.agreementType = type
    if (from || to) {
      where.acceptedAt = {}
      if (from) (where.acceptedAt as Record<string, Date>).gte = new Date(from)
      if (to) (where.acceptedAt as Record<string, Date>).lte = new Date(to)
    }

    const agreements = await prisma.userAgreement.findMany({
      where,
      orderBy: { acceptedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (format === 'csv') {
      // CSV-Export
      const headers = [
        'ID',
        'User-ID',
        'User-Name',
        'User-Email',
        'Vertragstyp',
        'Version',
        'Akzeptiert am',
        'IP-Adresse',
        'User-Agent',
        'Via',
        'Dokument-Hash',
      ]

      const rows = agreements.map(a => [
        a.id,
        a.userId,
        a.user.name,
        a.user.email,
        a.agreementType,
        a.agreementVersion,
        a.acceptedAt.toISOString(),
        a.ipAddress || '',
        (a.userAgent || '').replace(/,/g, ';').substring(0, 100),
        a.acceptedVia,
        a.documentHash || '',
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="agreements-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON-Export (default)
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      totalRecords: agreements.length,
      agreements,
    })
  } catch (error) {
    console.error('Agreements admin POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
