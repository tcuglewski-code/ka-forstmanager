"use client"

import { useState } from "react"
import { TreePine, Loader2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError("Ein Fehler ist aufgetreten. Bitte erneut versuchen.")
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2C3A1C] mb-4">
            <TreePine className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">ForstManager</h1>
          <p className="text-sm text-zinc-400 mt-1">Koch Aufforstung GmbH</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
          {submitted ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">E-Mail gesendet</h2>
              <p className="text-sm text-zinc-400 mt-4">
                Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine Nachricht mit einem Link zum Zurücksetzen des Passworts gesendet.
              </p>
              <p className="text-sm text-zinc-500 mt-3">
                Bitte überprüfe auch deinen Spam-Ordner.
              </p>
              <a
                href="/login"
                className="mt-6 w-full py-2.5 px-4 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Anmeldung
              </a>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Passwort vergessen</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-zinc-400 mb-1.5">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="name@koch-aufforstung.de"
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
                    "Link senden"
                  )}
                </button>

                <a
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Zurück zur Anmeldung
                </a>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          &copy; 2026 Koch Aufforstung GmbH — ForstManager v1.0
        </p>
      </div>
    </div>
  )
}
