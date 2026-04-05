/**
 * Stripe Webhook Handler
 * Sprint KF PO-01: Payment Reconciliation
 * 
 * Events:
 * - payment_intent.succeeded → Match & mark Rechnung as bezahlt
 * - charge.refunded → Create Storno (handled in KG PO-02)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  getStripeClient,
  matchPaymentToRechnung,
  markRechnungAsPaid,
  createUnmatchedPayment,
  isEventProcessed,
} from '@/lib/stripe';

// Disable body parsing - Stripe needs raw body for signature verification
export const runtime = 'nodejs';

async function buffer(readable: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = readable.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  // Get raw body and signature
  const body = await buffer(request.body!);
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    const stripeClient = getStripeClient();
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Idempotency check
  const alreadyProcessed = await isEventProcessed(event.id);
  if (alreadyProcessed) {
    console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;

      // Sprint KH: Dunning/Mahnprozess
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      case 'invoice.payment_action_required':
        await handleInvoicePaymentActionRequired(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Stripe Webhook] Error processing ${event.type}: ${message}`);
    
    // Don't return 500 - Stripe will retry. Log and acknowledge.
    return NextResponse.json({ received: true, error: message });
  }
}

/**
 * Handler für payment_intent.succeeded
 * Matcht Zahlung mit Rechnung und aktualisiert Status
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  const paymentIntentId = paymentIntent.id;
  const amountCents = paymentIntent.amount;
  const currency = paymentIntent.currency;
  const customerId = typeof paymentIntent.customer === 'string' 
    ? paymentIntent.customer 
    : paymentIntent.customer?.id;
  const invoiceId = typeof paymentIntent.invoice === 'string'
    ? paymentIntent.invoice
    : paymentIntent.invoice?.id;
  const paymentMethodType = paymentIntent.payment_method_types?.[0] || 'unknown';
  
  const stripePaidAt = paymentIntent.created 
    ? new Date(paymentIntent.created * 1000)
    : new Date();

  // Get customer email if available
  let customerEmail: string | null = null;
  if (customerId) {
    try {
      const stripeClient = getStripeClient();
      const customer = await stripeClient.customers.retrieve(customerId);
      if ('email' in customer && customer.email) {
        customerEmail = customer.email;
      }
    } catch (e) {
      console.warn(`[Stripe Webhook] Could not fetch customer ${customerId}`);
    }
  }

  // Try to match payment to Rechnung
  const matchResult = await matchPaymentToRechnung(
    paymentIntentId,
    amountCents,
    stripePaidAt,
    invoiceId,
    customerEmail
  );

  // Create PaymentRecord
  await prisma.paymentRecord.create({
    data: {
      stripePaymentIntentId: paymentIntentId,
      stripeEventId: event.id,
      amount: amountCents,
      currency: currency,
      status: 'succeeded',
      rechnungId: matchResult.rechnungId || null,
      matched: matchResult.matched,
      matchedAt: matchResult.matched ? new Date() : null,
      matchMethod: matchResult.method || null,
      stripeCustomerId: customerId,
      stripeInvoiceId: invoiceId,
      paymentMethodType: paymentMethodType,
      rawEventData: event as unknown as object,
      stripePaidAt: stripePaidAt,
    },
  });

  if (matchResult.matched && matchResult.rechnungId) {
    // Mark Rechnung as paid
    await markRechnungAsPaid(
      matchResult.rechnungId,
      paymentIntentId,
      stripePaidAt
    );

    console.log(
      `[Stripe Webhook] ✅ Payment ${paymentIntentId} matched to Rechnung ${matchResult.rechnungId} via ${matchResult.method}`
    );

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'PAYMENT_RECEIVED',
        entityType: 'rechnung',
        entityId: matchResult.rechnungId,
        entityName: `Zahlung ${(amountCents / 100).toFixed(2)} €`,
        metadata: JSON.stringify({
          paymentIntentId,
          amount: amountCents,
          currency,
          method: matchResult.method,
        }),
      },
    });
  } else {
    // Create UnmatchedPayment for admin review
    const unmatchedId = await createUnmatchedPayment(
      paymentIntentId,
      event.id,
      amountCents,
      stripePaidAt,
      event,
      customerId,
      customerEmail,
      invoiceId,
      paymentMethodType
    );

    console.warn(
      `[Stripe Webhook] ⚠️ Unmatched payment ${paymentIntentId} (${(amountCents / 100).toFixed(2)} ${currency}) - UnmatchedPayment ID: ${unmatchedId}`
    );

    // Log activity for admin attention
    await prisma.activityLog.create({
      data: {
        action: 'UNMATCHED_PAYMENT',
        entityType: 'payment',
        entityId: unmatchedId,
        entityName: `Ungematchte Zahlung ${(amountCents / 100).toFixed(2)} €`,
        metadata: JSON.stringify({
          paymentIntentId,
          amount: amountCents,
          currency,
          customerEmail,
        }),
      },
    });
  }
}

/**
 * Handler für invoice.paid (Stripe Billing)
 * Für Kunden die über Stripe Billing abgerechnet werden
 */
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  const invoiceId = invoice.id;
  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id;
  const amountCents = invoice.amount_paid;
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  
  const stripePaidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date();

  if (!paymentIntentId) {
    console.log(`[Stripe Webhook] Invoice ${invoiceId} has no payment_intent, skipping`);
    return;
  }

  // Check if already processed via payment_intent.succeeded
  const existingRecord = await prisma.paymentRecord.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (existingRecord) {
    // Update with invoice ID if not set
    if (!existingRecord.stripeInvoiceId) {
      await prisma.paymentRecord.update({
        where: { id: existingRecord.id },
        data: { stripeInvoiceId: invoiceId },
      });
    }
    console.log(`[Stripe Webhook] Invoice ${invoiceId} - PaymentIntent already processed`);
    return;
  }

  // Process similar to payment_intent.succeeded
  const matchResult = await matchPaymentToRechnung(
    paymentIntentId,
    amountCents,
    stripePaidAt,
    invoiceId,
    invoice.customer_email
  );

  await prisma.paymentRecord.create({
    data: {
      stripePaymentIntentId: paymentIntentId,
      stripeEventId: event.id,
      amount: amountCents,
      currency: invoice.currency,
      status: 'succeeded',
      rechnungId: matchResult.rechnungId || null,
      matched: matchResult.matched,
      matchedAt: matchResult.matched ? new Date() : null,
      matchMethod: matchResult.method || null,
      stripeCustomerId: customerId,
      stripeInvoiceId: invoiceId,
      rawEventData: event as unknown as object,
      stripePaidAt: stripePaidAt,
    },
  });

  if (matchResult.matched && matchResult.rechnungId) {
    await markRechnungAsPaid(matchResult.rechnungId, paymentIntentId, stripePaidAt);
    console.log(`[Stripe Webhook] ✅ Invoice ${invoiceId} matched to Rechnung ${matchResult.rechnungId}`);
  } else {
    await createUnmatchedPayment(
      paymentIntentId,
      event.id,
      amountCents,
      stripePaidAt,
      event,
      customerId,
      invoice.customer_email,
      invoiceId,
      null
    );
    console.warn(`[Stripe Webhook] ⚠️ Unmatched invoice payment ${invoiceId}`);
  }
}

