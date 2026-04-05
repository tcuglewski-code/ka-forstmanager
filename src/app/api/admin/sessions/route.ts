/**
 * GET /api/admin/sessions - Admin: List all active sessions across all users (Sprint KK)
 * Overview for security monitoring
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

    // Only admins can view all sessions
    const adminRoles = ['ka_admin', 'admin'];
    if (!adminRoles.includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Nur Administratoren' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get all active sessions with user info
    const [sessions, totalCount, userStats] = await Promise.all([
      prisma.session.findMany({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { lastActiveAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.session.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
      // Get user counts
      prisma.session.groupBy({
        by: ['userId'],
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        _count: true,
      }),
    ]);

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.name || 'Unbekannt',
      userEmail: s.user.email,
      userRole: s.user.role,
      deviceType: s.deviceType || 'desktop',
      deviceName: s.deviceName || 'Unbekanntes Gerät',
      deviceIcon: getDeviceIcon(s.deviceType || 'desktop'),
      ipAddress: anonymizeIp(s.ipAddress),
      lastActiveAt: s.lastActiveAt?.toISOString() || s.createdAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalActiveSessions: totalCount,
        uniqueUsers: userStats.length,
        avgSessionsPerUser: userStats.length > 0 
          ? (totalCount / userStats.length).toFixed(1) 
          : '0',
      },
    });
  } catch (error) {
    console.error('Admin sessions list error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Sitzungen' },
      { status: 500 }
    );
  }
}
