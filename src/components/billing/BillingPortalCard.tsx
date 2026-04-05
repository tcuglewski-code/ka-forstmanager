/**
 * Billing Portal Card Component
 * Sprint KI PO-05 / BO-01
 * 
 * Zeigt Billing Portal Button für Admin/Büro
 */

"use client";

import { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BillingStatus {
  available: boolean;
  reason?: string;
  hasCustomerId?: boolean;
  canCreateCustomer?: boolean;
  message?: string;
}

export function BillingPortalCard() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    checkBillingStatus();
  }, []);

  async function checkBillingStatus() {
    try {
      const res = await fetch('/api/billing/portal');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ available: false, reason: 'error' });
    }
    setLoading(false);
  }

  async function openBillingPortal() {
    setRedirecting(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Öffnen des Billing Portals');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setRedirecting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
          <span className="text-zinc-400">Lade Billing-Informationen...</span>
        </div>
      </div>
    );
  }

  if (!status?.available) {
    return (
      <div className="p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="text-zinc-300 font-medium">Billing Portal nicht verfügbar</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {status?.reason === 'not_authenticated' && 'Bitte melden Sie sich an.'}
              {status?.reason === 'no_permission' && 'Nur Admin und Büro können auf das Billing Portal zugreifen.'}
              {status?.reason === 'stripe_not_configured' && 'Stripe ist noch nicht konfiguriert.'}
              {status?.reason === 'error' && (status.message || 'Ein Fehler ist aufgetreten.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-lg">
            <CreditCard className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-200">Stripe Billing Portal</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Verwalten Sie Ihr Abonnement, Zahlungsmethoden und sehen Sie alle Rechnungen ein.
            </p>
            
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm text-zinc-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Zahlungsmethode ändern
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Rechnungshistorie einsehen
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Rechnungsadresse aktualisieren
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Abonnement verwalten / kündigen
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={openBillingPortal}
          disabled={redirecting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 
                     disabled:bg-zinc-700 disabled:cursor-not-allowed
                     text-white text-sm font-medium rounded-lg transition-colors"
        >
          {redirecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Öffne Portal...
            </>
          ) : (
            <>
              Portal öffnen
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {!status.hasCustomerId && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <strong>Hinweis:</strong> Beim ersten Öffnen wird automatisch ein Stripe-Kundenkonto erstellt.
          </p>
        </div>
      )}
    </div>
  );
}