/**
 * Handler für charge.refunded (Sprint KG PO-02)
 * Erstellt automatisch Stornorechnung bei Stripe-Refund
 */
async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  
  const chargeId = charge.id;
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;
  const refundedAmount = charge.amount_refunded;
  const originalAmount = charge.amount;
  const isFullRefund = refundedAmount === originalAmount;
  
  console.log(
    `[Stripe Webhook] charge.refunded: ${chargeId}, ` +
    `PaymentIntent: ${paymentIntentId}, ` +
    `Refund: ${(refundedAmount / 100).toFixed(2)} € / ${(originalAmount / 100).toFixed(2)} € ` +
    `(${isFullRefund ? 'Vollständig' : 'Teilweise'})`
  );

  if (!paymentIntentId) {
    console.warn('[Stripe Webhook] charge.refunded ohne PaymentIntent - kann Rechnung nicht zuordnen');
    
    // Log für manuelle Bearbeitung
    await prisma.activityLog.create({
      data: {
        action: 'REFUND_UNMATCHED',
        entityType: 'payment',
        entityId: chargeId,
        entityName: `Ungematchter Refund ${(refundedAmount / 100).toFixed(2)} €`,
        metadata: JSON.stringify({
          chargeId,
          refundedAmount,
          originalAmount,
          isFullRefund,
          eventId: event.id,
        }),
      },
    });
    return;
  }

  // Suche Rechnung über PaymentIntent
  const rechnung = await prisma.rechnung.findFirst({
    where: {
      stripePaymentIntentId: paymentIntentId,
      deletedAt: null,
      status: { not: 'storniert' },
    },
    select: {
      id: true,
      nummer: true,
      bruttoBetrag: true,
      betrag: true,
      status: true,
    },
  });

  if (!rechnung) {
    console.warn(`[Stripe Webhook] Keine Rechnung für PaymentIntent ${paymentIntentId} gefunden`);
    
    // Log für manuelle Bearbeitung
    await prisma.activityLog.create({
      data: {
        action: 'REFUND_NO_RECHNUNG',
        entityType: 'payment',
        entityId: paymentIntentId,
        entityName: `Refund ohne Rechnung: ${(refundedAmount / 100).toFixed(2)} €`,
        metadata: JSON.stringify({
          paymentIntentId,
          chargeId,
          refundedAmount,
          originalAmount,
          eventId: event.id,
        }),
      },
    });
    return;
  }

  // Refund-ID aus den Refunds extrahieren (letzter Refund)
  const refunds = charge.refunds?.data || [];
  const latestRefund = refunds.length > 0 ? refunds[refunds.length - 1] : null;
  const refundId = latestRefund?.id;
  const refundReason = latestRefund?.reason || 'requested_by_customer';

  // Stornierung via interner API durchführen
  try {
    const stornoResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/rechnungen/${rechnung.id}/stornieren`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stripe-webhook': 'true', // Interner Auth-Bypass für Webhook
        },
        body: JSON.stringify({
          grund: `Stripe Refund: ${refundReason}`,
          stripeRefundId: refundId,
          teilbetrag: isFullRefund ? undefined : refundedAmount / 100,
          erstelleGutschrift: true,
        }),
      }
    );

    const stornoResult = await stornoResponse.json();

    if (stornoResponse.ok) {
      console.log(
        `[Stripe Webhook] ✅ Rechnung ${rechnung.nummer} automatisch storniert (Refund: ${refundId})`
      );

      // Update PaymentRecord
      await prisma.paymentRecord.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status: isFullRefund ? 'refunded' : 'partially_refunded',
        },
      });

    } else {
      console.error(
        `[Stripe Webhook] ❌ Stornierung fehlgeschlagen für ${rechnung.nummer}:`,
        stornoResult.error
      );

      // Log für manuelle Bearbeitung
      await prisma.activityLog.create({
        data: {
          action: 'REFUND_STORNO_FAILED',
          entityType: 'rechnung',
          entityId: rechnung.id,
          entityName: `Stornierung fehlgeschlagen: ${rechnung.nummer}`,
          metadata: JSON.stringify({
            error: stornoResult.error,
            refundId,
            paymentIntentId,
            chargeId,
            refundedAmount,
          }),
        },
      });
    }

  } catch (error) {
    console.error('[Stripe Webhook] Fehler bei automatischer Stornierung:', error);
    
    // Fallback: Direktes Update ohne Gutschrift
    await prisma.$transaction([
      prisma.rechnung.update({
        where: { id: rechnung.id },
        data: {
          status: isFullRefund ? 'storniert' : 'teilstorniert',
          notizen: `[STRIPE REFUND ${new Date().toISOString()}]: ${refundReason} (${refundId})`,
        },
      }),
      prisma.rechnungAuditLog.create({
        data: {
          rechnungId: rechnung.id,
          action: 'STORNO_VIA_STRIPE',
          field: 'status',
          oldValue: JSON.stringify(rechnung.status),
          newValue: JSON.stringify(isFullRefund ? 'storniert' : 'teilstorniert'),
          userId: 'STRIPE_WEBHOOK',
          userName: 'Stripe Refund Webhook',
          metadata: JSON.stringify({
            refundId,
            chargeId,
            paymentIntentId,
            refundedAmount,
            originalAmount,
            isFullRefund,
          }),
        },
      }),
      prisma.activityLog.create({
        data: {
          action: 'RECHNUNG_STORNIERT',
          entityType: 'rechnung',
          entityId: rechnung.id,
          entityName: `Stripe-Refund: ${rechnung.nummer}`,
          metadata: JSON.stringify({
            refundId,
            refundedAmount,
            isFullRefund,
            fallbackUpdate: true,
          }),
        },
      }),
    ]);

    console.log(
      `[Stripe Webhook] ⚠️ Fallback-Stornierung für ${rechnung.nummer} durchgeführt`
    );
  }
}

// ============================================================
// DUNNING / MAHNPROZESS HANDLER (Sprint KH PO-04)
// ============================================================

/**
 * Handler für invoice.payment_failed
 * Trackt fehlgeschlagene Zahlungsversuche, sperrt nach 3 Versuchen
 */
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  const invoiceId = invoice.id;
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;
  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id;
  const amount = invoice.amount_due;
  const attemptCount = invoice.attempt_count || 1;
  const nextAttempt = invoice.next_payment_attempt 
    ? new Date(invoice.next_payment_attempt * 1000) 
    : null;

  // Get failure details from last payment intent
  let failureCode: string | null = null;
  let failureMessage: string | null = null;
  let failureReason: string | null = null;

  if (paymentIntentId) {
    try {
      const stripeClient = getStripeClient();
      const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      if (pi.last_payment_error) {
        failureCode = pi.last_payment_error.code || null;
        failureMessage = pi.last_payment_error.message || null;
        failureReason = pi.last_payment_error.decline_code || null;
      }
    } catch (e) {
      console.warn(`[Stripe Webhook] Could not fetch PaymentIntent ${paymentIntentId}`);
    }
  }

  console.log(
    `[Stripe Webhook] invoice.payment_failed: ${invoiceId}, ` +
    `Customer: ${customerId}, Attempt: ${attemptCount}, ` +
    `Amount: ${(amount / 100).toFixed(2)} €, ` +
    `Failure: ${failureCode || 'unknown'}`
  );

  // Find Tenant by Stripe Customer ID
  const tenant = customerId ? await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  }) : null;

  if (!tenant) {
    console.warn(`[Stripe Webhook] No tenant found for Stripe Customer ${customerId}`);
    
    // Log for admin review
    await prisma.activityLog.create({
      data: {
        action: 'DUNNING_NO_TENANT',
        entityType: 'payment',
        entityId: invoiceId,
        entityName: `Fehlgeschlagene Zahlung ohne Tenant: ${(amount / 100).toFixed(2)} €`,
        metadata: JSON.stringify({
          invoiceId,
          customerId,
          subscriptionId,
          attemptCount,
          failureCode,
        }),
      },
    });
    return;
  }

  // Upsert DunningRecord
  const existingRecord = await prisma.dunningRecord.findUnique({
    where: { stripeInvoiceId: invoiceId },
  });

  const now = new Date();
  const isFirstFailure = !existingRecord && tenant.dunningCurrentAttempt === 0;

  if (existingRecord) {
    // Update existing record
    await prisma.dunningRecord.update({
      where: { id: existingRecord.id },
      data: {
        attemptNumber: attemptCount,
        failureCode,
        failureMessage,
        failureReason,
        nextRetryAt: nextAttempt,
        rawEventData: event as unknown as object,
        failedAt: now,
        updatedAt: now,
      },
    });
  } else {
    // Create new record
    await prisma.dunningRecord.create({
      data: {
        tenantId: tenant.id,
        stripeInvoiceId: invoiceId,
        stripeSubscriptionId: subscriptionId,
        stripePaymentIntentId: paymentIntentId,
        stripeEventId: event.id,
        amount,
        currency: invoice.currency,
        attemptNumber: attemptCount,
        failureCode,
        failureMessage,
        failureReason,
        status: 'pending',
        nextRetryAt: nextAttempt,
        rawEventData: event as unknown as object,
        failedAt: now,
      },
    });
  }

  // Update Tenant dunning state
  const updateData: Record<string, unknown> = {
    dunningCurrentAttempt: attemptCount,
    dunningLastFailedAt: now,
  };

  if (isFirstFailure) {
    updateData.dunningFirstFailedAt = now;
  }

  // Check if max retries reached → suspend
  if (attemptCount >= tenant.dunningMaxRetries) {
    console.log(
      `[Stripe Webhook] ⚠️ Max dunning attempts (${tenant.dunningMaxRetries}) reached for tenant ${tenant.slug}`
    );

    // Check if grace period passed (dunningGraceDays)
    const graceDays = tenant.dunningGraceDays;
    const firstFailed = tenant.dunningFirstFailedAt || now;
    const daysSinceFirst = Math.floor((now.getTime() - firstFailed.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceFirst >= graceDays) {
      updateData.status = 'payment_suspended';
      updateData.paymentSuspendedAt = now;

      // Update DunningRecord status
      await prisma.dunningRecord.updateMany({
        where: { 
          tenantId: tenant.id,
          status: 'pending',
        },
        data: { 
          status: 'suspended',
          suspendedAt: now,
        },
      });

      console.log(
        `[Stripe Webhook] 🔒 Tenant ${tenant.slug} suspended due to payment failure`
      );

      // Activity log
      await prisma.activityLog.create({
        data: {
          action: 'TENANT_PAYMENT_SUSPENDED',
          entityType: 'tenant',
          entityId: tenant.id,
          entityName: `Tenant ${tenant.name} wegen Zahlungsausfall gesperrt`,
          metadata: JSON.stringify({
            invoiceId,
            attemptCount,
            daysSinceFirst,
            failureCode,
            amount,
          }),
        },
      });
    }
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
  });

  // Activity log for failed payment
  await prisma.activityLog.create({
    data: {
      action: 'PAYMENT_FAILED',
      entityType: 'tenant',
      entityId: tenant.id,
      entityName: `Zahlung fehlgeschlagen: ${(amount / 100).toFixed(2)} € (Versuch ${attemptCount}/${tenant.dunningMaxRetries})`,
      metadata: JSON.stringify({
        invoiceId,
        attemptCount,
        maxRetries: tenant.dunningMaxRetries,
        failureCode,
        failureMessage,
        nextAttempt: nextAttempt?.toISOString(),
      }),
    },
  });
}

/**
 * Handler für invoice.payment_action_required
 * Zahlung erfordert Kundenaktion (z.B. 3D Secure)
 */
async function handleInvoicePaymentActionRequired(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  const invoiceId = invoice.id;
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  const hostedInvoiceUrl = invoice.hosted_invoice_url;

  console.log(
    `[Stripe Webhook] invoice.payment_action_required: ${invoiceId}, ` +
    `Customer: ${customerId}`
  );

  // Find Tenant
  const tenant = customerId ? await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  }) : null;

  if (!tenant) {
    console.warn(`[Stripe Webhook] No tenant for payment action required: ${customerId}`);
    return;
  }

  // Log activity - this needs customer action
  await prisma.activityLog.create({
    data: {
      action: 'PAYMENT_ACTION_REQUIRED',
      entityType: 'tenant',
      entityId: tenant.id,
      entityName: `Zahlung erfordert Kundenaktion`,
      metadata: JSON.stringify({
        invoiceId,
        hostedInvoiceUrl,
        amount: invoice.amount_due,
      }),
    },
  });

  // TODO: Send notification email to tenant with hostedInvoiceUrl
}

/**
 * Handler für customer.subscription.updated
 * Trackt Subscription-Statusänderungen (inkl. Dunning Resolution)
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  const subscriptionId = subscription.id;
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;
  const status = subscription.status;

  console.log(
    `[Stripe Webhook] customer.subscription.updated: ${subscriptionId}, ` +
    `Status: ${status}`
  );

  // Find Tenant
  const tenant = customerId ? await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  }) : null;

  if (!tenant) {
    console.warn(`[Stripe Webhook] No tenant for subscription update: ${customerId}`);
    return;
  }

  // If subscription becomes active again, resolve dunning
  if (status === 'active' && tenant.dunningCurrentAttempt > 0) {
    const now = new Date();

    // Reset dunning state
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        dunningCurrentAttempt: 0,
        dunningResolvedAt: now,
        dunningFirstFailedAt: null,
        dunningLastFailedAt: null,
        // If was suspended, restore to active
        status: tenant.status === 'payment_suspended' ? 'active' : tenant.status,
        paymentSuspendedAt: null,
      },
    });

    // Update all pending DunningRecords to resolved
    await prisma.dunningRecord.updateMany({
      where: {
        tenantId: tenant.id,
        status: { in: ['pending', 'retrying', 'suspended'] },
      },
      data: {
        status: 'resolved',
        resolvedAt: now,
      },
    });

    console.log(`[Stripe Webhook] ✅ Dunning resolved for tenant ${tenant.slug}`);

    await prisma.activityLog.create({
      data: {
        action: 'DUNNING_RESOLVED',
        entityType: 'tenant',
        entityId: tenant.id,
        entityName: `Zahlung erfolgreich - Mahnverfahren beendet`,
        metadata: JSON.stringify({
          subscriptionId,
          previousAttempts: tenant.dunningCurrentAttempt,
          wasSupended: tenant.status === 'payment_suspended',
        }),
      },
    });
  }

  // If subscription is cancelled
  if (status === 'canceled' || status === 'unpaid') {
    await prisma.dunningRecord.updateMany({
      where: {
        tenantId: tenant.id,
        stripeSubscriptionId: subscriptionId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });

    console.log(`[Stripe Webhook] Subscription ${subscriptionId} cancelled/unpaid`);
  }
}
