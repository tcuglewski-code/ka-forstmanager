import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"
// Sprint FW (E5): Email bei Freigabe
import { sendEmail, rechnungEmailHtml } from "@/lib/email"
import { sendKANotification } from "@/lib/telegram-notify"

// Sprint GB-01: GoBD-Compliance-Konstanten
const GOBD_LOCK_HOURS = 24 // Rechnungen werden nach 24h automatisch gesperrt
const LOCK_ERROR = { 
  error: "GoBD: Diese Rechnung ist gesperrt und kann nicht mehr geändert werden",
  code: "GOBD_LOCKED" 
}

/**
 * Sprint GB-01: Prüft ob eine Rechnung GoBD-gesperrt ist
 * Eine Rechnung ist gesperrt wenn:
 * - lockedAt gesetzt ist ODER
 * - createdAt älter als GOBD_LOCK_HOURS ist
 */
function isRechnungLocked(rechnung: { lockedAt: Date | null; createdAt: Date }): boolean {
  if (rechnung.lockedAt) return true
  
  const lockThreshold = new Date()
  lockThreshold.setHours(lockThreshold.getHours() - GOBD_LOCK_HOURS)
  
  return rechnung.createdAt < lockThreshold
}

/**
 * Sprint GB-03: Erstellt eine Versions-Snapshot vor Änderung
 * Speichert den kompletten Zustand der Rechnung inkl. Positionen
 */
async function createVersionSnapshot(
  rechnung: any,
  userId: string | null,
  userName: string | null,
  aenderungsgrund?: string
) {
  try {
    // Höchste bestehende Versionsnummer ermitteln
    const lastVersion = await prisma.rechnungVersion.findFirst({
      where: { rechnungId: rechnung.id },
      orderBy: { versionNummer: 'desc' },
    })
    
    const nextVersion = (lastVersion?.versionNummer ?? 0) + 1
    
    // Positionen laden falls nicht im Objekt enthalten
    let positionen = rechnung.positionen
    if (!positionen) {
      const rechnungMitPositionen = await prisma.rechnung.findUnique({
        where: { id: rechnung.id },
        include: { positionen: true },
      })
      positionen = rechnungMitPositionen?.positionen ?? []
    }
    
    await prisma.rechnungVersion.create({
      data: {
        rechnungId: rechnung.id,
        versionNummer: nextVersion,
        nummer: rechnung.nummer,
        betrag: rechnung.betrag,
        mwst: rechnung.mwst,
        status: rechnung.status,
        rechnungsDatum: rechnung.rechnungsDatum,
        faelligAm: rechnung.faelligAm,
        pdfUrl: rechnung.pdfUrl,
        notizen: rechnung.notizen,
        rabatt: rechnung.rabatt,
        rabattBetrag: rechnung.rabattBetrag,
        rabattGrund: rechnung.rabattGrund,
        nettoBetrag: rechnung.nettoBetrag,
        bruttoBetrag: rechnung.bruttoBetrag,
        zahlungsBedingung: rechnung.zahlungsBedingung,
        positionenSnapshot: positionen.map((p: any) => ({
          id: p.id,
          beschreibung: p.beschreibung,
          menge: p.menge,
          einheit: p.einheit,
          preisProEinheit: p.preisProEinheit,
          gesamt: p.gesamt,
          typ: p.typ,
        })),
        erstelltVon: userId,
        erstelltVonName: userName,
        aenderungsgrund,
      },
    })
    
    console.log(`[VERSION] Rechnung ${rechnung.nummer} - Version ${nextVersion} erstellt`)
    return nextVersion
  } catch (error) {
    console.error("[VERSION SNAPSHOT ERROR]", error)
    // Version-Fehler sollten den Hauptvorgang nicht blockieren
    return null
  }
}

/**
 * Sprint GB-01: Erstellt einen Audit-Log-Eintrag
 */
async function createAuditLog(
  rechnungId: string,
  action: string,
  userId: string | null,
  userName: string | null,
  field?: string,
  oldValue?: any,
  newValue?: any,
  req?: NextRequest
) {
  try {
    await prisma.rechnungAuditLog.create({
      data: {
        rechnungId,
        action,
        field,
        oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
        newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
        userId,
        userName,
        ip: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || null,
        userAgent: req?.headers.get('user-agent') || null,
      },
    })
  } catch (error) {
    console.error("[AUDIT LOG ERROR]", error)
    // Audit-Log-Fehler sollten den Hauptvorgang nicht blockieren
  }
}

