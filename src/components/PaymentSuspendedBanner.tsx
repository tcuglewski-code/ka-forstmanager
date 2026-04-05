/**
 * Payment Suspended Banner (Sprint KH PO-04)
 * 
 * Zeigt Nutzern an wenn ihr Tenant wegen Zahlungsproblemen gesperrt ist.
 * Blockiert alle Schreibaktionen (readonly mode).
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, ExternalLink } from 'lucide-react';

interface TenantPaymentStatus {
  status: 'active' | 'payment_suspended' | 'grace_period' | 'cancelled' | 'archived';
  paymentSuspendedAt?: string;
  stripeCustomerId?: string;
  contactEmail?: string;
  dunningCurrentAttempt?: number;
  dunningMaxRetries?: number;
}

export function PaymentSuspendedBanner() {
  const [status, setStatus] = useState<TenantPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/tenant/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Error fetching tenant status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  // Don't show anything while loading or if not suspended
  if (loading || !status || status.status !== 'payment_suspended') {
    return null;
  }

  const suspendedDate = status.paymentSuspendedAt 
    ? new Date(status.paymentSuspendedAt).toLocaleDateString('de-DE')
    : 'unbekannt';

  // Stripe Customer Portal URL (wenn verfügbar)
  const portalUrl = status.stripeCustomerId 
    ? `/api/stripe/portal?customerId=${status.stripeCustomerId}`
    : null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              Account gesperrt wegen Zahlungsausfall
            </p>
            <p className="text-sm text-red-100">
              Seit {suspendedDate}. Bitte aktualisieren Sie Ihre Zahlungsmethode um den Zugriff wiederherzustellen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {portalUrl && (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-red-50 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Zahlung aktualisieren
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          
          {status.contactEmail && (
            <a
              href={`mailto:${status.contactEmail}?subject=Account-Sperre`}
              className="text-red-100 hover:text-white text-sm underline"
            >
              Support kontaktieren
            </a>
          )}
        </div>
      </div>

      {/* Readonly Warning */}
      <div className="max-w-7xl mx-auto mt-2 text-sm text-red-100 border-t border-red-500 pt-2">
        ⚠️ Alle Daten sind schreibgeschützt. Sie können vorhandene Daten einsehen und exportieren, aber keine neuen Einträge erstellen oder ändern.
      </div>
    </div>
  );
}

/**
 * Hook um Payment Suspension Status in anderen Komponenten zu prüfen
 */
export function usePaymentSuspended(): boolean {
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/tenant/status');
        if (res.ok) {
          const data = await res.json();
          setIsSuspended(data.status === 'payment_suspended');
        }
      } catch {
        // Ignore errors, assume not suspended
      }
    }

    checkStatus();
  }, []);

  return isSuspended;
}

/**
 * Provider für Readonly-Modus bei Zahlungssuspendierung
 * Wrapper für die gesamte App
 */
export function PaymentSuspendedProvider({ children }: { children: React.ReactNode }) {
  const isSuspended = usePaymentSuspended();

  // Add CSS class to body for global styling
  useEffect(() => {
    if (isSuspended) {
      document.body.classList.add('payment-suspended-readonly');
    } else {
      document.body.classList.remove('payment-suspended-readonly');
    }

    return () => {
      document.body.classList.remove('payment-suspended-readonly');
    };
  }, [isSuspended]);

  return <>{children}</>;
}
