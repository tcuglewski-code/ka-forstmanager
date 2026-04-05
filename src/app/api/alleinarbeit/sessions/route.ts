import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================================
// POST /api/alleinarbeit/sessions — Alleinarbeits-Session erstellen/aktualisieren
// GET /api/alleinarbeit/sessions — Aktive Sessions abrufen (für Koordinatoren)
// Sprint JN — SOS-07+08: Alleinarbeits-Modus + Check-In
// ============================================================

// ─── POST: Session erstellen/aktualisieren ───────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      mitarbeiterId,
      mitarbeiterName,
      einsatzId,
      einsatzName,
      checkIntervalMin,
      startedAt,
      endedAt,
      status,
      latitude,
      longitude,
    } = body;

    if (!sessionId || !mitarbeiterId) {
      return NextResponse.json(
        { error: 'sessionId und mitarbeiterId erforderlich' },
        { status: 400 }
      );
    }

    // Upsert: Session erstellen oder aktualisieren
    const session = await prisma.alleinarbeitSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        mitarbeiterId,
        mitarbeiterName,
        einsatzId,
        einsatzName,
        checkIntervalMin: checkIntervalMin || 45,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        endedAt: endedAt ? new Date(endedAt) : null,
        status: status || 'active',
        latitude,
        longitude,
      },
      update: {
        einsatzId,
        einsatzName,
        checkIntervalMin,
        endedAt: endedAt ? new Date(endedAt) : null,
        status,
        latitude,
        longitude,
        updatedAt: new Date(),
      },
    });

    // Bei neuer aktiver Session: Koordinatoren benachrichtigen (optional)
    if (status === 'active' && !endedAt) {
      console.log(`[Alleinarbeit] Neue Session gestartet: ${sessionId} (${mitarbeiterName})`);
      // TODO: Notification an Koordinatoren (implementieren in Sprint JP)
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionId: session.sessionId,
        mitarbeiterId: session.mitarbeiterId,
        mitarbeiterName: session.mitarbeiterName,
        status: session.status,
        startedAt: session.startedAt?.toISOString(),
        checkIntervalMin: session.checkIntervalMin,
      },
    });
  } catch (error: any) {
    console.error('[Alleinarbeit] POST Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// ─── GET: Aktive Sessions abrufen (für Koordinator-Dashboard) ─

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Nur aktive Sessions
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'active';
    const mitarbeiterIdParam = searchParams.get('mitarbeiterId');

    const where: any = {};
    
    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }
    
    if (mitarbeiterIdParam) {
      where.mitarbeiterId = parseInt(mitarbeiterIdParam, 10);
    }

    const sessions = await prisma.alleinarbeitSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: {
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Nur letzte 5 Check-Ins
        },
      },
    });

    // Check-In Status berechnen
    const sessionsWithStatus = sessions.map((session) => {
      const now = new Date();
      const lastCheckIn = session.checkIns[0]?.createdAt || session.startedAt;
      const checkIntervalMs = (session.checkIntervalMin || 45) * 60 * 1000;
      const nextCheckDue = lastCheckIn ? new Date(lastCheckIn.getTime() + checkIntervalMs) : null;
      const isOverdue = nextCheckDue ? now > nextCheckDue : false;
      const minutesOverdue = nextCheckDue ? Math.round((now.getTime() - nextCheckDue.getTime()) / 60000) : 0;

      return {
        id: session.id,
        sessionId: session.sessionId,
        mitarbeiterId: session.mitarbeiterId,
        mitarbeiterName: session.mitarbeiterName,
        einsatzId: session.einsatzId,
        einsatzName: session.einsatzName,
        checkIntervalMin: session.checkIntervalMin,
        startedAt: session.startedAt?.toISOString(),
        endedAt: session.endedAt?.toISOString(),
        status: session.status,
        latitude: session.latitude,
        longitude: session.longitude,
        lastCheckIn: lastCheckIn?.toISOString(),
        nextCheckDue: nextCheckDue?.toISOString(),
        isOverdue,
        minutesOverdue: isOverdue ? minutesOverdue : 0,
        checkInCount: session.checkIns.length,
        lastCheckIns: session.checkIns.map((c) => ({
          id: c.checkInId,
          type: c.type,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
        })),
        // Status für Dashboard-Anzeige
        displayStatus: session.status === 'ended'
          ? 'ended'
          : isOverdue
          ? 'overdue'
          : session.status === 'paused'
          ? 'paused'
          : 'ok',
      };
    });

    return NextResponse.json({
      success: true,
      sessions: sessionsWithStatus,
      total: sessionsWithStatus.length,
      activeCount: sessionsWithStatus.filter((s) => s.displayStatus === 'ok').length,
      overdueCount: sessionsWithStatus.filter((s) => s.displayStatus === 'overdue').length,
    });
  } catch (error: any) {
    console.error('[Alleinarbeit] GET Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
