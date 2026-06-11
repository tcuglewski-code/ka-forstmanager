"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { TreePine, Loader2, Shield, Key } from "lucide-react"

// Hilfsfunktion um Redirect-URL basierend auf Rolle zu ermitteln
async function getRedirectUrl(): Promise<string> {
  try {
    const res = await fetch("/api/auth/session")
    if (res.ok) {
      const session = await res.json()
      if (session?.user?.role === "kunde") {
        return "/kunde/dashboard"
      }
    }
  } catch {
    // Fallback bei Fehler
  }
  return "/dashboard"
}

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
          // Redirect basierend auf Rolle
          const redirectUrl = await getRedirectUrl()
          router.push(redirectUrl)
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
          // Redirect basierend auf Rolle
          const redirectUrl = await getRedirectUrl()
          router.push(redirectUrl)
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
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-background)" }}>
      {/* ── Linke Spalte: Deep Forest Brand-Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[40%] p-12 bg-grid-dark"
        style={{ backgroundColor: "#1A2E1A" }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl"
              style={{ backgroundColor: "rgba(247,246,240,0.08)", border: "1px solid rgba(247,246,240,0.12)" }}
            >
              <TreePine className="w-6 h-6" style={{ color: "#C5A55A" }} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#C5A55A",
              }}
            >
              Feldhub Reforest
            </span>
          </div>
        </div>

        <div>
          <h1
            className="text-5xl leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#F7F6F0" }}
          >
            ForstManager
          </h1>
          <p
            className="mt-4 text-lg leading-relaxed max-w-md"
            style={{ fontFamily: "var(--font-body)", color: "rgba(247,246,240,0.7)" }}
          >
            Digitales Betriebssystem für Forstunternehmen
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Aufträge, Protokolle & Abnahmen — alles in einem System",
              "Offline-App für den Außendienst im Wald",
              "Förderberatung & Analytics auf Knopfdruck",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="moss-dot flex-shrink-0" />
                <span className="text-sm" style={{ color: "rgba(247,246,240,0.8)" }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(247,246,240,0.35)",
          }}
        >
          Koch Aufforstung GmbH · ForstManager v1.0
        </p>
      </div>

      {/* ── Rechte Spalte: Login-Formular auf Bone ── */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand — Mobile only */}
        <div className="text-center mb-8 lg:hidden">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ backgroundColor: "#1A2E1A" }}
          >
            <TreePine className="w-8 h-8" style={{ color: "#C5A55A" }} />
          </div>
          <h1
            className="text-2xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-on-surface)" }}
          >
            ForstManager
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Koch Aufforstung GmbH</p>
        </div>

        {/* Form Card */}
        <div className="bento-card p-8" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          {!requiresTwoFactor ? (
            <>
              <h2
                className="text-2xl mb-1"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-on-surface)" }}
              >
                Willkommen zurück
              </h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">
                Melden Sie sich mit Ihren Zugangsdaten an
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-5 h-5" style={{ color: "#8CAA1F" }} />
                <h2
                  className="text-xl"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-on-surface)" }}
                >
                  Zwei-Faktor-Authentifizierung
                </h2>
              </div>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">
                {useBackupCode
                  ? "Geben Sie einen Ihrer Backup-Codes ein"
                  : "Geben Sie den Code aus Ihrer Authenticator-App ein"}
              </p>
            </>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresTwoFactor ? (
              // Schritt 1: Email & Passwort
              <>
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-[var(--color-on-surface-variant)] mb-1.5">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="name@koch-aufforstung.de"
                    className="w-full px-4 py-2.5 bg-[#F2F1EB] border border-[rgba(26,46,26,0.15)] rounded-lg text-[var(--color-on-surface)] placeholder-[#9a9e97] focus:outline-none focus:ring-2 focus:ring-[#1A2E1A]/40 focus:border-[#1A2E1A] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-[var(--color-on-surface-variant)] mb-1.5">
                    Passwort
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#F2F1EB] border border-[rgba(26,46,26,0.15)] rounded-lg text-[var(--color-on-surface)] placeholder-[#9a9e97] focus:outline-none focus:ring-2 focus:ring-[#1A2E1A]/40 focus:border-[#1A2E1A] transition-all"
                  />
                </div>
              </>
            ) : (
              // Schritt 2: 2FA Token
              <>
                <div>
                  <label htmlFor="login-2fa-token" className="block text-sm font-medium text-[var(--color-on-surface-variant)] mb-1.5">
                    {useBackupCode ? "Backup-Code" : "Authentifizierungscode"}
                  </label>
                  <input
                    id="login-2fa-token"
                    type="text"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value.replace(/\s/g, ''))}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                    maxLength={useBackupCode ? 9 : 6}
                    className="w-full px-4 py-2.5 bg-[#F2F1EB] border border-[rgba(26,46,26,0.15)] rounded-lg text-[var(--color-on-surface)] text-center text-2xl tracking-widest placeholder-[#9a9e97] focus:outline-none focus:ring-2 focus:ring-[#1A2E1A]/40 focus:border-[#1A2E1A] transition-all"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
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
              className="btn-primary w-full py-2.5 px-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
                className="w-full text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            )}

            {!requiresTwoFactor && (
              <p className="text-center text-xs text-zinc-600 mt-3">
                <a href="/forgot-password" className="hover:text-[var(--color-on-surface-variant)] underline transition-colors">
                  Passwort vergessen?
                </a>
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--color-outline)" }}>
          © 2026 Koch Aufforstung GmbH — ForstManager v1.0
        </p>
        <p className="text-center text-xs mt-2" style={{ color: "var(--color-outline)" }}>
          <a 
            href="https://peru-otter-113714.hostingersite.com/datenschutz/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-[var(--color-on-surface-variant)] underline transition-colors"
          >
            Datenschutzerklärung
          </a>
          {" · "}
          <a 
            href="https://peru-otter-113714.hostingersite.com/impressum/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-[var(--color-on-surface-variant)] underline transition-colors"
          >
            Impressum
          </a>
        </p>
      </div>
      </div>
    </div>
  )
}
