"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import {
  User,
  Mail,
  Lock,
  Bell,
  HelpCircle,
  Settings,
  Users,
  Shield,
  Save,
  Loader2,
  Camera,
  Check,
  Eye,
  EyeOff,
  Smartphone,
  Key,
  Copy,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  Phone,
  MapPin,
  Heart,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resetAndStartTour } from "@/components/tour/ForstManagerTour"

interface MitarbeiterData {
  id: string
  vorname: string
  nachname: string
  telefon?: string
  mobil?: string
  adresse?: string
  plz?: string
  ort?: string
  geburtsdatum?: string
  eintrittsdatum?: string
  stundenlohn?: number
  notfallName?: string
  notfallTelefon?: string
  notfallBeziehung?: string
}

interface ArbeitszeitkontoData {
  monat: string
  sollStunden: number
  istStunden: number
  differenz: number
}

interface UrlaubstageData {
  jahr: number
  anspruch: number
  genommen: number
  rest: number
}

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  notifyMaengel: boolean
  notifyAuftraege: boolean
  notifyAbnahmen: boolean
  lastLoginAt?: string
  createdAt: string
  twoFactorEnabled: boolean
  twoFactorVerifiedAt?: string
  mitarbeiter?: MitarbeiterData
  arbeitszeitkonto?: ArbeitszeitkontoData
  urlaubstage?: UrlaubstageData
}

