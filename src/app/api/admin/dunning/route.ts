/**
 * Admin Dunning API (Sprint KH PO-04)
 * 
 * GET: Liste aller Tenants mit Dunning-Problemen
 * POST: Manuell Tenant entsperren / Dunning-Reset
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Liste Tenants mit Dunning-Status
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['ka_admin', 'super_admin'].includes((session.user as { role?: string }).role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status'); // 'all', 'pending', 'suspended'

  try {
    // Get tenants with dunning issues
    const whereClause: Record<string, unknown> = {};
    
    if (status === 'suspended') {
      whereClause.status = 'payment_suspended';
    } else if (status === 'pending') {
      whereClause.dunningCurrentAttempt = { gt: 0 };
      whereClause.status = { not: 'payment_suspended' };
    } else {
      // 'all' - any dunning activity
      whereClause.OR = [
        { dunningCurrentAttempt: { gt: 0 } },
        { status: 'payment_suspended' },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        status: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        dunningMaxRetries: true,
        dunningGraceDays: true,
        dunningCurrentAttempt: true,
        dunningFirstFailedAt: true,
        dunningLastFailedAt: true,
        dunningLastNotifyAt: true,
        dunningResolvedAt: true,
        paymentSuspendedAt: true,
        dunningRecords: {
          orderBy: { failedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            stripeInvoiceId: true,
            amount: true,
            attemptNumber: true,
            failureCode: true,
            failureMessage: true,
            status: true,
            failedAt: true,
            nextRetryAt: true,
            notificationsSent: true,
          },
        },
      },
      orderBy: { dunningFirstFailedAt: 'desc' },
    });

    // Calculate days until suspension for each tenant
    const now = new Date();
    const tenantsWithDays = tenants.map(tenant => {
      let daysUntilSuspension: number | null = null;
      let daysSinceFirstFailure: number | null = null;

      if (tenant.dunningFirstFailedAt && tenant.status !== 'payment_suspended') {
        daysSinceFirstFailure = Math.floor(
          (now.getTime() - tenant.dunningFirstFailedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (tenant.dunningCurrentAttempt >= tenant.dunningMaxRetries) {
          daysUntilSuspension = Math.max(0, tenant.dunningGraceDays - daysSinceFirstFailure);
        }
      }

      return {
        ...tenant,
        daysSinceFirstFailure,
        daysUntilSuspension,
      };
    });

    // Summary stats
    const stats = {
      totalWithIssues: tenants.length,
      suspended: tenants.filter(t => t.status === 'payment_suspended').length,
      pendingSuspension: tenants.filter(t => 
        t.status !== 'payment_suspended' && 
        t.dunningCurrentAttempt >= t.dunningMaxRetries
      ).length,
      inRetry: tenants.filter(t => 
        t.dunningCurrentAttempt > 0 && 
        t.dunningCurrentAttempt < t.dunningMaxRetries
      ).length,
    };

    return NextResponse.json({
      success: true,
      stats,
      tenants: tenantsWithDays,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Admin Dunning GET] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Manuell entsperren oder Dunning zurücksetzen
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['ka_admin', 'super_admin'].includes((session.user as { role?: string }).role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tenantId, action, note } = body as {
      tenantId: string;
      action: 'unsuspend' | 'reset' | 'suspend';
      note?: string;
    };

    if (!tenantId || !action) {
      return NextResponse.json(
        { error: 'tenantId and action required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const now = new Date();
    let result: Record<string, unknown> = {};

    switch (action) {
      case 'unsuspend':
        // Manuell entsperren (z.B. nach manuellem Zahlungseingang)
        if (tenant.status !== 'payment_suspended') {
          return NextResponse.json(
            { error: 'Tenant is not suspended' },
            { status: 400 }
          );
        }

        await prisma.$transaction([
          prisma.tenant.update({
            where: { id: tenantId },
            data: {
              status: 'active',
              dunningCurrentAttempt: 0,
              dunningFirstFailedAt: null,
              dunningLastFailedAt: null,
              dunningResolvedAt: now,
              paymentSuspendedAt: null,
            },
          }),
          prisma.dunningRecord.updateMany({
            where: {
              tenantId,
              status: { in: ['pending', 'suspended'] },
            },
            data: {
              status: 'resolved',
              resolvedAt: now,
            },
          }),
          prisma.activityLog.create({
            data: {
              action: 'TENANT_UNSUSPENDED',
              entityType: 'tenant',
              entityId: tenantId,
              entityName: `Tenant ${tenant.name} manuell entsperrt`,
              userId: (session.user as { id?: string }).id || 'unknown',
              metadata: JSON.stringify({
                note: note || 'Manuelle Entsperrung durch Admin',
                adminUser: (session.user as { email?: string }).email,
              }),
            },
          }),
        ]);

        result = { success: true, message: `Tenant ${tenant.slug} entsperrt` };
        break;

      case 'reset':
        // Dunning-Zähler zurücksetzen (z.B. nach Kartenaktualisierung)
        await prisma.$transaction([
          prisma.tenant.update({
            where: { id: tenantId },
            data: {
              dunningCurrentAttempt: 0,
              dunningFirstFailedAt: null,
              dunningLastFailedAt: null,
              dunningLastNotifyAt: null,
              dunningResolvedAt: now,
            },
          }),
          prisma.dunningRecord.updateMany({
            where: {
              tenantId,
              status: 'pending',
            },
            data: {
              status: 'resolved',
              resolvedAt: now,
            },
          }),
          prisma.activityLog.create({
            data: {
              action: 'DUNNING_RESET',
              entityType: 'tenant',
              entityId: tenantId,
              entityName: `Dunning für ${tenant.name} zurückgesetzt`,
              userId: (session.user as { id?: string }).id || 'unknown',
              metadata: JSON.stringify({
                note: note || 'Manueller Reset durch Admin',
                previousAttempts: tenant.dunningCurrentAttempt,
              }),
            },
          }),
        ]);

        result = { success: true, message: `Dunning für ${tenant.slug} zurückgesetzt` };
        break;

      case 'suspend':
        // Manuell sperren (z.B. bei Betrugsverdacht)
        if (tenant.status === 'payment_suspended') {
          return NextResponse.json(
            { error: 'Tenant is already suspended' },
            { status: 400 }
          );
        }

        await prisma.$transaction([
          prisma.tenant.update({
            where: { id: tenantId },
            data: {
              status: 'payment_suspended',
              paymentSuspendedAt: now,
            },
          }),
          prisma.activityLog.create({
            data: {
              action: 'TENANT_MANUALLY_SUSPENDED',
              entityType: 'tenant',
              entityId: tenantId,
              entityName: `Tenant ${tenant.name} manuell gesperrt`,
              userId: (session.user as { id?: string }).id || 'unknown',
              metadata: JSON.stringify({
                note: note || 'Manuelle Sperrung durch Admin',
                reason: 'manual',
              }),
            },
          }),
        ]);

        result = { success: true, message: `Tenant ${tenant.slug} gesperrt` };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: unsuspend, reset, suspend' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Admin Dunning POST] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
