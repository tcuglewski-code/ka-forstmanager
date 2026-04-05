/**
 * Feature Flags Evaluation API
 * Sprint KM — FF-01/KP-01
 * 
 * GET - Evaluate feature flags for current user
 *   ?keys=ki_assistent,offline_sync (specific flags)
 *   or get all enabled flags
 * 
 * POST - Evaluate a specific flag (with optional context)
 * 
 * Requires: Authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { evaluateFeatureFlag } from '@/lib/feature-flags';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keysParam = searchParams.get('keys');

    // Get specific flags or all flags
    let flagKeys: string[];
    
    if (keysParam) {
      flagKeys = keysParam.split(',').map(k => k.trim());
    } else {
      // Get all flag keys
      const allFlags = await prisma.featureFlag.findMany({
        select: { key: true },
      });
      flagKeys = allFlags.map(f => f.key);
    }

    // Evaluate each flag
    const results: Record<string, { enabled: boolean; variant?: string }> = {};
    
    await Promise.all(
      flagKeys.map(async (key) => {
        const result = await evaluateFeatureFlag(key, {
          userId: session.user.id,
          logUsage: true, // Track usage
        });
        results[key] = {
          enabled: result.enabled,
          variant: result.variant,
        };
      })
    );

    return NextResponse.json({
      flags: results,
      userId: session.user.id,
    });
  } catch (error) {
    console.error('[FeatureFlags] Evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, tenantId } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      );
    }

    const result = await evaluateFeatureFlag(key, {
      userId: session.user.id,
      tenantId,
      logUsage: true,
    });

    return NextResponse.json({
      key,
      ...result,
    });
  } catch (error) {
    console.error('[FeatureFlags] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
