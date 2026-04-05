/**
 * Feature Flags Admin API
 * Sprint KM — FF-01/KP-01
 *
 * GET   - List all feature flags (or single flag by ?key=...)
 * POST  - Create/update feature flag
 * PATCH - Update flag by key (body: { key, enabled?, percentage? })
 *
 * Requires: ka_admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAllFeatureFlags,
  upsertFeatureFlag,
  seedDefaultFeatureFlags,
} from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ka_admin', 'super_admin'].includes((session.user as { role?: string }).role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Single flag lookup by key (for useFeatureFlag hook)
    const keyParam = searchParams.get('key');
    if (keyParam) {
      const flag = await prisma.featureFlag.findUnique({
        where: { key: keyParam },
      });
      if (!flag) {
        return NextResponse.json({ enabled: false }, { status: 200 });
      }
      return NextResponse.json({
        enabled: flag.enabled,
        percentage: flag.percentage,
        key: flag.key,
      });
    }

    // Check if seed param is set (one-time setup)
    if (searchParams.get('seed') === 'true') {
      await seedDefaultFeatureFlags();
    }

    const flags = await getAllFeatureFlags();

    // Get override counts per flag
    const flagsWithStats = await Promise.all(
      flags.map(async (flag) => {
        const overrideCount = await prisma.featureFlagOverride.count({
          where: { featureFlagId: flag.id },
        });
        const usageCount = await prisma.featureUsageLog.count({
          where: {
            featureFlagId: flag.id,
            evaluatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
            },
          },
        });
        return {
          ...flag,
          _stats: {
            overrideCount,
            usageLast24h: usageCount,
          },
        };
      })
    );

    return NextResponse.json({
      flags: flagsWithStats,
      total: flags.length,
    });
  } catch (error) {
    console.error('[FeatureFlags] GET error:', error);
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
    const { key, name, description, type, enabled, percentage, variants, category, tags } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      );
    }

    // Validate key format (lowercase, underscores, no spaces)
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      return NextResponse.json(
        { error: 'Key must be lowercase, start with a letter, and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    const flag = await upsertFeatureFlag(key, {
      name: name || key,
      description,
      type: type || 'boolean',
      enabled: enabled ?? false,
      percentage: type === 'percentage' ? percentage : null,
      variants: type === 'variant' ? variants : null,
      category,
      tags: tags || [],
      createdBy: session.user.id,
    });

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('[FeatureFlags] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ka_admin', 'super_admin'].includes((session.user as { role?: string }).role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, enabled, percentage } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Feature flag '${key}' not found` },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (typeof percentage === 'number') updateData.percentage = percentage;

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: updateData,
    });

    return NextResponse.json({ flag: updated });
  } catch (error) {
    console.error('[FeatureFlags] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
