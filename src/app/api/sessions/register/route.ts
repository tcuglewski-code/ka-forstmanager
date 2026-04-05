/**
 * POST /api/sessions/register - Register a new session with device info (Sprint KK)
 * Called after successful NextAuth login to track devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { parseUserAgent } from '@/lib/device-parser';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Extract device info from request
    const userAgent = req.headers.get('user-agent') || undefined;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'Unbekannt';

    const deviceInfo = parseUserAgent(userAgent);
    const sessionToken = randomBytes(32).toString('hex');

    // Create session record for device tracking
    const newSession = await prisma.session.create({
      data: {
        userId: session.user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        userAgent: userAgent,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        ipAddress: ipAddress,
        lastActiveAt: new Date(),
      },
    });

    // Set session token in cookie for tracking current session
    const response = NextResponse.json({
      success: true,
      sessionId: newSession.id,
      deviceName: deviceInfo.deviceName,
    });

    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session register error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Registrieren der Sitzung' },
      { status: 500 }
    );
  }
}
