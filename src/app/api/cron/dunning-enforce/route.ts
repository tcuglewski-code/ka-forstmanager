/**
 * Dunning Enforcement Cron (Sprint KH PO-04)
 * 
 * Läuft täglich um 03:00 UTC und prüft:
 * 1. Tenants mit überfälligen Dunning-Status → payment_suspended
 * 2. Sendet Reminder-E-Mails bei anstehenden Sperren
 * 
 * Schedule: 0 3 * * * (täglich 03:00 UTC = 04:00/05:00 Berlin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cron authorization via CRON_SECRET
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[Cron dunning-enforce] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron dunning-enforce] Starting dunning enforcement check...');

  const now = new Date();
  let suspendedCount = 0;
  let reminderCount = 0;
  const results: string[] = [];

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. Find tenants that should be suspended
    // Criteria: dunningCurrentAttempt >= dunningMaxRetries 
    //           AND dunningFirstFailedAt + dunningGraceDays passed
    //           AND status is still active
    // ─────────────────────────────────────────────────────────────
    
    const tenantsToCheck = await prisma.tenant.findMany({
      where: {
        status: 'active',
        dunningCurrentAttempt: { gt: 0 },
        dunningFirstFailedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        dunningMaxRetries: true,
        dunningGraceDays: true,
        dunningCurrentAttempt: true,
        dunningFirstFailedAt: true,
        dunningLastNotifyAt: true,
      },
    });

    for (const tenant of tenantsToCheck) {
      if (!tenant.dunningFirstFailedAt) continue;

      const daysSinceFirst = Math.floor(
        (now.getTime() - tenant.dunningFirstFailedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if should be suspended
      if (
        tenant.dunningCurrentAttempt >= tenant.dunningMaxRetries &&
        daysSinceFirst >= tenant.dunningGraceDays
      ) {
        // Suspend tenant
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            status: 'payment_suspended',
            paymentSuspendedAt: now,
          },
        });

        // Update all pending dunning records
        await prisma.dunningRecord.updateMany({
          where: {
            tenantId: tenant.id,
            status: 'pending',
          },
          data: {
            status: 'suspended',
            suspendedAt: now,
          },
        });

        // Activity log
        await prisma.activityLog.create({
          data: {
            action: 'TENANT_PAYMENT_SUSPENDED',
            entityType: 'tenant',
            entityId: tenant.id,
            entityName: `Tenant ${tenant.name} nach ${daysSinceFirst} Tagen gesperrt`,
            metadata: JSON.stringify({
              attempts: tenant.dunningCurrentAttempt,
              graceDays: tenant.dunningGraceDays,
              daysSinceFirst,
              triggeredBy: 'cron',
            }),
          },
        });

        suspendedCount++;
        results.push(`SUSPENDED: ${tenant.slug} (${daysSinceFirst}d since first failure)`);

        console.log(
          `[Cron dunning-enforce] 🔒 Suspended tenant ${tenant.slug} after ${daysSinceFirst} days`
        );
      }
      
      // ─────────────────────────────────────────────────────────────
      // 2. Send reminder emails for impending suspensions
      // Reminder at: graceDays - 3, graceDays - 1
      // ─────────────────────────────────────────────────────────────
      else {
        const daysUntilSuspension = tenant.dunningGraceDays - daysSinceFirst;
        const shouldRemind = [3, 1].includes(daysUntilSuspension);
        
        // Check if we already sent a reminder today
        const lastNotify = tenant.dunningLastNotifyAt;
        const alreadyNotifiedToday = lastNotify && 
          lastNotify.toDateString() === now.toDateString();

        if (shouldRemind && !alreadyNotifiedToday && tenant.dunningCurrentAttempt >= tenant.dunningMaxRetries) {
          // Mark notification sent
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { dunningLastNotifyAt: now },
          });

          // Update dunning records notification count
          await prisma.dunningRecord.updateMany({
            where: {
              tenantId: tenant.id,
              status: 'pending',
            },
            data: {
              notificationsSent: { increment: 1 },
              lastNotificationAt: now,
            },
          });

          // Activity log (E-Mail würde hier gesendet werden)
          await prisma.activityLog.create({
            data: {
              action: 'DUNNING_REMINDER_SENT',
              entityType: 'tenant',
              entityId: tenant.id,
              entityName: `Mahnung: Sperre in ${daysUntilSuspension} Tag(en)`,
              metadata: JSON.stringify({
                daysUntilSuspension,
                contactEmail: tenant.contactEmail,
                attempts: tenant.dunningCurrentAttempt,
              }),
            },
          });

          reminderCount++;
          results.push(`REMINDER: ${tenant.slug} (${daysUntilSuspension}d until suspension)`);

          console.log(
            `[Cron dunning-enforce] 📧 Reminder sent for ${tenant.slug}: ${daysUntilSuspension} days until suspension`
          );

          // TODO: Send actual email via notification service
          // await sendDunningReminderEmail(tenant.contactEmail, {
          //   tenantName: tenant.name,
          //   daysUntilSuspension,
          //   invoiceUrl: '...',
          // });
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Clean up old resolved dunning records (>90 days)
    // ─────────────────────────────────────────────────────────────
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const deletedRecords = await prisma.dunningRecord.deleteMany({
      where: {
        status: 'resolved',
        resolvedAt: { lt: ninetyDaysAgo },
      },
    });

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      tenantsChecked: tenantsToCheck.length,
      suspendedCount,
      reminderCount,
      cleanedUpRecords: deletedRecords.count,
      details: results,
    };

    console.log('[Cron dunning-enforce] ✅ Completed:', JSON.stringify(summary));

    return NextResponse.json(summary);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron dunning-enforce] ❌ Error:', message);

    await prisma.activityLog.create({
      data: {
        action: 'CRON_ERROR',
        entityType: 'system',
        entityId: 'dunning-enforce',
        entityName: 'Dunning Enforcement Cron Fehler',
        metadata: JSON.stringify({ error: message }),
      },
    });

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
