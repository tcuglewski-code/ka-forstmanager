"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { TreePine, Loader2, Shield, Key } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpToken, setTotpToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // 2FA Flow States
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!requiresTwoFactor) {
        // Schritt 1: Prüfe ob 2FA erforderlich ist
        const checkRes = await fetch("/api/auth/2fa/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
        
        const checkData = await checkRes.json()
        
        if (!checkRes.ok) {
          setError(checkData.error || "Ungültige Anmeldedaten")
          setLoading(false)
          return
        }

        if (checkData.requiresTwoFactor) {
          // 2FA erforderlich → zeige Token-Eingabe
          setRequiresTwoFactor(true)
          setLoading(false)
          return
        }

        // Kein 2FA → direkt anmelden
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("Ungültige Anmeldedaten. Bitte erneut versuchen.")
        } else {
          router.push("/dashboard")
          router.refresh()
        }
      } else {
        // Schritt 2: 2FA Token validieren
        const validateRes = await fetch("/api/auth/2fa/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            password, 
            token: totpToken,
            isBackupCode: useBackupCode
          })
        })

        const validateData = await validateRes.json()

        if (!validateRes.ok) {
          setError(validateData.error || "Ungültiger Code")
          setLoading(false)
          return
        }

        // 2FA erfolgreich → jetzt anmelden
        // Wir nutzen einen speziellen Parameter um 2FA-bypass zu signalisieren
        const result = await signIn("credentials", {
          email,
          password,
          twoFactorValidated: "true",
          redirect: false,
        })

        if (result?.error) {
          setError("Anmeldung fehlgeschlagen. Bitte erneut versuchen.")
        } else {
          router.push("/dashboard")
          router.refresh()
        }
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false)
    setTotpToken("")
    setUseBackupCode(false)
    setError("")
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
          {!requiresTwoFactor ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Anmelden</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Melden Sie sich mit Ihren Zugangsdaten an
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Zwei-Faktor-Authentifizierung</h2>
              </div>
              <p className="text-sm text-zinc-500 mb-6">
                {useBackupCode 
                  ? "Geben Sie einen Ihrer Backup-Codes ein" 
                  : "Geben Sie den Code aus Ihrer Authenticator-App ein"}
              </p>
            </>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresTwoFactor ? (
              // Schritt 1: Email & Passwort
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@koch-aufforstung.de"
                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Passwort
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </>
            ) : (
              // Schritt 2: 2FA Token
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    {useBackupCode ? "Backup-Code" : "Authentifizierungscode"}
                  </label>
                  <input
                    type="text"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value.replace(/\s/g, ''))}
                    required
                    autoFocus
                    placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                    maxLength={useBackupCode ? 9 : 6}
                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <Key className="w-4 h-4" />
                  {useBackupCode 
                    ? "Authenticator-App verwenden" 
                    : "Backup-Code verwenden"}
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {requiresTwoFactor ? "Wird überprüft..." : "Wird angemeldet..."}
                </>
              ) : (
                requiresTwoFactor ? "Verifizieren" : "Anmelden"
              )}
            </button>

            {requiresTwoFactor && (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            )}

            {!requiresTwoFactor && (
              <p className="text-center text-xs text-zinc-600 mt-3">
                Passwort vergessen? Kontaktiere den Administrator.
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © 2026 Koch Aufforstung GmbH — ForstManager v1.0
        </p>
      </div>
    </div>
  )
}
