/**
 * DSGVO-Anfragen API (Sprint JY: DR-02/03)
 * 
 * Verwaltet Betroffenenanfragen gemäß DSGVO Art. 12-23
 * Bei GoBD-Konflikt: Einschränkung statt Löschung (Art. 18)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth'
import { addDays } from 'date-fns'

// GET: Liste aller GDPR-Anfragen (nur Admin)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const overdue = searchParams.get('overdue') === 'true'

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }
    if (overdue) {
      where.dueAt = { lt: new Date() }
      where.completedAt = null
    }

    const requests = await prisma.gdprRequest.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { dueAt: 'asc' },
      ],
      include: {
        rechnungen: {
          select: { id: true, nummer: true, betrag: true },
        },
      },
    })

    // Statistiken für Dashboard
    const stats = await prisma.gdprRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const overdueCount = await prisma.gdprRequest.count({
      where: {
        dueAt: { lt: new Date() },
        completedAt: null,
      },
    })

    return NextResponse.json({
      requests,
      stats: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
        overdueCount,
        total: requests.length,
      },
    })
  } catch (error) {
    console.error('GDPR GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Neue GDPR-Anfrage erstellen
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      requesterName,
      requesterEmail,
      requesterType = 'KUNDE',
      requestType,
      requestReason,
      affectedEntities,
    } = body

    if (!requesterName || !requesterEmail || !requestType) {
      return NextResponse.json(
        { error: 'requesterName, requesterEmail und requestType sind Pflichtfelder' },
        { status: 400 }
      )
    }

    // DSGVO Art. 12 Abs. 3: 30 Tage Frist (kann auf 60 verlängert werden bei Komplexität)
    const dueAt = addDays(new Date(), 30)

    const gdprRequest = await prisma.gdprRequest.create({
      data: {
        requesterName,
        requesterEmail,
        requesterType,
        requestType,
        requestReason,
        affectedEntities,
        dueAt,
        statusHistory: [{
          status: 'EINGEGANGEN',
          changedAt: new Date().toISOString(),
          changedBy: user.id,
          reason: 'Anfrage eingegangen',
        }],
      },
    })

    // Audit-Log
    await prisma.gdprRequestAuditLog.create({
      data: {
        requestId: gdprRequest.id,
        action: 'CREATED',
        newValue: JSON.stringify({ requestType, requesterEmail }),
        performedBy: user.id,
        performedByName: user.name,
      },
    })

    return NextResponse.json(gdprRequest, { status: 201 })
  } catch (error) {
    console.error('GDPR POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
