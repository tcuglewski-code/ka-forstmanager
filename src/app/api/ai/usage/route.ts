import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TENANT_ID = process.env.TENANT_ID || 'koch-aufforstung';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    let usage = await prisma.aiUsageLimit.findUnique({
      where: { tenantId: TENANT_ID },
    });

    if (!usage) {
      usage = await prisma.aiUsageLimit.create({
        data: {
          tenantId: TENANT_ID,
          tier: 'basis',
          monthlyLimit: 500,
          currentUsage: 0,
          billingPeriodStart: new Date(),
        },
      });
    }

    return NextResponse.json({
      currentUsage: usage.currentUsage,
      monthlyLimit: usage.monthlyLimit,
      tier: usage.tier,
      billingPeriodStart: usage.billingPeriodStart,
    });
  } catch (error) {
    console.error('[AI Usage]', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