export default function ProfilPage() {
  const { data: session, update: updateSession } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form States
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [notifyMaengel, setNotifyMaengel] = useState(true)
  const [notifyAuftraege, setNotifyAuftraege] = useState(true)
  const [notifyAbnahmen, setNotifyAbnahmen] = useState(false)
  
  // Sprint Q044: Kontaktdaten States
  const [telefon, setTelefon] = useState("")
  const [mobil, setMobil] = useState("")
  const [adresse, setAdresse] = useState("")
  const [plz, setPlz] = useState("")
  const [ort, setOrt] = useState("")
  
  // Sprint Q044: Notfallkontakt States
  const [notfallName, setNotfallName] = useState("")
  const [notfallTelefon, setNotfallTelefon] = useState("")
  const [notfallBeziehung, setNotfallBeziehung] = useState("")

  // Password States
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)

  // 2FA States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [totpToken, setTotpToken] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = session?.user && (session.user as { role?: string }).role === "ka_admin"

  // Load Profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profil")
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setName(data.name)
          setAvatar(data.avatar)
          setNotifyMaengel(data.notifyMaengel ?? true)
          setNotifyAuftraege(data.notifyAuftraege ?? true)
          setNotifyAbnahmen(data.notifyAbnahmen ?? false)
          setTwoFactorEnabled(data.twoFactorEnabled ?? false)
          // Sprint Q044: Mitarbeiter-Daten
          if (data.mitarbeiter) {
            setTelefon(data.mitarbeiter.telefon || "")
            setMobil(data.mitarbeiter.mobil || "")
            setAdresse(data.mitarbeiter.adresse || "")
            setPlz(data.mitarbeiter.plz || "")
            setOrt(data.mitarbeiter.ort || "")
            setNotfallName(data.mitarbeiter.notfallName || "")
            setNotfallTelefon(data.mitarbeiter.notfallTelefon || "")
            setNotfallBeziehung(data.mitarbeiter.notfallBeziehung || "")
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  // Save Profile
  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatar,
          notifyMaengel,
          notifyAuftraege,
          notifyAbnahmen,
          // Sprint Q044: Kontaktdaten
          telefon,
          mobil,
          adresse,
          plz,
          ort,
          // Sprint Q044: Notfallkontakt
          notfallName,
          notfallTelefon,
          notfallBeziehung,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        setMessage({ type: "success", text: "Profil gespeichert!" })
        // Update Session
        await updateSession({ name })
      } else {
        const err = await res.json()
        setMessage({ type: "error", text: err.error || "Speichern fehlgeschlagen" })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setSaving(false)
    }
  }

  // Change Password
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwörter stimmen nicht überein" })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Passwort muss mindestens 8 Zeichen haben" })
      return
    }

    setPasswordChanging(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      if (res.ok) {
        setMessage({ type: "success", text: "Passwort geändert!" })
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setShowPasswordForm(false)
      } else {
        const err = await res.json()
        setMessage({ type: "error", text: err.error || "Passwort ändern fehlgeschlagen" })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setPasswordChanging(false)
    }
  }

  // 2FA Setup
  const handle2FASetup = async () => {
    setTwoFactorLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setQrCode(data.qrCode)
        setTotpSecret(data.secret)
        setShow2FASetup(true)
      } else {
        setMessage({ type: "error", text: data.error || "2FA Setup fehlgeschlagen" })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // 2FA Verify
  const handle2FAVerify = async () => {
    if (totpToken.length !== 6) {
      setMessage({ type: "error", text: "Bitte 6-stelligen Code eingeben" })
      return
    }
    setTwoFactorLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: totpToken })
      })
      const data = await res.json()
      if (res.ok) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        setTwoFactorEnabled(true)
        setShow2FASetup(false)
        setTotpToken("")
        setMessage({ type: "success", text: "2FA erfolgreich aktiviert!" })
      } else {
        setMessage({ type: "error", text: data.error || "Ungültiger Code" })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // 2FA Disable
  const handle2FADisable = async () => {
    setTwoFactorLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword })
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFactorEnabled(false)
        setShow2FADisable(false)
        setDisablePassword("")
        setMessage({ type: "success", text: "2FA deaktiviert" })
      } else {
        setMessage({ type: "error", text: data.error || "Deaktivierung fehlgeschlagen" })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // Generate new backup codes
  const handleRegenerateBackupCodes = async () => {
    const password = prompt("Bitte Passwort eingeben zur Bestätigung:")
    if (!password) return
    
    setTwoFactorLoading(true)
    try {
      const res = await fetch("/api/auth/2fa/backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        setMessage({ type: "success", text: "Neue Backup-Codes generiert" })
      } else {
        setMessage({ type: "error", text: data.error || "Fehler beim Generieren" })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "In Zwischenablage kopiert" })
  }

  // Avatar Upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500000) {
      setMessage({ type: "error", text: "Bild zu groß (max 500KB)" })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatar(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Start Tour
  const handleStartTour = () => {
    resetAndStartTour()
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ka_admin":
        return "Administrator"
      case "ka_gruppenführer":
        return "Gruppenführer"
      case "ka_mitarbeiter":
        return "Mitarbeiter"
      case "baumschule":
        return "Baumschule"
      default:
        return role || "Unbekannt"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Mein Profil</h1>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "px-4 py-3 rounded-lg text-sm flex items-center gap-2",
            message.type === "success"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-500/30"
              : "bg-red-100 text-red-800 border border-red-500/30"
          )}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : null}
          {message.text}
        </div>
      )}

      {/* Persönliche Daten */}
      <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          Persönliche Daten
        </h2>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-zinc-500" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 rounded-full text-white hover:bg-emerald-500"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Profilbild</p>
              <p className="text-xs text-zinc-600">Max 500KB, JPG/PNG</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">E-Mail</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-zinc-500">
              <Mail className="w-4 h-4" />
              {profile?.email}
            </div>
          </div>
        </div>
      </section>

      {/* Kontaktdaten (nur wenn Mitarbeiter-Datensatz existiert) */}
      {profile?.mitarbeiter && (
        <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-400" />
            Kontaktdaten
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Telefon (Festnetz)</label>
              <input
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="+49 123 456789"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Mobil</label>
              <input
                type="tel"
                value={mobil}
                onChange={(e) => setMobil(e.target.value)}
                placeholder="+49 170 1234567"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Adresse</label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Straße und Hausnummer"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">PLZ</label>
              <input
                type="text"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                placeholder="12345"
                maxLength={5}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Ort</label>
              <input
                type="text"
                value={ort}
                onChange={(e) => setOrt(e.target.value)}
                placeholder="Musterstadt"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>
      )}

      {/* Notfallkontakt (nur wenn Mitarbeiter-Datensatz existiert) */}
      {profile?.mitarbeiter && (
        <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            Notfallkontakt
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Diese Person wird im Notfall kontaktiert. Bitte halten Sie die Daten aktuell.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name</label>
              <input
                type="text"
                value={notfallName}
                onChange={(e) => setNotfallName(e.target.value)}
                placeholder="Max Mustermann"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Telefon</label>
              <input
                type="tel"
                value={notfallTelefon}
                onChange={(e) => setNotfallTelefon(e.target.value)}
                placeholder="+49 170 1234567"
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Beziehung</label>
              <select
                value={notfallBeziehung}
                onChange={(e) => setNotfallBeziehung(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Bitte wählen</option>
                <option value="partner">Partner/in</option>
                <option value="ehepartner">Ehepartner/in</option>
                <option value="eltern">Eltern</option>
                <option value="kind">Kind</option>
                <option value="geschwister">Geschwister</option>
                <option value="freund">Freund/in</option>
                <option value="sonstige">Sonstige</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Arbeitszeitkonto (nur wenn Daten vorhanden) */}
      {profile?.arbeitszeitkonto && (
        <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Arbeitszeitkonto — {profile.arbeitszeitkonto.monat}
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Soll-Stunden</p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
                {profile.arbeitszeitkonto.sollStunden}h
              </p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Ist-Stunden</p>
              <p className="text-2xl font-bold text-emerald-400">
                {profile.arbeitszeitkonto.istStunden.toFixed(1)}h
              </p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Differenz</p>
              <div className="flex items-center justify-center gap-1">
                {profile.arbeitszeitkonto.differenz > 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : profile.arbeitszeitkonto.differenz < 0 ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <Minus className="w-5 h-5 text-zinc-400" />
                )}
                <p className={cn(
                  "text-2xl font-bold",
                  profile.arbeitszeitkonto.differenz > 0 
                    ? "text-emerald-400" 
                    : profile.arbeitszeitkonto.differenz < 0 
                      ? "text-red-400" 
                      : "text-zinc-400"
                )}>
                  {profile.arbeitszeitkonto.differenz > 0 ? "+" : ""}
                  {profile.arbeitszeitkonto.differenz.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>

          {/* Fortschrittsbalken */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Erfüllt</span>
              <span>
                {Math.min(100, Math.round((profile.arbeitszeitkonto.istStunden / profile.arbeitszeitkonto.sollStunden) * 100))}%
              </span>
            </div>
            <div className="h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, (profile.arbeitszeitkonto.istStunden / profile.arbeitszeitkonto.sollStunden) * 100)}%` 
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Urlaubstage (nur wenn Daten vorhanden) */}
      {profile?.urlaubstage && (
        <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Urlaubstage {profile.urlaubstage.jahr}
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Anspruch</p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
                {profile.urlaubstage.anspruch} Tage
              </p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Genommen</p>
              <p className="text-2xl font-bold text-yellow-400">
                {profile.urlaubstage.genommen} Tage
              </p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Restanspruch</p>
              <p className={cn(
                "text-2xl font-bold",
                profile.urlaubstage.rest > 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {profile.urlaubstage.rest} Tage
              </p>
            </div>
          </div>

          {/* Fortschrittsbalken */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Urlaubsnutzung</span>
              <span>
                {Math.round((profile.urlaubstage.genommen / profile.urlaubstage.anspruch) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ 
                  width: `${(profile.urlaubstage.genommen / profile.urlaubstage.anspruch) * 100}%` 
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Passwort ändern */}
      <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Passwort ändern
        </h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333] transition-colors"
          >
            Passwort ändern
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Aktuelles Passwort</label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Neues Passwort</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Passwort bestätigen</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-border rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePasswordChange}
                disabled={passwordChanging}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
              >
                {passwordChanging && <Loader2 className="w-4 h-4 animate-spin" />}
                Passwort ändern
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false)
                  setOldPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                }}
                className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333]"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Zwei-Faktor-Authentifizierung */}
      <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          Zwei-Faktor-Authentifizierung (2FA)
        </h2>

        <div className="space-y-4">
          {/* Status Anzeige */}
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border",
            twoFactorEnabled 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-yellow-500/10 border-yellow-500/30"
          )}>
            {twoFactorEnabled ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium">2FA ist aktiviert</p>
                  <p className="text-xs text-zinc-500">
                    Ihr Konto ist durch einen zusätzlichen Sicherheitsschritt geschützt
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 font-medium">2FA ist nicht aktiviert</p>
                  <p className="text-xs text-zinc-500">
                    Aktivieren Sie 2FA für zusätzliche Kontosicherheit
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Setup Flow */}
          {show2FASetup && qrCode && (
            <div className="space-y-4 p-4 bg-[#0f0f0f] rounded-lg border border-border">
              <p className="text-sm text-zinc-400">
                1. Scannen Sie diesen QR-Code mit Ihrer Authenticator-App (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg" />
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">Oder geben Sie diesen Code manuell ein:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-1 bg-[#1a1a1a] rounded text-emerald-400 font-mono text-sm">
                    {totpSecret}
                  </code>
                  <button
                    onClick={() => totpSecret && copyToClipboard(totpSecret)}
                    className="p-1.5 text-zinc-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-2">
                  2. Geben Sie den 6-stelligen Code aus der App ein:
                </p>
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-border rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handle2FAVerify}
                  disabled={twoFactorLoading || totpToken.length !== 6}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {twoFactorLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Aktivieren
                </button>
                <button
                  onClick={() => {
                    setShow2FASetup(false)
                    setQrCode(null)
                    setTotpSecret(null)
                    setTotpToken("")
                  }}
                  className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333]"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Disable Flow */}
          {show2FADisable && (
            <div className="space-y-4 p-4 bg-[#0f0f0f] rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldOff className="w-5 h-5" />
                <p className="font-medium">2FA deaktivieren</p>
              </div>
              <p className="text-sm text-zinc-400">
                Geben Sie Ihr Passwort ein, um 2FA zu deaktivieren. 
                Dies verringert die Sicherheit Ihres Kontos.
              </p>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-border rounded-lg text-white focus:border-red-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handle2FADisable}
                  disabled={twoFactorLoading || !disablePassword}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {twoFactorLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  2FA Deaktivieren
                </button>
                <button
                  onClick={() => {
                    setShow2FADisable(false)
                    setDisablePassword("")
                  }}
                  className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333]"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Backup Codes Modal */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="space-y-4 p-4 bg-[#0f0f0f] rounded-lg border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400">
                <Key className="w-5 h-5" />
                <p className="font-medium">Ihre Backup-Codes</p>
              </div>
              <p className="text-sm text-zinc-400">
                <strong>Wichtig:</strong> Speichern Sie diese Codes sicher ab. 
                Sie werden nur einmal angezeigt und können für den Notfall-Login verwendet werden.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code 
                    key={i}
                    className="px-3 py-2 bg-[#1a1a1a] rounded text-center font-mono text-emerald-400"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="flex-1 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333] flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Alle kopieren
                </button>
                <button
                  onClick={() => {
                    setShowBackupCodes(false)
                    setBackupCodes([])
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                >
                  Fertig
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!show2FASetup && !show2FADisable && !showBackupCodes && (
            <div className="flex flex-wrap gap-3">
              {!twoFactorEnabled ? (
                <button
                  onClick={handle2FASetup}
                  disabled={twoFactorLoading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {twoFactorLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <ShieldCheck className="w-4 h-4" />
                  2FA aktivieren
                </button>
              ) : (
                <>
                  <button
                    onClick={handleRegenerateBackupCodes}
                    disabled={twoFactorLoading}
                    className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333] flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Neue Backup-Codes
                  </button>
                  <button
                    onClick={() => setShow2FADisable(true)}
                    className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 flex items-center gap-2"
                  >
                    <ShieldOff className="w-4 h-4" />
                    2FA deaktivieren
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Benachrichtigungen */}
      <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-400" />
          Benachrichtigungen
        </h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">E-Mail bei Mängelbenachrichtigung</span>
            <button
              onClick={() => setNotifyMaengel(!notifyMaengel)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors",
                notifyMaengel ? "bg-emerald-600" : "bg-surface-container-highest"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform mx-0.5",
                  notifyMaengel ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">E-Mail bei neuen Aufträgen</span>
            <button
              onClick={() => setNotifyAuftraege(!notifyAuftraege)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors",
                notifyAuftraege ? "bg-emerald-600" : "bg-surface-container-highest"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform mx-0.5",
                  notifyAuftraege ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">E-Mail bei Abnahmen</span>
            <button
              onClick={() => setNotifyAbnahmen(!notifyAbnahmen)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors",
                notifyAbnahmen ? "bg-emerald-600" : "bg-surface-container-highest"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform mx-0.5",
                  notifyAbnahmen ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </label>
        </div>
      </section>

      {/* DSGVO Datenexport */}
      <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Datenschutz (DSGVO)
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          Gemäß DSGVO Art. 15 können Sie alle über Sie gespeicherten personenbezogenen Daten exportieren.
        </p>
        <a
          href={`/api/gdpr/export?userId=${profile?.id || ''}`}
          download
          className="px-4 py-2 bg-forest text-emerald-400 rounded-lg hover:bg-[#3d4f28] transition-colors inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Meine Daten exportieren
        </a>
      </section>

      {/* Tour & Hilfe */}
      <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          Hilfe & Tour
        </h2>

        <button
          onClick={handleStartTour}
          className="px-4 py-2 bg-forest text-emerald-400 rounded-lg hover:bg-[#3d4f28] transition-colors flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Einführungs-Tour starten
        </button>
      </section>

      {/* Session Info */}
      <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Session-Informationen
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Eingeloggt als</span>
            <span className="text-white">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Rolle</span>
            <span className="text-emerald-400">{getRoleLabel(profile?.role)}</span>
          </div>
          {profile?.lastLoginAt && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Letzte Aktivität</span>
              <span className="text-zinc-300">
                {new Date(profile.lastLoginAt).toLocaleString("de-DE")}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-400">Konto erstellt</span>
            <span className="text-zinc-300">
              {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString("de-DE")}
            </span>
          </div>
        </div>
      </section>

      {/* Admin Links */}
      {isAdmin && (
        <section className="bg-[#1a1a1a] border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Administration
          </h2>

          <div className="flex flex-wrap gap-3">
            <a
              href="/einstellungen"
              className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333] transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              System-Einstellungen
            </a>
            <a
              href="/admin/benutzer"
              className="px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg hover:bg-[#333] transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Benutzerverwaltung
            </a>
          </div>
        </section>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Änderungen speichern
        </button>
      </div>
    </div>
  )
}
