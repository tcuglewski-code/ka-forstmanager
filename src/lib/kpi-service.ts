/**
 * Business KPI Service
 * Sprint KM — FF-01/KP-01
 * 
 * Calculates and tracks business metrics:
 * - MRR, ARR, Churn Rate
 * - Active Users (DAU/WAU/MAU)
 * - Feature Usage
 * - AI Usage & Cost
 */

import { prisma } from '@/lib/prisma';

export type KpiPeriodType = 'daily' | 'weekly' | 'monthly';

export type KpiMetrics = {
  // Revenue
  mrr: number;
  arr: number;
  newMrr: number;
  churnMrr: number;
  expansionMrr: number;
  netMrrGrowth: number;
  // Customers
  totalCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  churnRate: number;
  // Users
  activeUsers: number;
  dauCount: number;
  wauCount: number;
  mauCount: number;
  // Engagement
  avgSessionDuration: number;
  pageViewsTotal: number;
  apiCallsTotal: number;
  // Feature Usage
  featureUsage: Record<string, number>;
  // AI
  aiRequestsTotal: number;
  aiTokensTotal: number;
  aiCostTotal: number;
};

/**
 * Calculate DAU/WAU/MAU from session data
 */
async function calculateActiveUsers(
  periodStart: Date,
  periodEnd: Date
): Promise<{ dauCount: number; wauCount: number; mauCount: number; activeUsers: number }> {
  // Active users in period (logged in at least once)
  const activeUsers = await prisma.session.groupBy({
    by: ['userId'],
    where: {
      lastActiveAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    _count: true,
  });

  // DAU - average daily unique users
  const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const dauCount = Math.round(activeUsers.length / daysDiff);

  // WAU - users active in last 7 days of period
  const weekStart = new Date(periodEnd);
  weekStart.setDate(weekStart.getDate() - 7);
  const wauUsers = await prisma.session.groupBy({
    by: ['userId'],
    where: {
      lastActiveAt: {
        gte: weekStart,
        lte: periodEnd,
      },
    },
    _count: true,
  });

  // MAU - users active in last 30 days of period
  const monthStart = new Date(periodEnd);
  monthStart.setDate(monthStart.getDate() - 30);
  const mauUsers = await prisma.session.groupBy({
    by: ['userId'],
    where: {
      lastActiveAt: {
        gte: monthStart,
        lte: periodEnd,
      },
    },
    _count: true,
  });

  return {
    activeUsers: activeUsers.length,
    dauCount,
    wauCount: wauUsers.length,
    mauCount: mauUsers.length,
  };
}

/**
 * Calculate feature usage from FeatureUsageLog
 */
async function calculateFeatureUsage(
  periodStart: Date,
  periodEnd: Date
): Promise<Record<string, number>> {
  const usage = await prisma.featureUsageLog.groupBy({
    by: ['featureFlagId'],
    where: {
      evaluatedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      wasEnabled: true,
    },
    _count: true,
  });

  // Get flag keys for the IDs
  const flagIds = usage.map(u => u.featureFlagId);
  const flags = await prisma.featureFlag.findMany({
    where: { id: { in: flagIds } },
    select: { id: true, key: true },
  });

  const flagIdToKey = new Map(flags.map(f => [f.id, f.key]));
  
  const result: Record<string, number> = {};
  for (const item of usage) {
    const key = flagIdToKey.get(item.featureFlagId) || item.featureFlagId;
    result[key] = item._count;
  }

  return result;
}

/**
 * Calculate AI usage from AiAuditLog
 */
async function calculateAiUsage(
  periodStart: Date,
  periodEnd: Date
): Promise<{ aiRequestsTotal: number; aiTokensTotal: number; aiCostTotal: number }> {
  try {
    const aiLogs = await prisma.aiAuditLog.aggregate({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      _count: true,
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalCost: true,
      },
    });

    return {
      aiRequestsTotal: aiLogs._count || 0,
      aiTokensTotal: (aiLogs._sum.inputTokens || 0) + (aiLogs._sum.outputTokens || 0),
      aiCostTotal: aiLogs._sum.totalCost || 0,
    };
  } catch {
    // AiAuditLog might not exist yet
    return { aiRequestsTotal: 0, aiTokensTotal: 0, aiCostTotal: 0 };
  }
}

/**
 * Calculate customer metrics from Tenant data
 * Note: For single-tenant (Koch Aufforstung), this is simplified
 */
