/**
 * Stripe Payment Reconciliation Library
 * Sprint KF PO-01: Payment matching für Rechnungen
 */

import Stripe from 'stripe';
import { prisma } from './prisma';

// Stripe Client (Server-Side Only)
// Lazy initialization to avoid build-time errors when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

// Legacy export for backwards compatibility
export const stripe = {
  get webhooks() {
    return getStripeClient().webhooks;
  },
  get customers() {
    return getStripeClient().customers;
  },
};

/**
 * Versucht eine Stripe-Zahlung mit einer Rechnung zu matchen
 * Matching-Strategien (in Reihenfolge):
 * 1. PaymentIntent ID direkt in Rechnung hinterlegt
 * 2. Stripe Invoice ID in Rechnung hinterlegt
 * 3. Betrag + Zeitfenster (±7 Tage) + offene Rechnung
 */
export async function matchPaymentToRechnung(
  paymentIntentId: string,
  amountCents: number,
  stripePaidAt: Date,
  stripeInvoiceId?: string | null,
  customerEmail?: string | null
): Promise<{ matched: boolean; rechnungId?: string; method?: string }> {
  
  // Strategie 1: Direkte PaymentIntent-Verknüpfung
  const directMatch = await prisma.rechnung.findFirst({
    where: {
      stripePaymentIntentId: paymentIntentId,
      deletedAt: null,
      gdprRestricted: false,
    },
    select: { id: true },
  });

  if (directMatch) {
    return { matched: true, rechnungId: directMatch.id, method: 'payment_intent_id' };
  }

  // Strategie 2: Stripe Invoice ID
  if (stripeInvoiceId) {
    const invoiceMatch = await prisma.rechnung.findFirst({
      where: {
        stripeInvoiceId: stripeInvoiceId,
        deletedAt: null,
        gdprRestricted: false,
      },
      select: { id: true },
    });

    if (invoiceMatch) {
      return { matched: true, rechnungId: invoiceMatch.id, method: 'invoice_id' };
    }
  }

  // Strategie 3: Betrag + Zeitfenster (fallback)
  // Betrag in Euro (mit Toleranz für Rundungsfehler: ±1 Cent)
  const amountEuro = amountCents / 100;
  const amountMin = amountEuro - 0.01;
  const amountMax = amountEuro + 0.01;

  // Zeitfenster: 7 Tage vor und nach dem Zahlungsdatum
  const dateMin = new Date(stripePaidAt);
  dateMin.setDate(dateMin.getDate() - 7);
  const dateMax = new Date(stripePaidAt);
  dateMax.setDate(dateMax.getDate() + 7);

  const amountMatch = await prisma.rechnung.findFirst({
    where: {
      bruttoBetrag: { gte: amountMin, lte: amountMax },
      status: 'offen',
      deletedAt: null,
      gdprRestricted: false,
      rechnungsDatum: { gte: dateMin, lte: dateMax },
      stripePaymentIntentId: null, // Noch nicht verknüpft
    },
    orderBy: { rechnungsDatum: 'desc' },
    select: { id: true },
  });

  if (amountMatch) {
    return { matched: true, rechnungId: amountMatch.id, method: 'amount_date' };
  }

  return { matched: false };
}

/**
 * Markiert eine Rechnung als bezahlt
 */
export async function markRechnungAsPaid(
  rechnungId: string,
  paymentIntentId: string,
  paidAt: Date
): Promise<void> {
  await prisma.$transaction([
    // Rechnung aktualisieren
    prisma.rechnung.update({
      where: { id: rechnungId },
      data: {
        status: 'bezahlt',
        paidAt: paidAt,
        paidViaMittel: 'stripe',
        stripePaymentIntentId: paymentIntentId,
      },
    }),
    // Audit-Log erstellen
    prisma.rechnungAuditLog.create({
      data: {
        rechnungId: rechnungId,
        action: 'PAYMENT_RECEIVED',
        field: 'status',
        oldValue: JSON.stringify('offen'),
        newValue: JSON.stringify('bezahlt'),
        userId: 'STRIPE_WEBHOOK',
        userName: 'Stripe Webhook',
      },
    }),
  ]);
}

/**
 * Erstellt einen UnmatchedPayment-Eintrag für Admin-Review
 */
export async function createUnmatchedPayment(
  paymentIntentId: string,
  eventId: string,
  amountCents: number,
  stripePaidAt: Date,
  rawEvent: unknown,
  customerId?: string | null,
  customerEmail?: string | null,
  invoiceId?: string | null,
  paymentMethodType?: string | null
): Promise<string> {
  // Mögliche Matches ermitteln (für Admin-Hilfe)
  const amountEuro = amountCents / 100;
  const possibleMatches = await prisma.rechnung.findMany({
    where: {
      status: 'offen',
      deletedAt: null,
      gdprRestricted: false,
      bruttoBetrag: { gte: amountEuro - 50, lte: amountEuro + 50 }, // ±50€ Toleranz
    },
    take: 5,
    orderBy: { rechnungsDatum: 'desc' },
    select: {
      id: true,
      nummer: true,
      bruttoBetrag: true,
      rechnungsDatum: true,
      auftrag: { select: { waldbesitzer: true } },
    },
  });

  const attemptedMatches = possibleMatches.map((r) => ({
    rechnungId: r.id,
    nummer: r.nummer,
    betrag: r.bruttoBetrag,
    datum: r.rechnungsDatum,
    waldbesitzer: r.auftrag?.waldbesitzer || null,
    score: Math.abs((r.bruttoBetrag || 0) - amountEuro), // Differenz als Score
  }));

  const unmatched = await prisma.unmatchedPayment.create({
    data: {
      stripePaymentIntentId: paymentIntentId,
      stripeEventId: eventId,
      amount: amountCents,
      currency: 'eur',
      stripeCustomerId: customerId,
      stripeCustomerEmail: customerEmail,
      stripeInvoiceId: invoiceId,
      paymentMethodType: paymentMethodType,
      attemptedMatches: attemptedMatches,
      rawEventData: rawEvent as object,
      stripePaidAt: stripePaidAt,
    },
  });

  return unmatched.id;
}

/**
 * Prüft ob ein Stripe Event bereits verarbeitet wurde (Idempotency)
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.paymentRecord.findUnique({
    where: { stripeEventId: eventId },
  });
  return !!existing;
}
