"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TreePine, Loader2, Mail, CheckCircle, XCircle } from "lucide-react"

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Auth-Code fehlt. Bitte fordere einen neuen Link an.",
  invalid: "Der Link ist ungültig oder bereits verwendet.",
  expired: "Der Link ist abgelaufen. Bitte fordere einen neuen Link an.",
  signin: "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
}

function MagicLinkContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const errorParam = searchParams.get("error")

  const [status, setStatus] = useState<"loading" | "request" | "success" | "error" | "sent">("loading")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [debugLink, setDebugLink] = useState("")

  useEffect(() => {
    // Error-Param aus URL (vom Callback-Redirect bei Fehler)
    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || "Ein Fehler ist aufgetreten")
      setStatus("error")
      return
    }
    if (token) {
      // Token vorhanden → validieren
      validateToken(token)
    } else {
      // Kein Token → Anfrage-Formular zeigen
      setStatus("request")
    }
  }, [token, errorParam])

  const validateToken = async (t: string) => {
    setStatus("loading")
    try {
      // Schritt 1: Token-Vorab-Prüfung (verbraucht den Magic-Token, erstellt auth_ Token)
      const checkRes = await fetch("/api/auth/magic-link/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      })

      const data = await checkRes.json()

      if (!checkRes.ok || !data.success) {
        setError(data.error || "Ungültiger oder abgelaufener Link")
        setStatus("error")
        return
      }

      // Schritt 2: Server-Side Callback (zuverlässiger als Client-Side signIn)
      // Full Page Reload erzwingt frische NextAuth-Session-Prüfung
      window.location.href = `/api/auth/magic-link/callback?authCode=${encodeURIComponent(data.authCode)}`
    } catch {
      setError("Ein Fehler ist aufgetreten")
      setStatus("error")
    }
  }

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setDebugLink("")

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus("sent")
        // Debug-Link für Tests (wenn vorhanden)
        if (data.debugLink) {
          setDebugLink(data.debugLink)
        }
      } else {
        setError(data.error || "Ein Fehler ist aufgetreten")
      }
    } catch {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-low)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-forest mb-4">
            <TreePine className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">ForstManager</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Koch Aufforstung GmbH</p>
        </div>

        {/* Content Card */}
        <div className="bg-[var(--color-surface-container)] border border-border rounded-2xl p-8">
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
              <p className="text-[var(--color-on-surface-variant)]">Link wird überprüft...</p>
            </div>
          )}

          {/* Request Form */}
          {status === "request" && (
            <>
              <div className="flex items-center gap-3 mb-1">
                <Mail className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Kundenbereich</h2>
              </div>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Login-Link.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface-variant)] mb-1.5">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ihre-email@beispiel.de"
                    className="w-full px-4 py-2.5 bg-[var(--color-surface-container-low)] border border-border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-forest hover:bg-[#3a4d26] text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    "Login-Link anfordern"
                  )}
                </button>
              </form>

              {/* Info für Bestandskunden */}
              <div className="mt-6 p-4 bg-[var(--color-surface-container-low)] border border-border rounded-xl text-sm text-[var(--color-on-surface-variant)] space-y-2">
                <p className="font-medium text-white text-xs uppercase tracking-wide mb-2">ℹ️ Kein Zugang?</p>
                <p>Ihr Zugang wird automatisch nach Ihrer ersten Anfrage über unsere Website angelegt. Nutzen Sie dabei dieselbe E-Mail-Adresse.</p>
                <p>Bei Fragen: <a href="mailto:info@koch-aufforstung.de" className="text-emerald-400 hover:underline">info@koch-aufforstung.de</a></p>
              </div>

              <p className="text-center text-xs text-zinc-600 mt-4">
                Der Link ist 24 Stunden gültig.
              </p>
            </>
          )}

          {/* Link Sent */}
          {status === "sent" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">E-Mail gesendet!</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
                Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Login-Link gesendet.
              </p>
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                Bitte prüfen Sie auch Ihren Spam-Ordner.
              </p>

              {/* Debug-Link für Tests (wenn kein RESEND_API_KEY) */}
              {debugLink && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400 mb-2">
                    ⚠️ Test-Modus (kein E-Mail-Versand konfiguriert)
                  </p>
                  <a 
                    href={debugLink}
                    className="text-sm text-emerald-400 hover:underline break-all"
                  >
                    → Hier klicken zum Testen
                  </a>
                </div>
              )}

              <button
                onClick={() => setStatus("request")}
                className="mt-6 text-sm text-[var(--color-on-surface-variant)] hover:text-white transition-colors"
              >
                Andere E-Mail-Adresse verwenden
              </button>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Erfolgreich angemeldet!</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                Sie werden zum Dashboard weitergeleitet...
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Link ungültig</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
                {error || "Der Link ist ungültig oder abgelaufen."}
              </p>
              <button
                onClick={() => {
                  setStatus("request")
                  setError("")
                }}
                className="py-2.5 px-4 bg-forest hover:bg-[#3a4d26] text-white font-medium rounded-lg transition-all"
              >
                Neuen Link anfordern
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © 2026 Koch Aufforstung GmbH — ForstManager
        </p>
      </div>
    </div>
  )
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-surface-container-low)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    }>
      <MagicLinkContent />
    </Suspense>
  )
}