async function calculateCustomerMetrics(
  periodStart: Date,
  periodEnd: Date
): Promise<{
  totalCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  churnRate: number;
}> {
  try {
    // Total active tenants
    const totalCustomers = await prisma.tenant.count({
      where: {
        status: { in: ['active', 'grace_period'] },
      },
    });

    // New tenants in period
    const newCustomers = await prisma.tenant.count({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Churned tenants in period
    const churnedCustomers = await prisma.tenant.count({
      where: {
        status: { in: ['cancelled', 'archived', 'deleted'] },
        cancelledAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Churn rate = churned / (total at period start)
    const totalAtStart = totalCustomers - newCustomers + churnedCustomers;
    const churnRate = totalAtStart > 0 ? (churnedCustomers / totalAtStart) * 100 : 0;

    return {
      totalCustomers,
      newCustomers,
      churnedCustomers,
      churnRate: Math.round(churnRate * 100) / 100,
    };
  } catch {
    // Tenant model might not have all fields
    return {
      totalCustomers: 1, // Koch Aufforstung as single tenant
      newCustomers: 0,
      churnedCustomers: 0,
      churnRate: 0,
    };
  }
}

/**
 * Calculate KPI Events (page views, API calls)
 */
async function calculateEngagement(
  periodStart: Date,
  periodEnd: Date
): Promise<{ pageViewsTotal: number; apiCallsTotal: number; avgSessionDuration: number }> {
  try {
    const pageViews = await prisma.kpiEvent.count({
      where: {
        eventType: 'page_view',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const apiCalls = await prisma.kpiEvent.count({
      where: {
        eventType: 'api_call',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Avg session duration from session events
    const sessionEvents = await prisma.kpiEvent.findMany({
      where: {
        eventType: 'login',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        metadata: true,
      },
    });

    let totalDuration = 0;
    let sessionCount = 0;
    for (const event of sessionEvents) {
      const metadata = event.metadata as { duration_ms?: number } | null;
      if (metadata?.duration_ms) {
        totalDuration += metadata.duration_ms;
        sessionCount++;
      }
    }

    const avgSessionDuration = sessionCount > 0 
      ? Math.round((totalDuration / sessionCount) / 60000) // Convert to minutes
      : 0;

    return {
      pageViewsTotal: pageViews,
      apiCallsTotal: apiCalls,
      avgSessionDuration,
    };
  } catch {
    return {
      pageViewsTotal: 0,
      apiCallsTotal: 0,
      avgSessionDuration: 0,
    };
  }
}

/**
 * Calculate all KPIs for a period
 */
export async function calculateKpis(
  periodStart: Date,
  periodEnd: Date
): Promise<KpiMetrics> {
  const [userMetrics, featureUsage, aiUsage, customerMetrics, engagement] = await Promise.all([
    calculateActiveUsers(periodStart, periodEnd),
    calculateFeatureUsage(periodStart, periodEnd),
    calculateAiUsage(periodStart, periodEnd),
    calculateCustomerMetrics(periodStart, periodEnd),
    calculateEngagement(periodStart, periodEnd),
  ]);

  // MRR calculation - simplified for now
  // In production: sum of all active subscription amounts
  const mrr = customerMetrics.totalCustomers * 299; // Assuming €299/month per tenant
  const arr = mrr * 12;

  return {
    // Revenue (simplified)
    mrr,
    arr,
    newMrr: customerMetrics.newCustomers * 299,
    churnMrr: customerMetrics.churnedCustomers * 299,
    expansionMrr: 0, // Would come from upsells
    netMrrGrowth: (customerMetrics.newCustomers - customerMetrics.churnedCustomers) * 299,
    // Customers
    ...customerMetrics,
    // Users
    ...userMetrics,
    // Engagement
    ...engagement,
    // Feature Usage
    featureUsage,
    // AI
    ...aiUsage,
  };
}

/**
 * Create a KPI snapshot for a period
 */
export async function createKpiSnapshot(
  periodStart: Date,
  periodEnd: Date,
  periodType: KpiPeriodType = 'daily'
): Promise<void> {
  const metrics = await calculateKpis(periodStart, periodEnd);

  await prisma.businessKpiSnapshot.upsert({
    where: {
      periodStart_periodEnd_periodType: {
        periodStart,
        periodEnd,
        periodType,
      },
    },
    update: {
      ...metrics,
      calculatedBy: 'cron',
    },
    create: {
      periodStart,
      periodEnd,
      periodType,
      ...metrics,
      calculatedBy: 'cron',
    },
  });
}

/**
 * Get the latest KPI snapshot
 */
export async function getLatestKpiSnapshot(
  periodType?: KpiPeriodType
): Promise<typeof result | null> {
  const result = await prisma.businessKpiSnapshot.findFirst({
    where: periodType ? { periodType } : {},
    orderBy: { periodEnd: 'desc' },
  });
  return result;
}

/**
 * Get KPI history for a time range
 */
export async function getKpiHistory(
  periodType: KpiPeriodType,
  limit: number = 30
): Promise<Array<Awaited<ReturnType<typeof getLatestKpiSnapshot>>>> {
  return prisma.businessKpiSnapshot.findMany({
    where: { periodType },
    orderBy: { periodEnd: 'desc' },
    take: limit,
  });
}

/**
 * Get period boundaries for different period types
 */
export function getPeriodBoundaries(periodType: KpiPeriodType): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (periodType) {
    case 'daily':
      // Today
      break;
    case 'weekly':
      // Start of this week (Monday)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      break;
    case 'monthly':
      // Start of this month
      start.setDate(1);
      break;
  }

  return { start, end };
}

/**
 * Track a KPI event
 */
export async function trackKpiEvent(
  eventType: string,
  eventName?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.kpiEvent.create({
      data: {
        eventType,
        eventName,
        userId,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('[KPI] Failed to track event:', error);
  }
}
