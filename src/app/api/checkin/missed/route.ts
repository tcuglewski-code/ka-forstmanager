import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Push-Benachrichtigung Helper (TODO: in lib/notifications.ts auslagern)
async function sendPushToKoordinatoren(data: {
  title: string;
  body: string;
  data: Record<string, any>;
  pushToken: string;
}): Promise<boolean> {
  try {
    // Expo Push-API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.pushToken,
        title: data.title,
        body: data.body,
        data: data.data,
        sound: 'default',
        priority: 'high',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================
// POST /api/checkin/missed — Verpasstes Check-In melden
// Sprint JN — SOS-08: Check-In System
// 
// Wird aufgerufen wenn ein Mitarbeiter nicht auf die Check-In
// Aufforderung reagiert hat. Eskaliert an Koordinatoren.
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung (kann App-Token oder User-Token sein)
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, checkInId, timestamp } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId erforderlich' },
        { status: 400 }
      );
    }

    // Session laden
    const session = await prisma.alleinarbeitSession.findUnique({
      where: { sessionId },
      include: {
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob Session noch aktiv
    if (session.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: 'Session ist nicht mehr aktiv',
      });
    }

    // Missed Check-In in DB speichern
    if (checkInId) {
      await prisma.checkIn.upsert({
        where: { checkInId },
        create: {
          checkInId,
          alleinarbeitSessionId: session.id,
          mitarbeiterId: session.mitarbeiterId,
          type: 'auto_prompt',
          wasPrompted: true,
          status: 'missed',
          createdAt: timestamp ? new Date(timestamp) : new Date(),
        },
        update: {
          status: 'missed',
        },
      });
    }

    // Alert erstellen
    const alert = await prisma.alleinarbeitAlert.create({
      data: {
        alleinarbeitSessionId: session.id,
        mitarbeiterId: session.mitarbeiterId,
        mitarbeiterName: session.mitarbeiterName,
        alertType: 'missed_checkin',
        latitude: session.latitude,
        longitude: session.longitude,
        googleMapsLink: session.latitude && session.longitude
          ? `https://www.google.com/maps?q=${session.latitude},${session.longitude}`
          : null,
        einsatzName: session.einsatzName,
        status: 'active',
      },
    });

    console.log(`[CheckIn] MISSED ALERT: ${session.mitarbeiterName} (Session: ${sessionId})`);

    // Koordinatoren benachrichtigen
    let koordinatorenBenachrichtigt = 0;
    try {
      const koordinatoren = await prisma.mitarbeiter.findMany({
        where: {
          OR: [
            { rolle: 'koordinator' },
            { rolle: 'admin' },
            { rolle: 'gf' },
          ],
          aktiv: true,
        },
        select: {
          id: true,
          vorname: true,
          nachname: true,
          telefon: true,
          pushToken: true,
        },
      });

      // Push-Benachrichtigungen senden
      const pushPromises = koordinatoren
        .filter((k) => k.pushToken)
        .map(async (koordinator) => {
          try {
            await sendPushToKoordinatoren({
              title: '⚠️ Check-In verpasst!',
              body: `${session.mitarbeiterName} hat nicht geantwortet (${session.einsatzName || 'Unbekannter Einsatz'})`,
              data: {
                type: 'MISSED_CHECKIN',
                sessionId: session.sessionId,
                alertId: alert.id,
                latitude: session.latitude,
                longitude: session.longitude,
              },
              pushToken: koordinator.pushToken!,
            });
            return true;
          } catch {
            return false;
          }
        });

      const results = await Promise.all(pushPromises);
      koordinatorenBenachrichtigt = results.filter(Boolean).length;

      console.log(`[CheckIn] ${koordinatorenBenachrichtigt}/${koordinatoren.length} Koordinatoren benachrichtigt`);
    } catch (notifyError: any) {
      console.error('[CheckIn] Koordinator-Benachrichtigung fehlgeschlagen:', notifyError?.message);
    }

    // Session als "überprüfungsbedürftig" markieren
    await prisma.alleinarbeitSession.update({
      where: { id: session.id },
      data: {
        needsReview: true,
        lastAlertAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      alertId: alert.id,
      koordinatorenBenachrichtigt,
      message: 'Alert erstellt und Koordinatoren benachrichtigt',
      session: {
        sessionId: session.sessionId,
        mitarbeiterName: session.mitarbeiterName,
        latitude: session.latitude,
        longitude: session.longitude,
      },
    });
  } catch (error: any) {
    console.error('[CheckIn] MISSED POST Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// ─── GET: Aktive Alerts abrufen ──────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'active';

    const where: any = {};
    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const alerts = await prisma.alleinarbeitAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        alleinarbeitSession: {
          select: {
            sessionId: true,
            checkIntervalMin: true,
            startedAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      alerts: alerts.map((a) => ({
        id: a.id,
        sessionId: a.alleinarbeitSession?.sessionId,
        mitarbeiterId: a.mitarbeiterId,
        mitarbeiterName: a.mitarbeiterName,
        alertType: a.alertType,
        latitude: a.latitude,
        longitude: a.longitude,
        googleMapsLink: a.googleMapsLink,
        einsatzName: a.einsatzName,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        resolvedAt: a.resolvedAt?.toISOString(),
        resolvedBy: a.resolvedBy,
      })),
      activeCount: alerts.filter((a) => a.status === 'active').length,
    });
  } catch (error: any) {
    console.error('[CheckIn] MISSED GET Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
