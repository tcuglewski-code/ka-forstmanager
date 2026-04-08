/**
 * DSGVO Art. 18 — Einschränkung der Verarbeitung (Sprint JY: DR-02/03)
 * 
 * Bei Löschantrag für GoBD-pflichtige Daten (Rechnungen):
 * → Zugriff einschränken statt löschen
 * → GoBD-Aufbewahrungspflicht (10 Jahre) bleibt gewahrt
 * → Betroffener erhält Auskunft dass Daten gesperrt (nicht gelöscht) sind
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth-helpers'

// POST: Einschränkung auf Rechnungen anwenden
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { gdprRequestId, rechnungIds, reason } = body

    if (!gdprRequestId || !rechnungIds || !Array.isArray(rechnungIds)) {
      return NextResponse.json(
        { error: 'gdprRequestId und rechnungIds (Array) sind Pflicht' },
        { status: 400 }
      )
    }

    // Prüfen ob GDPR-Request existiert
    const gdprRequest = await prisma.gdprRequest.findUnique({
      where: { id: gdprRequestId },
    })

    if (!gdprRequest) {
      return NextResponse.json(
        { error: 'GDPR-Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    // Transaktional: Alle Rechnungen einschränken
    const now = new Date()
    const results = await prisma.$transaction(async (tx) => {
      // Rechnungen mit GDPR-Restriction versehen
      const updateResults = await Promise.all(
        rechnungIds.map(async (rechnungId: string) => {
          const rechnung = await tx.rechnung.findUnique({
            where: { id: rechnungId },
          })

          if (!rechnung) {
            return { rechnungId, success: false, error: 'Nicht gefunden' }
          }

          // Bereits eingeschränkt?
          if (rechnung.gdprRestricted) {
            return { rechnungId, success: false, error: 'Bereits eingeschränkt' }
          }

          // Einschränkung aktivieren
          await tx.rechnung.update({
            where: { id: rechnungId },
            data: {
              gdprRestricted: true,
              gdprRestrictedAt: now,
              gdprRestrictedBy: user.id,
              gdprRequestId: gdprRequestId,
            },
          })

          // Audit-Log für Rechnung
          await tx.rechnungAuditLog.create({
            data: {
              rechnungId,
              action: 'GDPR_RESTRICTION',
              field: 'gdprRestricted',
              oldValue: 'false',
              newValue: 'true',
              userId: user.id,
              userName: user.name,
            },
          })

          return { rechnungId, nummer: rechnung.nummer, success: true }
        })
      )

      // GDPR-Request aktualisieren
      const statusHistory = (gdprRequest.statusHistory as Record<string, unknown>[] || [])
      statusHistory.push({
        status: 'EINSCHRAENKUNG_ANGEWANDT',
        changedAt: now.toISOString(),
        changedBy: user.id,
        reason: reason || 'GoBD-Konflikt: Einschränkung statt Löschung',
        affectedRechnungen: rechnungIds.length,
      })

      await tx.gdprRequest.update({
        where: { id: gdprRequestId },
        data: {
          gobdConflict: true,
          restrictionApplied: true,
          statusHistory,
          // Nur wenn noch nicht abgeschlossen
          ...(gdprRequest.status === 'IN_PRUEFUNG' ? { status: 'UMGESETZT' } : {}),
        },
      })

      // GDPR-Audit-Log
      await tx.gdprRequestAuditLog.create({
        data: {
          requestId: gdprRequestId,
          action: 'RESTRICTION_APPLIED',
          newValue: JSON.stringify({
            rechnungIds,
            reason: reason || 'GoBD-Konflikt',
          }),
          performedBy: user.id,
          performedByName: user.name,
        },
      })

      return updateResults
    })

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Einschränkung angewandt auf ${successCount} Rechnung(en)`,
      success: successCount,
      failed: failedCount,
      details: results,
      gdprRequestId,
      note: 'GoBD-Aufbewahrungspflicht: Daten bleiben für 10 Jahre erhalten, Zugriff ist eingeschränkt.',
    })
  } catch (error) {
    console.error('GDPR Restrict error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: Einschränkung aufheben (nur in Ausnahmefällen, z.B. bei Fehler)
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const rechnungId = searchParams.get('rechnungId')
    const reason = searchParams.get('reason')

    if (!rechnungId) {
      return NextResponse.json({ error: 'rechnungId Parameter fehlt' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Begründung (reason) ist Pflicht für Aufhebung der Einschränkung' },
        { status: 400 }
      )
    }

    const rechnung = await prisma.rechnung.findUnique({
      where: { id: rechnungId },
    })

    if (!rechnung) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    if (!rechnung.gdprRestricted) {
      return NextResponse.json({ error: 'Rechnung ist nicht eingeschränkt' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.rechnung.update({
        where: { id: rechnungId },
        data: {
          gdprRestricted: false,
          // Timestamps bleiben für Audit erhalten
        },
      })

      await tx.rechnungAuditLog.create({
        data: {
          rechnungId,
          action: 'GDPR_RESTRICTION_LIFTED',
          field: 'gdprRestricted',
          oldValue: 'true',
          newValue: 'false',
          userId: user.id,
          userName: user.name,
        },
      })
    })

    return NextResponse.json({
      message: 'Einschränkung aufgehoben',
      rechnungId,
      reason,
      liftedBy: user.name,
      liftedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GDPR Restrict DELETE error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
