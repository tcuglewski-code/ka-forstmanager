"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TreePine, Loader2, ArrowLeft, CheckCircle } from "lucide-react"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.")
      return
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login?reset=success")
      }, 2000)
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
        <h2 className="text-lg font-semibold text-white mb-1">Ungültiger Link</h2>
        <p className="text-sm text-zinc-400 mt-4">
          Der Link zum Zurücksetzen des Passworts ist ungültig oder fehlt.
        </p>
        <a
          href="/forgot-password"
          className="mt-6 w-full py-2.5 px-4 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          Neuen Link anfordern
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Passwort zurückgesetzt</h2>
        </div>
        <p className="text-sm text-zinc-400">
          Dein Passwort wurde erfolgreich geändert. Du wirst zur Anmeldung weitergeleitet...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
      <h2 className="text-lg font-semibold text-white mb-1">Neues Passwort vergeben</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Gib dein neues Passwort ein (mindestens 8 Zeichen).
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-zinc-400 mb-1.5">
            Neues Passwort
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            autoFocus
            placeholder="Mindestens 8 Zeichen"
            className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-zinc-400 mb-1.5">
            Passwort bestätigen
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Passwort wiederholen"
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
              Wird gespeichert...
            </>
          ) : (
            "Passwort speichern"
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
    </div>
  )
}

export default function ResetPasswordPage() {
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

        <Suspense
          fallback={
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-xs text-zinc-600 mt-6">
          &copy; 2026 Koch Aufforstung GmbH — ForstManager v1.0
        </p>
      </div>
    </div>
  )
}
