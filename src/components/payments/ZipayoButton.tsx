"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, X, CheckCircle, Loader2, XCircle, QrCode, Smartphone } from "lucide-react"

interface ZipayoButtonProps {
  amount: number // in Euro (not cents!)
  description: string
  invoiceId?: string
  onPaymentSuccess?: (paymentId: string) => void
  onPaymentFailed?: () => void
  variant?: "compact" | "full" // compact = kleiner Button, full = großer CTA
}

interface PaymentResponse {
  paymentId: string
  qrUrl: string
  payUrl: string
  amount: number
  expiresAt: string | null
}

interface PaymentStatus {
  paymentId: string
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded"
  amount: number
  paidAt: string | null
}

// Zipayo Platform API (ehemals SwiftTap)
const ZIPAYO_API_URL = "https://swifttap-app.vercel.app/api/v1"

export default function ZipayoButton({
  amount,
  description,
  invoiceId,
  onPaymentSuccess,
  onPaymentFailed,
  variant = "compact",
}: ZipayoButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [status, setStatus] = useState<"pending" | "succeeded" | "failed" | "expired">("pending")
  const [error, setError] = useState<string | null>(null)

  // Zipayo API Key (ehemals SwiftTap)
  const apiKey = process.env.NEXT_PUBLIC_SWIFTTAP_API_KEY || process.env.NEXT_PUBLIC_ZIPAYO_API_KEY

  // Create payment request
  const createPayment = useCallback(async () => {
    if (!apiKey) {
      setError("Zipayo API-Key nicht konfiguriert")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${ZIPAYO_API_URL}/payment-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SwiftTap-Key": apiKey, // Header bleibt für API-Kompatibilität
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          description: invoiceId ? `${description} (${invoiceId})` : description,
          expiresInMinutes: 30,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Zahlung konnte nicht erstellt werden")
      }

      const data: PaymentResponse = await res.json()
      setPayment(data)
      setStatus("pending")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verbindungsfehler"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [amount, description, invoiceId, apiKey])

  // Poll for payment status
  useEffect(() => {
    if (!payment || status !== "pending" || !apiKey) return

    const pollStatus = async () => {
      try {
        const res = await fetch(`${ZIPAYO_API_URL}/payment-status/${payment.paymentId}`, {
          headers: { "X-SwiftTap-Key": apiKey },
        })

        if (!res.ok) return

        const data: PaymentStatus = await res.json()

        if (data.status === "succeeded") {
          setStatus("succeeded")
          onPaymentSuccess?.(payment.paymentId)
        } else if (data.status === "failed" || data.status === "cancelled") {
          setStatus("failed")
          onPaymentFailed?.()
        }
      } catch {
        // Continue polling on error
      }
    }

    // Check for expiration
    if (payment.expiresAt) {
      const expiresAt = new Date(payment.expiresAt)
      if (expiresAt < new Date()) {
        setStatus("expired")
        return
      }
    }

    const interval = setInterval(pollStatus, 3000)
    pollStatus() // Initial check

    return () => clearInterval(interval)
  }, [payment, status, apiKey, onPaymentSuccess, onPaymentFailed])

  const openModal = async () => {
    setModalOpen(true)
    setPayment(null)
    setStatus("pending")
    setError(null)
    await createPayment()
  }

  const closeModal = () => {
    setModalOpen(false)
    setPayment(null)
    setStatus("pending")
    setError(null)
  }

  const formatAmount = (cents: number) => {
    return (cents / 100).toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
    })
  }

  return (
    <>
      {/* Zipayo Button */}
      {variant === "compact" ? (
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#6366f1]/20 text-[#818cf8] rounded-lg text-xs font-medium hover:bg-[#6366f1]/30 transition-colors"
          title="Jetzt mit Zipayo bezahlen"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Zipayo
        </button>
      ) : (
        <button
          onClick={openModal}
          className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl text-base font-semibold hover:from-[#5558e8] hover:to-[#7c4fe3] transition-all shadow-lg shadow-[#6366f1]/25"
        >
          <Smartphone className="w-5 h-5" />
          Jetzt mit Zipayo bezahlen
        </button>
      )}

      {/* Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">Zipayo</span>
              </div>
              <button onClick={closeModal} className="text-[var(--color-on-surface-variant)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-10 h-10 text-[#818cf8] animate-spin mb-4" />
                  <p className="text-[var(--color-on-surface-variant)]">Zahlung wird erstellt...</p>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center py-8">
                  <XCircle className="w-12 h-12 text-red-400 mb-4" />
                  <p className="text-red-400 text-center">{error}</p>
                  <button
                    onClick={createPayment}
                    className="mt-4 px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#5558e8]"
                  >
                    Erneut versuchen
                  </button>
                </div>
              )}

              {payment && status === "pending" && (
                <div className="flex flex-col items-center">
                  {/* Amount */}
                  <div className="text-3xl font-bold text-white mb-6">
                    {formatAmount(payment.amount)}
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-xl mb-4">
                    <img
                      src={payment.qrUrl}
                      alt="QR-Code für Zahlung"
                      className="w-48 h-48"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
                      <QrCode className="w-4 h-4" />
                      <span className="text-sm">QR-Code scannen zum Bezahlen</span>
                    </div>
                    <p className="text-xs text-zinc-600">{description}</p>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Warte auf Zahlung...
                  </div>

                  {/* Direct pay link */}
                  <a
                    href={payment.payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-xs text-[#818cf8] hover:underline"
                  >
                    Oder Link zum Bezahlen öffnen →
                  </a>
                </div>
              )}

              {status === "succeeded" && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Zahlung erfolgreich!</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-center">
                    {formatAmount(payment?.amount || 0)} wurde bezahlt
                  </p>
                  <button
                    onClick={closeModal}
                    className="mt-6 px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
                  >
                    Schließen
                  </button>
                </div>
              )}

              {status === "failed" && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Zahlung fehlgeschlagen</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-center">
                    Die Zahlung konnte nicht abgeschlossen werden
                  </p>
                  <button
                    onClick={createPayment}
                    className="mt-4 px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#5558e8]"
                  >
                    Erneut versuchen
                  </button>
                </div>
              )}

              {status === "expired" && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-10 h-10 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Zahlung abgelaufen</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-center">
                    Der QR-Code ist nicht mehr gültig
                  </p>
                  <button
                    onClick={createPayment}
                    className="mt-4 px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#5558e8]"
                  >
                    Neue Zahlung erstellen
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-[var(--color-surface-container-low)] border-t border-border text-center">
              <p className="text-xs text-zinc-600">
                Powered by Zipayo • Sichere Zahlung via Stripe
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
