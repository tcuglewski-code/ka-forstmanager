/**
 * GET /api/sessions - List all active sessions of current user (Sprint KK)
 * Shows device list for security overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeviceIcon, anonymizeIp } from '@/lib/device-parser';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Get current session token from cookie for marking current session
    const currentToken = req.cookies.get('session-token')?.value;

    // Fetch all non-revoked, non-expired sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceType: true,
        deviceName: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
        token: true, // Need for comparison (not exposed)
      },
    });

    // Format sessions for response (anonymize IPs, mark current)
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      deviceType: s.deviceType || 'desktop',
      deviceName: s.deviceName || 'Unbekanntes Gerät',
      deviceIcon: getDeviceIcon(s.deviceType || 'desktop'),
      ipAddress: anonymizeIp(s.ipAddress),
      lastActiveAt: s.lastActiveAt?.toISOString() || s.createdAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      isCurrent: s.token === currentToken,
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error('Sessions list error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Sitzungen' },
      { status: 500 }
    );
  }
}
