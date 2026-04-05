/**
 * Business KPIs Admin API
 * Sprint KM — FF-01/KP-01
 * 
 * GET - Get KPI dashboard data
 *   ?period=daily|weekly|monthly
 *   ?history=true (get historical data)
 *   ?calculate=true (recalculate now)
 * 
 * Requires: ka_admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  calculateKpis,
  createKpiSnapshot,
  getLatestKpiSnapshot,
  getKpiHistory,
  getPeriodBoundaries,
  type KpiPeriodType,
} from '@/lib/kpi-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ka_admin', 'super_admin'].includes((session.user as { role?: string }).role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get('period') || 'daily') as KpiPeriodType;
    const getHistory = searchParams.get('history') === 'true';
    const recalculate = searchParams.get('calculate') === 'true';

    // Validate period type
    if (!['daily', 'weekly', 'monthly'].includes(periodType)) {
      return NextResponse.json(
        { error: 'Invalid period type. Use: daily, weekly, monthly' },
        { status: 400 }
      );
    }

    // Recalculate if requested
    if (recalculate) {
      const { start, end } = getPeriodBoundaries(periodType);
      await createKpiSnapshot(start, end, periodType);
    }

    // Get latest snapshot
    const latest = await getLatestKpiSnapshot(periodType);

    // Get history if requested
    let history: Awaited<ReturnType<typeof getKpiHistory>> | undefined;
    if (getHistory) {
      history = await getKpiHistory(periodType, 30);
    }

    // If no snapshot exists, calculate live
    let liveMetrics = null;
    if (!latest) {
      const { start, end } = getPeriodBoundaries(periodType);
      liveMetrics = await calculateKpis(start, end);
    }

    return NextResponse.json({
      period: periodType,
      current: latest || liveMetrics,
      history: history || [],
      metadata: {
        lastCalculated: latest?.createdAt || new Date(),
        isLive: !latest,
      },
    });
  } catch (error) {
    console.error('[KPIs] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ka_admin', 'super_admin'].includes((session.user as { role?: string }).role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { periodType = 'daily' } = body;

    // Validate period type
    if (!['daily', 'weekly', 'monthly'].includes(periodType)) {
      return NextResponse.json(
        { error: 'Invalid period type' },
        { status: 400 }
      );
    }

    // Create snapshot
    const { start, end } = getPeriodBoundaries(periodType as KpiPeriodType);
    await createKpiSnapshot(start, end, periodType as KpiPeriodType);

    const snapshot = await getLatestKpiSnapshot(periodType as KpiPeriodType);

    return NextResponse.json({
      message: 'KPI snapshot created',
      snapshot,
    });
  } catch (error) {
    console.error('[KPIs] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
