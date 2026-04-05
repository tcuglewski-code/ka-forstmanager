/**
 * Stornorechnung-Route
 * Sprint KG PO-02: Refund-Handling
 * 
 * POST /api/rechnungen/:id/stornieren
 * Storniert eine Rechnung und erstellt optional eine Gutschrift
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface StornoRequest {
  grund?: string;
  stripeRefundId?: string;
  teilbetrag?: number; // Optional: Teilstorno in Euro
  erstelleGutschrift?: boolean; // Optional: Gutschrift-Rechnung erstellen
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Auth check - entweder User-Session oder Stripe Webhook (internal)
    const isStripeWebhook = request.headers.get('x-stripe-webhook') === 'true';
    
    if (!session?.user && !isStripeWebhook) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: StornoRequest = await request.json().catch(() => ({}));
    
    const {
      grund = 'Manuelle Stornierung',
      stripeRefundId,
      teilbetrag,
      erstelleGutschrift = true,
    } = body;

    // Rechnung laden
    const rechnung = await prisma.rechnung.findUnique({
      where: { id },
      include: {
        positionen: true,
        auftrag: { select: { id: true, waldbesitzer: true } },
      },
    });

    if (!rechnung) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    // Prüfungen
    if (rechnung.deletedAt) {
      return NextResponse.json(
        { error: 'Rechnung wurde bereits gelöscht' },
        { status: 400 }
      );
    }

    if (rechnung.status === 'storniert') {
      return NextResponse.json(
        { error: 'Rechnung ist bereits storniert' },
        { status: 400 }
      );
    }

    // Stornobetrag berechnen
    const stornoBetrag = teilbetrag 
      ? Math.min(teilbetrag, rechnung.bruttoBetrag || rechnung.betrag)
      : (rechnung.bruttoBetrag || rechnung.betrag);

    const isTeilstorno = teilbetrag && teilbetrag < (rechnung.bruttoBetrag || rechnung.betrag);
    const userId = session?.user?.id || 'STRIPE_WEBHOOK';
    const userName = session?.user?.name || 'Stripe Refund';

    // Transaction: Stornierung durchführen
    const result = await prisma.$transaction(async (tx) => {
      // 1. Original-Rechnung stornieren (oder Teilstorno-Vermerk)
      const updatedRechnung = await tx.rechnung.update({
        where: { id },
        data: {
          status: isTeilstorno ? 'teilstorniert' : 'storniert',
          notizen: rechnung.notizen 
            ? `${rechnung.notizen}\n\n[STORNO ${new Date().toISOString()}]: ${grund}${stripeRefundId ? ` (Stripe Refund: ${stripeRefundId})` : ''}`
            : `[STORNO ${new Date().toISOString()}]: ${grund}${stripeRefundId ? ` (Stripe Refund: ${stripeRefundId})` : ''}`,
        },
      });

      // 2. Audit-Log erstellen
      await tx.rechnungAuditLog.create({
        data: {
          rechnungId: id,
          action: isTeilstorno ? 'PARTIAL_STORNO' : 'STORNO',
          field: 'status',
          oldValue: JSON.stringify(rechnung.status),
          newValue: JSON.stringify(isTeilstorno ? 'teilstorniert' : 'storniert'),
          userId,
          userName,
          metadata: JSON.stringify({
            grund,
            stripeRefundId,
            stornoBetrag,
            isTeilstorno,
          }),
        },
      });

      // 3. Gutschrift erstellen (negative Rechnung)
      let gutschrift = null;
      if (erstelleGutschrift) {
        // Neue Rechnungsnummer generieren (STORNO-Prefix)
        const stornoNummer = `STORNO-${rechnung.nummer}`;
        
        // Prüfen ob Storno-Nummer bereits existiert
        const existingStorno = await tx.rechnung.findUnique({
          where: { nummer: stornoNummer },
        });

        if (!existingStorno) {
          gutschrift = await tx.rechnung.create({
            data: {
              nummer: stornoNummer,
              auftragId: rechnung.auftragId,
              betrag: -stornoBetrag,
              mwst: rechnung.mwst,
              status: 'gutschrift',
              rechnungsDatum: new Date(),
              nettoBetrag: rechnung.nettoBetrag ? -(stornoBetrag / (1 + rechnung.mwst / 100)) : null,
              bruttoBetrag: -stornoBetrag,
              notizen: `Gutschrift zu Rechnung ${rechnung.nummer}${grund ? `: ${grund}` : ''}${stripeRefundId ? ` (Stripe Refund: ${stripeRefundId})` : ''}`,
              zahlungsBedingung: 'Gutschrift',
              lockedAt: new Date(), // Sofort sperren (GoBD)
              lockedBy: 'SYSTEM',
              lockReason: 'Automatische Gutschrift - GoBD-konform',
            },
          });

          // Gutschrift Audit-Log
          await tx.rechnungAuditLog.create({
            data: {
              rechnungId: gutschrift.id,
              action: 'CREATE',
              field: 'all',
              oldValue: null,
              newValue: JSON.stringify({ 
                type: 'gutschrift',
                originalRechnung: rechnung.nummer,
                betrag: -stornoBetrag,
              }),
              userId,
              userName,
            },
          });
        }
      }

      // 4. PaymentRecord aktualisieren wenn vorhanden
      if (rechnung.stripePaymentIntentId) {
        await tx.paymentRecord.updateMany({
          where: { 
            stripePaymentIntentId: rechnung.stripePaymentIntentId,
          },
          data: {
            status: isTeilstorno ? 'partially_refunded' : 'refunded',
          },
        });
      }

      // 5. Activity-Log
      await tx.activityLog.create({
        data: {
          action: 'RECHNUNG_STORNIERT',
          entityType: 'rechnung',
          entityId: id,
          entityName: `Rechnung ${rechnung.nummer}${isTeilstorno ? ' (Teilstorno)' : ''} storniert`,
          metadata: JSON.stringify({
            originalBetrag: rechnung.bruttoBetrag || rechnung.betrag,
            stornoBetrag,
            grund,
            stripeRefundId,
            gutschriftId: gutschrift?.id,
            gutschriftNummer: gutschrift?.nummer,
          }),
        },
      });

      return {
        rechnung: updatedRechnung,
        gutschrift,
        stornoBetrag,
        isTeilstorno,
      };
    });

    return NextResponse.json({
      success: true,
      message: result.isTeilstorno 
        ? `Rechnung ${rechnung.nummer} teilweise storniert (${result.stornoBetrag.toFixed(2)} €)`
        : `Rechnung ${rechnung.nummer} vollständig storniert`,
      data: {
        rechnungId: id,
        rechnungNummer: rechnung.nummer,
        neuerStatus: result.rechnung.status,
        stornoBetrag: result.stornoBetrag,
        isTeilstorno: result.isTeilstorno,
        gutschrift: result.gutschrift ? {
          id: result.gutschrift.id,
          nummer: result.gutschrift.nummer,
          betrag: result.gutschrift.betrag,
        } : null,
      },
    });

  } catch (error) {
    console.error('[Stornieren API] Error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// GET für Info über mögliche Stornierung
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const rechnung = await prisma.rechnung.findUnique({
      where: { id },
      select: {
        id: true,
        nummer: true,
        status: true,
        betrag: true,
        bruttoBetrag: true,
        stripePaymentIntentId: true,
        paidAt: true,
        lockedAt: true,
        deletedAt: true,
      },
    });

    if (!rechnung) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    // Prüfen ob Stornierung möglich
    const kannStornieren = !rechnung.deletedAt && rechnung.status !== 'storniert' && rechnung.status !== 'gutschrift';
    const gruende: string[] = [];

    if (rechnung.deletedAt) gruende.push('Rechnung wurde gelöscht');
    if (rechnung.status === 'storniert') gruende.push('Rechnung ist bereits storniert');
    if (rechnung.status === 'gutschrift') gruende.push('Gutschriften können nicht storniert werden');

    return NextResponse.json({
      rechnungId: rechnung.id,
      nummer: rechnung.nummer,
      status: rechnung.status,
      betrag: rechnung.bruttoBetrag || rechnung.betrag,
      kannStornieren,
      gruende: kannStornieren ? [] : gruende,
      hatStripeZahlung: !!rechnung.stripePaymentIntentId,
      istGesperrt: !!rechnung.lockedAt,
    });

  } catch (error) {
    console.error('[Stornieren Info API] Error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
