import { NextRequest, NextResponse } from 'next/server';
import { processActiveAlerts } from '@/lib/deadman-switch';

// ============================================================
// Dead Man's Switch Cron — Sprint JO (SOS-09+10)
//
// Prüft alle aktiven Alerts und eskaliert automatisch.
// Sollte alle 2 Minuten aufgerufen werden.
//
// Vercel Cron: vercel.json → crons
// ============================================================

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    // Cron-Auth via Header (Vercel Cron setzt diesen Header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Vercel Cron oder manueller Aufruf mit Secret
    const isVercelCron = authHeader === `Bearer ${cronSecret}`;
    const hasQuerySecret = request.nextUrl.searchParams.get('secret') === cronSecret;
    
    if (!isVercelCron && !hasQuerySecret && cronSecret) {
      console.log('[DeadMan Cron] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DeadMan Cron] Starting check...');
    
    const result = await processActiveAlerts();

    console.log(`[DeadMan Cron] Done: ${result.processed} checked, ${result.eskaliert} escalated`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed: result.processed,
      eskaliert: result.eskaliert,
    });
  } catch (error: any) {
    console.error('[DeadMan Cron] Error:', error?.message);
    return NextResponse.json(
      { error: 'Cron job failed', details: error?.message },
      { status: 500 }
    );
  }
}
