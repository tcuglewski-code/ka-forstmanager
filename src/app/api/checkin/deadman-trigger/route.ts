import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-helpers';
import { triggerDeadManSwitch, processActiveAlerts } from '@/lib/deadman-switch';
import type { EskalationsStufe } from '@/lib/deadman-switch';

// ============================================================
// Dead Man's Switch API — Sprint JO (SOS-09+10)
//
// POST: Manueller Trigger für einen spezifischen Alert
// GET:  Prüft alle aktiven Alerts und eskaliert automatisch
// ============================================================

/**
 * POST /api/checkin/deadman-trigger
 * Triggert Dead Man's Switch für einen spezifischen Alert.
 */
export async function POST(request: NextRequest) {
  try {
    // Authentifizierung: App-Token oder User
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, sessionId, forceStufe, lastGps } = body;

    if (!alertId && !sessionId) {
      return NextResponse.json(
        { error: 'alertId oder sessionId erforderlich' },
        { status: 400 }
      );
    }

    // AlertId ermitteln wenn nur sessionId gegeben
    let targetAlertId = alertId;
    if (!targetAlertId && sessionId) {
      const { prisma } = await import('@/lib/prisma');
      const alert = await prisma.alleinarbeitAlert.findFirst({
        where: {
          alleinarbeitSession: { sessionId },
          status: { in: ['active', 'kritisch'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (alert) {
        targetAlertId = alert.id;

        // GPS aktualisieren wenn mitgeliefert
        if (lastGps?.latitude && lastGps?.longitude) {
          await prisma.alleinarbeitAlert.update({
            where: { id: alert.id },
            data: {
              latitude: lastGps.latitude,
              longitude: lastGps.longitude,
              googleMapsLink: `https://www.google.com/maps?q=${lastGps.latitude},${lastGps.longitude}`,
            },
          });
        }
      }
    }

    if (!targetAlertId) {
      return NextResponse.json(
        { error: 'Kein aktiver Alert gefunden' },
        { status: 404 }
      );
    }

    // Dead Man's Switch auslösen
    const result = await triggerDeadManSwitch(
      targetAlertId,
      forceStufe as EskalationsStufe | undefined
    );

    console.log(`[DeadMan] Trigger: Alert ${targetAlertId} → ${result.stufe}`);

    return NextResponse.json({
      success: result.success,
      alertId: targetAlertId,
      stufe: result.stufe,
      benachrichtigungen: result.benachrichtigungen,
      naechsteEskalation: result.naechsteEskalation,
      message: result.message,
    });
  } catch (error: any) {
    console.error('[DeadMan] POST Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkin/deadman-trigger
 * Cron-Endpoint: Prüft alle aktiven Alerts und eskaliert automatisch.
 * Sollte alle 1-2 Minuten aufgerufen werden.
 */
export async function GET(request: NextRequest) {
  try {
    // Cron-Auth via Header oder Query
    const { searchParams } = new URL(request.url);
    const cronSecret = request.headers.get('x-cron-secret') || searchParams.get('secret');
    
    // Für Vercel Cron: CRON_SECRET aus ENV
    const validSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
    
    // Alternativ: User-Auth für manuellen Aufruf
    const user = await verifyToken(request);
    
    if (cronSecret !== validSecret && !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Alle aktiven Alerts prüfen und eskalieren
    const result = await processActiveAlerts();

    console.log(`[DeadMan] Cron: ${result.processed} Alerts geprüft, ${result.eskaliert} eskaliert`);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      eskaliert: result.eskaliert,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[DeadMan] GET Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
