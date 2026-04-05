/**
 * POST /api/admin/sessions/user/[userId]/invalidate - Admin: Invalidate all sessions of a user (Sprint KK)
 * Security feature for compromised accounts or employee termination
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Only admins can invalidate other users' sessions
    const adminRoles = ['ka_admin', 'admin'];
    if (!adminRoles.includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Nur Administratoren können Sitzungen anderer Benutzer beenden' },
        { status: 403 }
      );
    }

    const targetUserId = params.userId;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Get reason from request body (optional)
    let reason = 'Admin-Aktion';
    try {
      const body = await req.json();
      if (body.reason) {
        reason = body.reason;
      }
    } catch {
      // No body is fine
    }

    // Count active sessions before invalidation
    const activeSessionCount = await prisma.session.count({
      where: {
        userId: targetUserId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    // Invalidate all sessions for this user
    const result = await prisma.session.updateMany({
      where: {
        userId: targetUserId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedBy: session.user.id,
      },
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        action: 'ADMIN_INVALIDATE_SESSIONS',
        entityType: 'user',
        entityId: targetUserId,
        entityName: targetUser.name || targetUser.email,
        userId: session.user.id,
        metadata: JSON.stringify({
          reason,
          sessionsInvalidated: result.count,
          adminUser: session.user.email,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} Sitzung(en) für ${targetUser.name || targetUser.email} beendet`,
      invalidatedCount: result.count,
      previousActiveCount: activeSessionCount,
    });
  } catch (error) {
    console.error('Admin session invalidation error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Beenden der Sitzungen' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sessions/user/[userId]/invalidate - Get session count for a user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Only admins can view other users' session info
    const adminRoles = ['ka_admin', 'admin'];
    if (!adminRoles.includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Nur Administratoren' },
        { status: 403 }
      );
    }

    const targetUserId = params.userId;

    const [activeCount, totalCount, lastSession] = await Promise.all([
      prisma.session.count({
        where: {
          userId: targetUserId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.session.count({
        where: { userId: targetUserId },
      }),
      prisma.session.findFirst({
        where: { userId: targetUserId },
        orderBy: { lastActiveAt: 'desc' },
        select: {
          lastActiveAt: true,
          deviceName: true,
          deviceType: true,
        },
      }),
    ]);

    return NextResponse.json({
      userId: targetUserId,
      activeSessions: activeCount,
      totalSessions: totalCount,
      lastSession: lastSession
        ? {
            lastActiveAt: lastSession.lastActiveAt?.toISOString(),
            deviceName: lastSession.deviceName,
            deviceType: lastSession.deviceType,
          }
        : null,
    });
  } catch (error) {
    console.error('Admin session info error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Sitzungsinformationen' },
      { status: 500 }
    );
  }
}
