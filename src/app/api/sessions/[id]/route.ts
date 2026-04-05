/**
 * DELETE /api/sessions/[id] - Revoke a specific session (Sprint KK)
 * User can revoke their own sessions (except current)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const sessionId = params.id;

    // Find the session
    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        token: true,
        revokedAt: true,
      },
    });

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Sitzung nicht gefunden' },
        { status: 404 }
      );
    }

    // Verify ownership - user can only revoke their own sessions
    if (targetSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Sitzung' },
        { status: 403 }
      );
    }

    // Check if already revoked
    if (targetSession.revokedAt) {
      return NextResponse.json(
        { error: 'Sitzung bereits beendet' },
        { status: 400 }
      );
    }

    // Check if trying to revoke current session
    const currentToken = req.cookies.get('session-token')?.value;
    if (targetSession.token === currentToken) {
      return NextResponse.json(
        { error: 'Aktuelle Sitzung kann nicht beendet werden. Nutze Abmelden.' },
        { status: 400 }
      );
    }

    // Revoke the session
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sitzung erfolgreich beendet',
    });
  } catch (error) {
    console.error('Session revoke error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Beenden der Sitzung' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[id] - Get details of a specific session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const targetSession = await prisma.session.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        deviceType: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Sitzung nicht gefunden' },
        { status: 404 }
      );
    }

    // Only owner can view their session details
    if (targetSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    return NextResponse.json({ session: targetSession });
  } catch (error) {
    console.error('Session detail error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Sitzung' },
      { status: 500 }
    );
  }
}
