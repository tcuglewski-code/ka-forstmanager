import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// ============================================================
// POST /api/checkin/status — Check-In melden
// Sprint JN — SOS-08: Check-In System
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();
    const {
      checkInId,
      alleinarbeitSessionId,
      mitarbeiterId,
      type,
      latitude,
      longitude,
      responseTimeSec,
      wasPrompted,
      status,
      createdAt,
    } = body;

    if (!checkInId || !alleinarbeitSessionId || !mitarbeiterId) {
      return NextResponse.json(
        { error: 'checkInId, alleinarbeitSessionId und mitarbeiterId erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob Session existiert
    const session = await prisma.alleinarbeitSession.findUnique({
      where: { sessionId: alleinarbeitSessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Alleinarbeits-Session nicht gefunden' },
        { status: 404 }
      );
    }

    // Check-In erstellen
    const checkIn = await prisma.checkIn.create({
      data: {
        checkInId,
        alleinarbeitSessionId: session.id,
        mitarbeiterId,
        type: type || 'manual',
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        responseTimeSec: responseTimeSec ?? null,
        wasPrompted: wasPrompted ?? false,
        status: status || 'ok',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    });

    // Session aktualisieren (lastCheckIn, nextCheckDue)
    const now = new Date();
    const checkIntervalMs = (session.checkIntervalMin || 45) * 60 * 1000;
    const nextCheckDue = new Date(now.getTime() + checkIntervalMs);

    await prisma.alleinarbeitSession.update({
      where: { id: session.id },
      data: {
        lastCheckIn: now,
        nextCheckDue,
        latitude: latitude ?? session.latitude,
        longitude: longitude ?? session.longitude,
        updatedAt: now,
      },
    });

    console.log(`[CheckIn] Erfolgreich: ${checkInId} (${type}) für MA ${mitarbeiterId}`);

    return NextResponse.json({
      success: true,
      checkIn: {
        id: checkIn.id,
        checkInId: checkIn.checkInId,
        type: checkIn.type,
        status: checkIn.status,
        createdAt: checkIn.createdAt.toISOString(),
      },
      nextCheckDue: nextCheckDue.toISOString(),
    });
  } catch (error: any) {
    console.error('[CheckIn] POST Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// ─── GET: Check-In Status einer Session abrufen ──────────────

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const mitarbeiterId = searchParams.get('mitarbeiterId');

    if (!sessionId && !mitarbeiterId) {
      return NextResponse.json(
        { error: 'sessionId oder mitarbeiterId erforderlich' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (sessionId) {
      const session = await prisma.alleinarbeitSession.findUnique({
        where: { sessionId },
      });
      if (session) {
        where.alleinarbeitSessionId = session.id;
      }
    }
    if (mitarbeiterId) {
      where.mitarbeiterId = parseInt(mitarbeiterId, 10);
    }

    const checkIns = await prisma.checkIn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        alleinarbeitSession: {
          select: {
            sessionId: true,
            mitarbeiterName: true,
            einsatzName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      checkIns: checkIns.map((c) => ({
        id: c.id,
        checkInId: c.checkInId,
        sessionId: c.alleinarbeitSession?.sessionId,
        mitarbeiterName: c.alleinarbeitSession?.mitarbeiterName,
        einsatzName: c.alleinarbeitSession?.einsatzName,
        type: c.type,
        status: c.status,
        latitude: c.latitude,
        longitude: c.longitude,
        responseTimeSec: c.responseTimeSec,
        wasPrompted: c.wasPrompted,
        createdAt: c.createdAt.toISOString(),
      })),
      total: checkIns.length,
    });
  } catch (error: any) {
    console.error('[CheckIn] GET Fehler:', error?.message);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
