/**
 * KPI Snapshot Cron
 * Sprint KM — FF-01/KP-01
 * 
 * Creates daily KPI snapshots at midnight.
 * Also creates weekly (Sundays) and monthly (1st) snapshots.
 * 
 * Schedule: Daily at 00:15 UTC (via vercel.json)
 * 
 * @security Vercel Cron protection via CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createKpiSnapshot } from '@/lib/kpi-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results: string[] = [];

    // Always create daily snapshot for yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    await createKpiSnapshot(yesterday, yesterdayEnd, 'daily');
    results.push('daily');

    // Weekly snapshot on Sundays (for the past week)
    if (now.getDay() === 0) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - 1);
      weekEnd.setHours(23, 59, 59, 999);
      
      await createKpiSnapshot(weekStart, weekEnd, 'weekly');
      results.push('weekly');
    }

    // Monthly snapshot on 1st of month (for previous month)
    if (now.getDate() === 1) {
      const monthEnd = new Date(now);
      monthEnd.setDate(0); // Last day of previous month
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthStart = new Date(monthEnd);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      await createKpiSnapshot(monthStart, monthEnd, 'monthly');
      results.push('monthly');
    }

    console.log(`[KPI Cron] Created snapshots: ${results.join(', ')}`);

    return NextResponse.json({
      success: true,
      snapshots: results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[KPI Cron] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create KPI snapshot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
