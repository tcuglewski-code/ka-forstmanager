"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { TreePine, Loader2, Mail, CheckCircle, XCircle } from "lucide-react"

function MagicLinkContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "request" | "success" | "error" | "sent">("loading")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [debugLink, setDebugLink] = useState("")

  useEffect(() => {
    if (token) {
      // Token vorhanden → validieren
      validateToken(token)
    } else {
      // Kein Token → Anfrage-Formular zeigen
      setStatus("request")
    }
  }, [token])

  const validateToken = async (t: string) => {
    try {
      // Schritt 1: Token validieren und Auth-Code erhalten
      const res = await fetch("/api/auth/magic-link/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Ungültiger oder abgelaufener Link")
        setStatus("error")
        return
      }

      // Schritt 2: Mit Auth-Code bei NextAuth einloggen
      const signInResult = await signIn("magic-link", {
        authCode: data.authCode,
        redirect: false,
      })

      if (signInResult?.error) {
        setError("Anmeldung fehlgeschlagen")
        setStatus("error")
        return
      }

      setStatus("success")
      // Redirect zum Dashboard nach kurzer Verzögerung
      setTimeout(() => {
        router.push("/kunde/dashboard")
        router.refresh()
      }, 1500)
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
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2C3A1C] mb-4">
            <TreePine className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">ForstManager</h1>
          <p className="text-sm text-zinc-400 mt-1">Koch Aufforstung GmbH</p>
        </div>

        {/* Content Card */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
              <p className="text-zinc-400">Link wird überprüft...</p>
            </div>
          )}

          {/* Request Form */}
          {status === "request" && (
            <>
              <div className="flex items-center gap-3 mb-1">
                <Mail className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Kundenbereich</h2>
              </div>
              <p className="text-sm text-zinc-500 mb-6">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Login-Link.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ihre-email@beispiel.de"
                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
              <p className="text-sm text-zinc-400 mb-4">
                Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Login-Link gesendet.
              </p>
              <p className="text-sm text-zinc-500">
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
                className="mt-6 text-sm text-zinc-400 hover:text-white transition-colors"
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
              <p className="text-sm text-zinc-400">
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
              <p className="text-sm text-zinc-400 mb-4">
                {error || "Der Link ist ungültig oder abgelaufen."}
              </p>
              <button
                onClick={() => {
                  setStatus("request")
                  setError("")
                }}
                className="py-2.5 px-4 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white font-medium rounded-lg transition-all"
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
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    }>
      <MagicLinkContent />
    </Suspense>
  )
}
