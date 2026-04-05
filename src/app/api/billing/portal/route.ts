/**
 * Stripe Customer Billing Portal API
 * Sprint KI PO-05 / BO-01
 * 
 * Erstellt eine Stripe Billing Portal Session
 * Kunden können:
 * - Zahlungsmethode ändern
 * - Rechnungen einsehen
 * - Abo kündigen / pausieren
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Only admin/buero can access billing portal
    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'buero'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für Billing-Portal' },
        { status: 403 }
      );
    }

    // Get return URL from request body or default
    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/einstellungen`;

    // Get tenant for current user to find Stripe Customer ID
    // ka-forstmanager is single-tenant (Koch Aufforstung)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
      },
    });

    // Get tenant-level Stripe Customer
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'koch-aufforstung' }, // Single-tenant for now
      select: { 
        id: true,
        stripeCustomerId: true,
        name: true,
        contactEmail: true,
      },
    });

    // Use tenant stripeCustomerId (single-tenant setup)
    let stripeCustomerId = tenant?.stripeCustomerId;

    // If no customer ID exists, create one in Stripe
    if (!stripeCustomerId) {
      const stripe = getStripeClient();
      
      const customerEmail = tenant?.contactEmail || user?.email;
      const customerName = tenant?.name || user?.name || 'Koch Aufforstung';

      if (!customerEmail) {
        return NextResponse.json(
          { error: 'Keine E-Mail-Adresse für Stripe-Kundenerstellung vorhanden' },
          { status: 400 }
        );
      }

      // Check if customer already exists by email
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            source: 'forstmanager_billing_portal',
            userId: session.user.id,
            tenantSlug: 'koch-aufforstung',
          },
        });
        stripeCustomerId = newCustomer.id;
      }

      // Save customer ID to tenant
      if (tenant) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { stripeCustomerId },
        });
      }
    }

    // Create Billing Portal Session
    const stripe = getStripeClient();
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    // Log access
    await prisma.activityLog.create({
      data: {
        action: 'BILLING_PORTAL_ACCESS',
        entityType: 'billing',
        entityId: stripeCustomerId,
        entityName: 'Stripe Billing Portal aufgerufen',
        userId: session.user.id,
        metadata: JSON.stringify({
          userEmail: session.user.email,
          stripeCustomerId,
        }),
      },
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('[Billing Portal] Error:', error);
    
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    
    // Check for specific Stripe errors
    if (message.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Stripe ist nicht konfiguriert. Bitte wenden Sie sich an den Support.' },
        { status: 503 }
      );
    }

    if (message.includes('No such customer')) {
      return NextResponse.json(
        { error: 'Kein Stripe-Kundenkonto vorhanden.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET: Check if billing portal is available
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ available: false, reason: 'not_authenticated' });
    }

    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'buero'].includes(userRole || '')) {
      return NextResponse.json({ available: false, reason: 'no_permission' });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ available: false, reason: 'stripe_not_configured' });
    }

    // Check if tenant has Stripe Customer ID (single-tenant setup)
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'koch-aufforstung' },
      select: { stripeCustomerId: true },
    });

    const hasCustomerId = !!tenant?.stripeCustomerId;

    return NextResponse.json({
      available: true,
      hasCustomerId,
      canCreateCustomer: true,
    });

  } catch (error) {
    console.error('[Billing Portal Check] Error:', error);
    return NextResponse.json({ 
      available: false, 
      reason: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
