/**
 * Admin API: Ungematchte Zahlungen
 * Sprint KF PO-01: Payment Reconciliation
 * 
 * GET: Liste aller ungematchten Zahlungen
 * PATCH: Manuelles Matching oder Ignorieren
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { markRechnungAsPaid } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Nur Admin oder Accountant (Read-Only)
  const role = session.user?.role as string;
  if (!role || !['ka_admin', 'accountant'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const unmatchedPayments = await prisma.unmatchedPayment.findMany({
      where: { status },
      orderBy: { stripePaidAt: 'desc' },
      take: limit,
    });

    // Statistiken
    const stats = await prisma.unmatchedPayment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
    });

    return NextResponse.json({
      payments: unmatchedPayments.map((p) => ({
        id: p.id,
        stripePaymentIntentId: p.stripePaymentIntentId,
        amount: p.amount / 100, // In Euro
        currency: p.currency,
        customerEmail: p.stripeCustomerEmail,
        stripeInvoiceId: p.stripeInvoiceId,
        paymentMethodType: p.paymentMethodType,
        attemptedMatches: p.attemptedMatches,
        status: p.status,
        stripePaidAt: p.stripePaidAt,
        createdAt: p.createdAt,
      })),
      stats: stats.reduce((acc, s) => {
        acc[s.status] = { count: s._count, totalEuro: (s._sum.amount || 0) / 100 };
        return acc;
      }, {} as Record<string, { count: number; totalEuro: number }>),
    });
  } catch (error) {
    console.error('[Admin Payments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Auth check - nur Admin
  const session = await auth();
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, action, rechnungId, note } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    const unmatched = await prisma.unmatchedPayment.findUnique({
      where: { id },
    });

    if (!unmatched) {
      return NextResponse.json({ error: 'Unmatched payment not found' }, { status: 404 });
    }

    if (unmatched.status !== 'pending') {
      return NextResponse.json({ error: 'Payment already resolved' }, { status: 400 });
    }

    if (action === 'match') {
      // Manuelles Matching mit Rechnung
      if (!rechnungId) {
        return NextResponse.json({ error: 'Missing rechnungId for match' }, { status: 400 });
      }

      const rechnung = await prisma.rechnung.findUnique({
        where: { id: rechnungId },
      });

      if (!rechnung) {
        return NextResponse.json({ error: 'Rechnung not found' }, { status: 404 });
      }

      // Mark Rechnung as paid
      await markRechnungAsPaid(
        rechnungId,
        unmatched.stripePaymentIntentId,
        unmatched.stripePaidAt
      );

      // Update PaymentRecord if exists
      await prisma.paymentRecord.updateMany({
        where: { stripePaymentIntentId: unmatched.stripePaymentIntentId },
        data: {
          rechnungId,
          matched: true,
          matchedAt: new Date(),
          matchMethod: 'manual',
        },
      });

      // Resolve unmatched payment
      await prisma.unmatchedPayment.update({
        where: { id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: session.user?.id || 'unknown',
          resolutionNote: note || `Manuell mit ${rechnung.nummer} verknüpft`,
        },
      });

      // Activity log
      await prisma.activityLog.create({
        data: {
          action: 'PAYMENT_MANUALLY_MATCHED',
          entityType: 'rechnung',
          entityId: rechnungId,
          entityName: rechnung.nummer,
          userId: session.user?.id || 'unknown',
          metadata: JSON.stringify({
            unmatchedPaymentId: id,
            paymentIntentId: unmatched.stripePaymentIntentId,
            amount: unmatched.amount / 100,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Zahlung mit Rechnung ${rechnung.nummer} verknüpft`,
      });
    } else if (action === 'ignore') {
      // Zahlung ignorieren (z.B. Testbuchung)
      await prisma.unmatchedPayment.update({
        where: { id },
        data: {
          status: 'ignored',
          resolvedAt: new Date(),
          resolvedBy: session.user?.id || 'unknown',
          resolutionNote: note || 'Manuell ignoriert',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Zahlung als ignoriert markiert',
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Admin Payments PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
