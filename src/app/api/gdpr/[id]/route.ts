/**
 * DSGVO-Anfrage Detail API (Sprint JY: DR-02/03)
 * 
 * Einzelne GDPR-Anfrage abrufen, aktualisieren, entscheiden
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Einzelne GDPR-Anfrage mit allen Details
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const gdprRequest = await prisma.gdprRequest.findUnique({
      where: { id },
      include: {
        rechnungen: {
          select: {
            id: true,
            nummer: true,
            betrag: true,
            bruttoBetrag: true,
            status: true,
            rechnungsDatum: true,
            gdprRestricted: true,
            gdprRestrictedAt: true,
          },
        },
      },
    })

    if (!gdprRequest) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    // Audit-Log für diese Anfrage
    const auditLog = await prisma.gdprRequestAuditLog.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Frist-Status berechnen
    const now = new Date()
    const isOverdue = gdprRequest.dueAt && gdprRequest.dueAt < now && !gdprRequest.completedAt
    const daysRemaining = gdprRequest.dueAt
      ? Math.ceil((gdprRequest.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return NextResponse.json({
      ...gdprRequest,
      auditLog,
      fristStatus: {
        isOverdue,
        daysRemaining,
        dueAt: gdprRequest.dueAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error('GDPR GET [id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH: GDPR-Anfrage aktualisieren (Status, Zuweisung, Entscheidung)
export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()

    const existingRequest = await prisma.gdprRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    const {
      status,
      assignedTo,
      internalNotes,
      decision,
      decisionReason,
      statusReason, // Begründung für Status-Änderung
    } = body

    const updateData: Record<string, unknown> = {}
    const auditActions: Array<{ action: string; field?: string; oldValue?: string; newValue?: string }> = []

    // Status-Änderung
    if (status && status !== existingRequest.status) {
      updateData.status = status

      // Status-Historie aktualisieren
      const statusHistory = (existingRequest.statusHistory as Record<string, unknown>[] || [])
      statusHistory.push({
        status,
        changedAt: new Date().toISOString(),
        changedBy: user.id,
        reason: statusReason || `Status geändert zu ${status}`,
      })
      updateData.statusHistory = statusHistory

      // Bei Abschluss completedAt setzen
      if (['UMGESETZT', 'ABGELEHNT', 'ARCHIVIERT'].includes(status)) {
        updateData.completedAt = new Date()
      }

      auditActions.push({
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: existingRequest.status,
        newValue: status,
      })
    }

    // Zuweisung
    if (assignedTo !== undefined) {
      auditActions.push({
        action: 'ASSIGNED',
        field: 'assignedTo',
        oldValue: existingRequest.assignedTo || '',
        newValue: assignedTo || '',
      })
      updateData.assignedTo = assignedTo
    }

    // Interne Notizen
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes
      auditActions.push({
        action: 'NOTES_UPDATED',
        field: 'internalNotes',
      })
    }

    // Entscheidung
    if (decision) {
      if (!decisionReason && decision === 'ABGELEHNT') {
        return NextResponse.json(
          { error: 'Bei Ablehnung ist eine Begründung Pflicht (DSGVO Art. 12 Abs. 4)' },
          { status: 400 }
        )
      }

      updateData.decision = decision
      updateData.decisionReason = decisionReason
      updateData.decisionAt = new Date()
      updateData.decisionBy = user.id

      auditActions.push({
        action: 'DECISION_MADE',
        field: 'decision',
        newValue: `${decision}: ${decisionReason || ''}`,
      })
    }

    // Update durchführen
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const result = await tx.gdprRequest.update({
        where: { id },
        data: updateData,
      })

      // Audit-Logs erstellen
      for (const audit of auditActions) {
        await tx.gdprRequestAuditLog.create({
          data: {
            requestId: id,
            action: audit.action,
            field: audit.field,
            oldValue: audit.oldValue,
            newValue: audit.newValue,
            performedBy: user.id,
            performedByName: user.name,
          },
        })
      }

      return result
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('GDPR PATCH [id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: GDPR-Anfrage archivieren (nicht wirklich löschen — Dokumentationspflicht)
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const gdprRequest = await prisma.gdprRequest.findUnique({
      where: { id },
    })

    if (!gdprRequest) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    // Nicht löschen, nur archivieren (Dokumentationspflicht)
    const statusHistory = (gdprRequest.statusHistory as Record<string, unknown>[] || [])
    statusHistory.push({
      status: 'ARCHIVIERT',
      changedAt: new Date().toISOString(),
      changedBy: user.id,
      reason: 'Anfrage archiviert',
    })

    await prisma.$transaction(async (tx) => {
      await tx.gdprRequest.update({
        where: { id },
        data: {
          status: 'ARCHIVIERT',
          statusHistory,
          completedAt: gdprRequest.completedAt || new Date(),
        },
      })

      await tx.gdprRequestAuditLog.create({
        data: {
          requestId: id,
          action: 'ARCHIVED',
          performedBy: user.id,
          performedByName: user.name,
        },
      })
    })

    return NextResponse.json({
      message: 'GDPR-Anfrage archiviert (nicht gelöscht — Dokumentationspflicht)',
      id,
    })
  } catch (error) {
    console.error('GDPR DELETE [id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
