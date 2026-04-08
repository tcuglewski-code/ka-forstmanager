/**
 * DSGVO Art. 15 Datenexport API (Sprint MQ: IMPL-LC-02)
 *
 * Exportiert alle personenbezogenen Daten eines Users als JSON.
 * Zugriff: nur eigene Daten oder Admin-Rolle.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId') || user.id

    // Auth: nur eigene Daten oder Admin
    if (targetUserId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Profil
    const dbUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        notifyMaengel: true,
        notifyAuftraege: true,
        notifyAbnahmen: true,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Mitarbeiter-Daten
    const mitarbeiter = await prisma.mitarbeiter.findFirst({
      where: { userId: targetUserId },
      select: {
        id: true,
        vorname: true,
        nachname: true,
        email: true,
        telefon: true,
        mobil: true,
        adresse: true,
        plz: true,
        ort: true,
        geburtsdatum: true,
        eintrittsdatum: true,
        austrittsdatum: true,
        stundenlohn: true,
        notfallName: true,
        notfallTelefon: true,
        notfallBeziehung: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Zeiterfassungen (Stundeneinträge)
    const stundeneintraege = await prisma.stundeneintrag.findMany({
      where: mitarbeiter ? { mitarbeiterId: mitarbeiter.id } : { id: '__none__' },
      select: {
        id: true,
        datum: true,
        stunden: true,
        typ: true,
        stundensatz: true,
        maschinenBonus: true,
        createdAt: true,
      },
      orderBy: { datum: 'desc' },
    })

    // Tagesprotokolle mit GPS-Daten
    const tagesprotokolle = await prisma.tagesprotokoll.findMany({
      where: { erstellerId: targetUserId },
      select: {
        id: true,
        datum: true,
        ersteller: true,
        arbeitsbeginn: true,
        arbeitsende: true,
        pauseMinuten: true,
        flaecheBearbeitetHa: true,
        abschnitt: true,
        gpsStartLat: true,
        gpsStartLon: true,
        gpsEndLat: true,
        gpsEndLon: true,
        gpsTrack: true,
        createdAt: true,
      },
      orderBy: { datum: 'desc' },
    })

    // Sessions (Audit-Log Charakter)
    const sessions = await prisma.session.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        deviceType: true,
        deviceName: true,
        lastActiveAt: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // AGB-Zustimmungen
    const agreements = await prisma.userAgreement.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        agreementType: true,
        agreementVersion: true,
        acceptedAt: true,
      },
      orderBy: { acceptedAt: 'desc' },
    })

    // PD Access Log (eigene Zugriffe)
    const accessLogs = await prisma.pdAccessLog.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        resource: true,
        action: true,
        endpoint: true,
        statusCode: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const exportDate = new Date().toISOString().split('T')[0]
    const exportData = {
      _meta: {
        exportType: 'DSGVO Art. 15 Auskunft',
        exportDate: new Date().toISOString(),
        userId: targetUserId,
        requestedBy: user.id,
      },
      profil: dbUser,
      mitarbeiter: mitarbeiter ?? null,
      zeiterfassung: stundeneintraege,
      tagesprotokolle_mit_gps: tagesprotokolle,
      sessions,
      agb_zustimmungen: agreements,
      zugriffsprotokolle: accessLogs,
    }

    const filename = `dsgvo-export-${targetUserId}-${exportDate}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('GDPR Export error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
