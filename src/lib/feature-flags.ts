/**
 * Feature Flag Service
 * Sprint KM — FF-01/KP-01
 * 
 * Lightweight feature flag system for ForstManager.
 * Supports: boolean, percentage rollout, and A/B variants.
 */

import { prisma } from '@/lib/prisma';
import type { FeatureFlag, FeatureFlagOverride } from '@prisma/client';

export type FeatureFlagResult = {
  enabled: boolean;
  variant?: string;
  source: 'default' | 'override' | 'percentage' | 'variant';
};

/**
 * Hash a user ID to a deterministic number (0-100)
 * Used for consistent percentage rollouts
 */
function hashUserId(userId: string, flagKey: string): number {
  const str = `${flagKey}:${userId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 100);
}

/**
 * Select a variant based on user hash and variant weights
 */
function selectVariant(
  userId: string,
  flagKey: string,
  variants: Record<string, number>
): string {
  const hash = hashUserId(userId, flagKey);
  let cumulative = 0;
  
  for (const [variant, weight] of Object.entries(variants)) {
    cumulative += weight;
    if (hash < cumulative) {
      return variant;
    }
  }
  
  // Fallback to first variant
  return Object.keys(variants)[0] || 'control';
}

/**
 * Evaluate a feature flag for a specific context
 */
export async function evaluateFeatureFlag(
  flagKey: string,
  context?: {
    userId?: string;
    tenantId?: string;
    logUsage?: boolean;
  }
): Promise<FeatureFlagResult> {
  const { userId, tenantId, logUsage = false } = context || {};

  // Get the feature flag
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
    include: {
      overrides: {
        where: {
          OR: [
            userId ? { userId } : {},
            tenantId ? { tenantId } : {},
          ].filter(o => Object.keys(o).length > 0),
        },
      },
    },
  });

  // Flag doesn't exist - default to disabled
  if (!flag) {
    return { enabled: false, source: 'default' };
  }

  // Check for user/tenant override first
  const override = flag.overrides.find(
    o => (userId && o.userId === userId) || (tenantId && o.tenantId === tenantId)
  );

  if (override && override.enabled !== null) {
    const result: FeatureFlagResult = {
      enabled: override.enabled,
      variant: override.variant || undefined,
      source: 'override',
    };
    
    if (logUsage && userId) {
      await logFeatureUsage(flag.id, userId, result);
    }
    
    return result;
  }

  // Evaluate based on flag type
  let result: FeatureFlagResult;

  switch (flag.type) {
    case 'boolean':
      result = { enabled: flag.enabled, source: 'default' };
      break;

    case 'percentage':
      if (!userId) {
        // No user ID - use global default
        result = { enabled: flag.enabled, source: 'default' };
      } else {
        const hash = hashUserId(userId, flagKey);
        const isEnabled = flag.percentage !== null && hash < flag.percentage;
        result = { enabled: isEnabled, source: 'percentage' };
      }
      break;

    case 'variant':
      if (!userId || !flag.variants) {
        result = { enabled: flag.enabled, source: 'default' };
      } else {
        const variants = flag.variants as Record<string, number>;
        const selectedVariant = selectVariant(userId, flagKey, variants);
        result = {
          enabled: true,
          variant: selectedVariant,
          source: 'variant',
        };
      }
      break;

    default:
      result = { enabled: flag.enabled, source: 'default' };
  }

  // Log usage if requested
  if (logUsage && userId) {
    await logFeatureUsage(flag.id, userId, result);
  }

  return result;
}

/**
 * Log feature flag evaluation for analytics
 */
async function logFeatureUsage(
  featureFlagId: string,
  userId: string,
  result: FeatureFlagResult
): Promise<void> {
  try {
    await prisma.featureUsageLog.create({
      data: {
        featureFlagId,
        userId,
        wasEnabled: result.enabled,
        variant: result.variant,
        source: 'api',
      },
    });
  } catch (error) {
    // Non-critical - don't fail the request
    console.error('[FeatureFlags] Failed to log usage:', error);
  }
}

/**
 * Check if a feature is enabled (simple boolean check)
 */
export async function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  tenantId?: string
): Promise<boolean> {
  const result = await evaluateFeatureFlag(flagKey, { userId, tenantId });
  return result.enabled;
}

/**
 * Get all feature flags for admin dashboard
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  return prisma.featureFlag.findMany({
    orderBy: [
      { category: 'asc' },
      { key: 'asc' },
    ],
  });
}

/**
 * Create or update a feature flag
 */
export async function upsertFeatureFlag(
  key: string,
  data: Partial<Omit<FeatureFlag, 'id' | 'key' | 'createdAt' | 'updatedAt'>>
): Promise<FeatureFlag> {
  return prisma.featureFlag.upsert({
    where: { key },
    update: data,
    create: {
      key,
      name: data.name || key,
      ...data,
    },
  });
}

/**
 * Set user/tenant override
 */
export async function setFlagOverride(
  flagKey: string,
  override: {
    userId?: string;
    tenantId?: string;
    enabled?: boolean;
    variant?: string;
    reason?: string;
    createdBy?: string;
  }
): Promise<FeatureFlagOverride> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    throw new Error(`Feature flag '${flagKey}' not found`);
  }

  const { userId, tenantId, ...overrideData } = override;

  if (!userId && !tenantId) {
    throw new Error('Either userId or tenantId must be provided');
  }

  // Find existing or create new
  const existing = await prisma.featureFlagOverride.findFirst({
    where: {
      featureFlagId: flag.id,
      ...(userId ? { userId } : { tenantId }),
    },
  });

  if (existing) {
    return prisma.featureFlagOverride.update({
      where: { id: existing.id },
      data: overrideData,
    });
  }

  return prisma.featureFlagOverride.create({
    data: {
      featureFlagId: flag.id,
      userId,
      tenantId,
      ...overrideData,
    },
  });
}

/**
 * Delete user/tenant override
 */
export async function removeFlagOverride(
  flagKey: string,
  target: { userId?: string; tenantId?: string }
): Promise<void> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) return;

  await prisma.featureFlagOverride.deleteMany({
    where: {
      featureFlagId: flag.id,
      ...(target.userId ? { userId: target.userId } : { tenantId: target.tenantId }),
    },
  });
}

// Default feature flags for ForstManager
export const DEFAULT_FEATURE_FLAGS = [
  {
    key: 'ki_assistent',
    name: 'KI Betriebs-Assistent',
    description: 'Claude-basierter Förderberater und Betriebs-Assistent',
    type: 'boolean' as const,
    enabled: true,
    category: 'ki',
  },
  {
    key: 'offline_sync',
    name: 'Offline-Synchronisierung',
    description: 'WatermelonDB-basierte Offline-Funktionalität',
    type: 'percentage' as const,
    enabled: false,
    percentage: 0,
    category: 'sync',
  },
  {
    key: 'billing_portal',
    name: 'Stripe Billing Portal',
    description: 'Self-Service für Rechnungen und Abo-Verwaltung',
    type: 'boolean' as const,
    enabled: true,
    category: 'billing',
  },
  {
    key: 'alleinarbeit_sos',
    name: 'Alleinarbeit SOS-System',
    description: 'Dead-Man-Switch und Notfall-Eskalation',
    type: 'boolean' as const,
    enabled: true,
    category: 'safety',
  },
  {
    key: 'gdpr_export',
    name: 'DSGVO Datenexport',
    description: 'Vollständiger Tenant-Datenexport',
    type: 'boolean' as const,
    enabled: true,
    category: 'compliance',
  },
  {
    key: 'biometric_auth',
    name: 'Biometrische Authentifizierung',
    description: 'FaceID/Fingerprint für App',
    type: 'percentage' as const,
    enabled: false,
    percentage: 50,
    category: 'security',
  },
  {
    key: 'kpi_dashboard',
    name: 'Business KPI Dashboard',
    description: 'Internes Dashboard mit MRR, Churn, Active Users',
    type: 'boolean' as const,
    enabled: true,
    category: 'admin',
  },
];

/**
 * Seed default feature flags
 */
export async function seedDefaultFeatureFlags(): Promise<void> {
  for (const flag of DEFAULT_FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
}