/**
 * GET /api/rechnungen/[id]
 * Einzelne Rechnung abrufen mit verknüpftem Auftrag
 * Sprint GB-01: Enthält jetzt auch Lock-Status
 * Sprint GB-04: Soft-deleted Rechnungen werden mit Flag markiert
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  try {
    const { id } = await params
    const rechnung = await prisma.rechnung.findUnique({
      where: { id },
      include: {
        auftrag: {
          select: {
            id: true,
            titel: true,
            waldbesitzer: true,
            waldbesitzerEmail: true,
          },
        },
        positionen: true,
      },
    })
    
    if (!rechnung) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    
    // Sprint GB-04: Soft-deleted Rechnungen anzeigen mit Flag (für Admin-Archiv-Ansicht)
    const isDeleted = !!rechnung.deletedAt
    
    // Sprint GB-01: Lock-Status berechnen und mitsenden
    const isLocked = isRechnungLocked(rechnung)
    
    return NextResponse.json({
      ...rechnung,
      isLocked,
      isDeleted, // Sprint GB-04
      lockInfo: isLocked ? {
        lockedAt: rechnung.lockedAt || rechnung.createdAt,
        lockedBy: rechnung.lockedBy || 'SYSTEM',
        lockReason: rechnung.lockReason || 'GoBD-Compliance: Automatische Sperrung nach 24h',
      } : null,
      deleteInfo: isDeleted ? {
        deletedAt: rechnung.deletedAt,
        deletedBy: rechnung.deletedBy,
        retentionUntil: new Date(new Date(rechnung.deletedAt!).setFullYear(new Date(rechnung.deletedAt!).getFullYear() + 10)),
      } : null,
    })
  } catch (error) {
    console.error("[RECHNUNG GET]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

/**
 * DELETE /api/rechnungen/[id]
 * 
 * Sprint GB-04: GoBD 10-Jahres-Retention
 * - Hard-Delete ist NIEMALS erlaubt (GoBD-Compliance)
 * - DELETE setzt nur deletedAt (Soft-Delete)
 * - Physische Löschung erst nach 10 Jahren via Cron-Job
 * - Bereits gelöschte Rechnungen können nicht erneut gelöscht werden
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  
  try {
    const { id } = await params
    
    // Rechnung laden
    const rechnung = await prisma.rechnung.findUnique({ where: { id } })
    if (!rechnung) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    
    // Sprint GB-04: Bereits gelöschte Rechnungen können nicht erneut gelöscht werden
    if (rechnung.deletedAt) {
      return NextResponse.json({ 
        error: "Diese Rechnung wurde bereits gelöscht", 
        deletedAt: rechnung.deletedAt,
        code: "ALREADY_DELETED" 
      }, { status: 410 }) // 410 Gone
    }
    
    // Sprint GB-01: GoBD-gesperrte Rechnungen können nicht gelöscht werden
    if (isRechnungLocked(rechnung)) {
      await createAuditLog(
        id,
        'DELETE_ATTEMPT_BLOCKED',
        session.user?.id || null,
        session.user?.name || null,
        undefined, undefined, undefined, req
      )
      return NextResponse.json(LOCK_ERROR, { status: 423 }) // 423 Locked
    }
    
    // Sprint GB-04: Soft-Delete statt Hard-Delete
    // Physische Löschung erfolgt erst nach 10 Jahren via Cron
    const deletedRechnung = await prisma.rechnung.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user?.id || 'UNKNOWN',
      },
    })
    
    // Audit-Log für Soft-Delete
    await createAuditLog(
      id,
      'SOFT_DELETE',
      session.user?.id || null,
      session.user?.name || null,
      'deletedAt',
      null,
      deletedRechnung.deletedAt,
      req
    )
    
    console.log(`[RECHNUNG SOFT-DELETE] Rechnung ${rechnung.nummer} soft-deleted by ${session.user?.name}`)
    
    return NextResponse.json({ 
      ok: true, 
      message: "Rechnung wurde gelöscht (Soft-Delete). Physische Löschung erfolgt nach 10 Jahren gemäß GoBD.",
      deletedAt: deletedRechnung.deletedAt,
    })
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    console.error("[RECHNUNG DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  
  const { id } = await params
  const body = await req.json()
  
  // Sprint GB-01: Prüfe GoBD-Lock
  const aktuelleRechnung = await prisma.rechnung.findUnique({ where: { id } })
  if (!aktuelleRechnung) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  // FM-22: Status-Änderungen sind auch bei gesperrten Rechnungen erlaubt
  // GoBD sperrt nur den Rechnungsinhalt (Betrag, Positionen), nicht den Status-Workflow
  const ALLOWED_WHEN_LOCKED = ['status', 'paidAt', 'paidViaMittel']
  const bodyFields = Object.keys(body).filter(k => k !== 'aenderungsgrund')
  const isStatusChangeOnly = bodyFields.every(f => ALLOWED_WHEN_LOCKED.includes(f))

  if (isRechnungLocked(aktuelleRechnung) && !isStatusChangeOnly) {
    await createAuditLog(
      id,
      'UPDATE_ATTEMPT_BLOCKED',
      session.user?.id || null,
      session.user?.name || null,
      undefined, undefined, undefined, req
    )
    return NextResponse.json(LOCK_ERROR, { status: 423 })
  }

  // Sprint GB-03: Version-Snapshot VOR der Änderung erstellen
  if (!isRechnungLocked(aktuelleRechnung)) {
    await createVersionSnapshot(
      aktuelleRechnung,
      session.user?.id || null,
      session.user?.name || null,
      body.aenderungsgrund
    )
  }

  const updateData: Record<string, any> = {}
  const changes: Array<{ field: string; old: any; new: any }> = []

  if (body.status !== undefined && body.status !== aktuelleRechnung.status) {
    // FM-22: Status-Workflow validieren
    const validTransitions: Record<string, string[]> = {
      'entwurf': ['offen', 'storniert'],
      'offen': ['bezahlt', 'storniert', 'freigegeben', 'ueberfaellig'],
      'freigegeben': ['bezahlt', 'storniert', 'ueberfaellig'],
      'ueberfaellig': ['bezahlt', 'storniert'],
      'bezahlt': [], // Endstatus
      'storniert': [], // Endstatus
    }
    const allowed = validTransitions[aktuelleRechnung.status] ?? []
    if (!allowed.includes(body.status)) {
      return NextResponse.json({
        error: `Statuswechsel von '${aktuelleRechnung.status}' nach '${body.status}' nicht erlaubt`,
        code: 'INVALID_STATUS_TRANSITION',
      }, { status: 400 })
    }
    changes.push({ field: 'status', old: aktuelleRechnung.status, new: body.status })
    updateData.status = body.status

    // Automatisch paidAt setzen bei Statuswechsel zu bezahlt
    if (body.status === 'bezahlt' && !aktuelleRechnung.paidAt) {
      updateData.paidAt = new Date()
      changes.push({ field: 'paidAt', old: null, new: updateData.paidAt })
    }
  }
  if (body.paidViaMittel !== undefined && body.paidViaMittel !== aktuelleRechnung.paidViaMittel) {
    changes.push({ field: 'paidViaMittel', old: aktuelleRechnung.paidViaMittel, new: body.paidViaMittel })
    updateData.paidViaMittel = body.paidViaMittel
  }
  if (body.notizen !== undefined && body.notizen !== aktuelleRechnung.notizen) {
    changes.push({ field: 'notizen', old: aktuelleRechnung.notizen, new: body.notizen })
    updateData.notizen = body.notizen
  }
  if (body.pdfUrl !== undefined && body.pdfUrl !== aktuelleRechnung.pdfUrl) {
    changes.push({ field: 'pdfUrl', old: aktuelleRechnung.pdfUrl, new: body.pdfUrl })
    updateData.pdfUrl = body.pdfUrl
  }
  if (body.faelligAm !== undefined) {
    const newDate = new Date(body.faelligAm)
    if (aktuelleRechnung.faelligAm?.getTime() !== newDate.getTime()) {
      changes.push({ field: 'faelligAm', old: aktuelleRechnung.faelligAm, new: newDate })
      updateData.faelligAm = newDate
    }
  }
  
  const rechnung = await prisma.rechnung.update({
    where: { id },
    data: updateData,
    include: {
      auftrag: {
        select: {
          id: true,
          titel: true,
          waldbesitzer: true,
          waldbesitzerEmail: true,
        },
      },
    },
  })

  // Sprint GB-01: Audit-Log für alle Änderungen
  for (const change of changes) {
    await createAuditLog(
      id,
      'UPDATE',
      session.user?.id || null,
      session.user?.name || null,
      change.field,
      change.old,
      change.new,
      req
    )
  }

  // Sprint FW (E5): Email bei Freigabe senden
  if (body.status === "freigegeben" && rechnung.auftrag?.waldbesitzerEmail) {
    const emailHtml = rechnungEmailHtml({
      rechnungNummer: rechnung.nummer,
      kundenName: rechnung.auftrag.waldbesitzer ?? "Kunde",
      betrag: rechnung.betrag,
      faelligAm: rechnung.faelligAm?.toISOString(),
    })

    // Async Email senden (nicht blockierend)
    sendEmail({
      to: rechnung.auftrag.waldbesitzerEmail,
      subject: `Rechnung ${rechnung.nummer} - Koch Aufforstung GmbH`,
      html: emailHtml,
    }).catch(err => console.error("[Rechnung Email Fehler]", err))
  }

  // KA-Bot: Zahlung eingegangen (fire-and-forget)
  if (body.status === "bezahlt") {
    sendKANotification({
      event: "zahlung_eingegangen",
      data: { nummer: rechnung.nummer, betrag: String(rechnung.betrag) },
    }).catch(() => {})
  }

  return NextResponse.json({
    ...rechnung,
    isLocked: isRechnungLocked(rechnung),
  })
}

/**
 * PUT /api/rechnungen/[id]
 *
 * Erlaubt nachträgliche Bearbeitung einer Rechnung:
 * - rabatt (Prozent 0-100)
 * - rabattBetrag (absoluter Betrag, wird bei Angabe bevorzugt)
 * - rabattGrund (Text)
 * - zahlungsBedingung
 * - notizen
 * - status (entwurf → versendet → bezahlt → storniert)
 *
 * Sprint GB-01: GoBD-Lock-Check + Audit-Logging
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // Aktuelle Rechnung mit Positionen laden
  const aktuelleRechnung = await prisma.rechnung.findUnique({
    where: { id },
    include: { positionen: true },
  })

  if (!aktuelleRechnung) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  // Sprint GB-01: GoBD-Lock-Check
  if (isRechnungLocked(aktuelleRechnung)) {
    await createAuditLog(
      id,
      'UPDATE_ATTEMPT_BLOCKED',
      session.user?.id || null,
      session.user?.name || null,
      undefined, undefined, undefined, req
    )
    return NextResponse.json(LOCK_ERROR, { status: 423 })
  }

  // Sprint GB-03: Version-Snapshot VOR der Änderung erstellen
  await createVersionSnapshot(
    aktuelleRechnung,
    session.user?.id || null,
    session.user?.name || null,
    body.aenderungsgrund
  )

  // Stornierte Rechnung kann nicht mehr bearbeitet werden
  if (aktuelleRechnung.status === 'storniert' && body.status !== 'storniert') {
    return NextResponse.json({ error: "Stornierte Rechnung kann nicht bearbeitet werden" }, { status: 400 })
  }

  // MwSt-Satz: aus Body oder bestehende Rechnung
  const mwst = body.mwstSatz !== undefined ? body.mwstSatz : aktuelleRechnung.mwst

  // Nettobetrag aus Positionen berechnen
  const summePositionen = aktuelleRechnung.positionen.reduce(
    (s, p) => s + p.gesamt,
    0
  )

  // Nettobetrag: entweder aus Positionen oder beibehalten
  const nettoBetrag = summePositionen > 0 ? summePositionen : (aktuelleRechnung.nettoBetrag ?? aktuelleRechnung.betrag)

  // Rabatt bestimmen
  let rabatt = aktuelleRechnung.rabatt ?? 0
  let rabattBetrag = aktuelleRechnung.rabattBetrag ?? 0

  if (body.rabattBetrag !== undefined) {
    // Absoluter Betrag angegeben
    rabattBetrag = body.rabattBetrag
    rabatt = nettoBetrag > 0 ? (rabattBetrag / nettoBetrag) * 100 : 0
  } else if (body.rabatt !== undefined) {
    // Prozent angegeben
    rabatt = Math.min(100, Math.max(0, body.rabatt))
    rabattBetrag = nettoBetrag * (rabatt / 100)
  }

  const nettoNachRabatt = nettoBetrag - rabattBetrag
  // FM-23: MwSt korrekt berechnen (mwst ist Prozent, z.B. 19, nicht 0.19)
  const bruttoBetrag = nettoNachRabatt * (1 + mwst / 100)

  const updateData: Record<string, any> = {
    nettoBetrag,
    bruttoBetrag,
    betrag: bruttoBetrag,
    rabatt,
    rabattBetrag,
    mwst,
  }

  // Änderungen für Audit-Log sammeln
  const changes: Array<{ field: string; old: any; new: any }> = []
  
  if (body.rabattGrund !== undefined) {
    if (body.rabattGrund !== aktuelleRechnung.rabattGrund) {
      changes.push({ field: 'rabattGrund', old: aktuelleRechnung.rabattGrund, new: body.rabattGrund })
    }
    updateData.rabattGrund = body.rabattGrund
  }
  if (body.zahlungsBedingung !== undefined) {
    if (body.zahlungsBedingung !== aktuelleRechnung.zahlungsBedingung) {
      changes.push({ field: 'zahlungsBedingung', old: aktuelleRechnung.zahlungsBedingung, new: body.zahlungsBedingung })
    }
    updateData.zahlungsBedingung = body.zahlungsBedingung
  }
  if (body.notizen !== undefined) {
    if (body.notizen !== aktuelleRechnung.notizen) {
      changes.push({ field: 'notizen', old: aktuelleRechnung.notizen, new: body.notizen })
    }
    updateData.notizen = body.notizen
  }
  if (body.status !== undefined) {
    if (body.status !== aktuelleRechnung.status) {
      changes.push({ field: 'status', old: aktuelleRechnung.status, new: body.status })
    }
    updateData.status = body.status
  }
  if (body.faelligAm !== undefined) {
    const newDate = new Date(body.faelligAm)
    if (aktuelleRechnung.faelligAm?.getTime() !== newDate.getTime()) {
      changes.push({ field: 'faelligAm', old: aktuelleRechnung.faelligAm, new: newDate })
    }
    updateData.faelligAm = newDate
  }
  if (body.pdfUrl !== undefined) {
    if (body.pdfUrl !== aktuelleRechnung.pdfUrl) {
      changes.push({ field: 'pdfUrl', old: aktuelleRechnung.pdfUrl, new: body.pdfUrl })
    }
    updateData.pdfUrl = body.pdfUrl
  }
  
  // Numerische Änderungen tracken
  if (rabatt !== aktuelleRechnung.rabatt) {
    changes.push({ field: 'rabatt', old: aktuelleRechnung.rabatt, new: rabatt })
  }
  if (rabattBetrag !== aktuelleRechnung.rabattBetrag) {
    changes.push({ field: 'rabattBetrag', old: aktuelleRechnung.rabattBetrag, new: rabattBetrag })
  }

  const rechnung = await prisma.rechnung.update({
    where: { id },
    data: updateData,
    include: {
      positionen: true,
      auftrag: { select: { id: true, titel: true } },
    },
  })

  // Sprint GB-01: Audit-Log für alle Änderungen
  for (const change of changes) {
    await createAuditLog(
      id,
      'UPDATE',
      session.user?.id || null,
      session.user?.name || null,
      change.field,
      change.old,
      change.new,
      req
    )
  }

  // KA-Bot: Zahlung eingegangen (fire-and-forget)
  if (body.status === "bezahlt" && aktuelleRechnung.status !== "bezahlt") {
    sendKANotification({
      event: "zahlung_eingegangen",
      data: { nummer: aktuelleRechnung.nummer, betrag: String(bruttoBetrag) },
    }).catch(() => {})
  }

  return NextResponse.json({
    ...rechnung,
    isLocked: isRechnungLocked(rechnung),
  })
}
