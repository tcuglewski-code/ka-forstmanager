import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session with setup fee + subscription.
 * Packages:
 *   - Starter:      499 EUR setup + 49 EUR/mo
 *   - Professional:  999 EUR setup + 99 EUR/mo
 *
 * Body: { plan: "starter" | "professional", tenantId: string }
 * Returns: { url: string }
 */

const PLANS = {
  starter: {
    name: "ForstManager Starter",
    setupFee: 49900, // 499 EUR in cents
    monthlyPrice: 4900, // 49 EUR in cents
  },
  professional: {
    name: "ForstManager Professional",
    setupFee: 99900, // 999 EUR in cents
    monthlyPrice: 9900, // 99 EUR in cents
  },
} as const

type PlanKey = keyof typeof PLANS

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. TODO: Set STRIPE_SECRET_KEY environment variable." },
      { status: 500 }
    )
  }

  let body: { plan?: string; tenantId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { plan, tenantId } = body

  if (!plan || !tenantId) {
    return NextResponse.json(
      { error: "Missing required fields: plan, tenantId" },
      { status: 400 }
    )
  }

  if (plan !== "starter" && plan !== "professional") {
    return NextResponse.json(
      { error: "Invalid plan. Must be 'starter' or 'professional'." },
      { status: 400 }
    )
  }

  const selectedPlan = PLANS[plan as PlanKey]
  const origin = req.headers.get("origin") || "https://ka-forstmanager.vercel.app"

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
    })

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      metadata: {
        tenantId,
        plan,
      },
      line_items: [
        // One-time setup fee
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${selectedPlan.name} — Einrichtungsgebuehr`,
            },
            unit_amount: selectedPlan.setupFee,
          },
          quantity: 1,
        },
        // Recurring subscription
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${selectedPlan.name} — Monatlich`,
            },
            unit_amount: selectedPlan.monthlyPrice,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[Stripe Checkout] Error creating session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
