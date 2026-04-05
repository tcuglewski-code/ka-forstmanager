/**
 * Stripe MRR Integration — Stub
 * Reads STRIPE_SECRET_KEY from ENV. If present, calls Stripe API.
 * If not, returns demo values for development.
 */

interface MrrData {
  mrr: number;
  currency: string;
  activeSubscriptions: number;
  churnRate: number;
  source: 'stripe' | 'demo';
  timestamp: string;
}

interface StripeSubscription {
  id: string;
  status: string;
  items: {
    data: Array<{
      price: {
        unit_amount: number;
        recurring: { interval: string };
      };
    }>;
  };
}

/**
 * Get Monthly Recurring Revenue from Stripe
 * Falls back to demo data when STRIPE_SECRET_KEY is not set
 */
export async function getMRR(): Promise<MrrData> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return getDemoMRR();
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error('[Stripe MRR] API error:', response.status);
      return getDemoMRR();
    }

    const data = await response.json();
    const subscriptions: StripeSubscription[] = data.data;

    let totalMrr = 0;
    for (const sub of subscriptions) {
      for (const item of sub.items.data) {
        const amount = item.price.unit_amount / 100;
        const interval = item.price.recurring?.interval;
        if (interval === 'year') {
          totalMrr += amount / 12;
        } else {
          totalMrr += amount;
        }
      }
    }

    return {
      mrr: Math.round(totalMrr * 100) / 100,
      currency: 'EUR',
      activeSubscriptions: subscriptions.length,
      churnRate: 0,
      source: 'stripe',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Stripe MRR] Error:', error);
    return getDemoMRR();
  }
}

function getDemoMRR(): MrrData {
  return {
    mrr: 498.00,
    currency: 'EUR',
    activeSubscriptions: 2,
    churnRate: 0,
    source: 'demo',
    timestamp: new Date().toISOString(),
  };
}
