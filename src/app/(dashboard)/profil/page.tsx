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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resetAndStartTour } from "@/components/tour/ForstManagerTour"

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

  // Password States
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)

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
      <h1 className="text-2xl font-bold text-white">Mein Profil</h1>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "px-4 py-3 rounded-lg text-sm flex items-center gap-2",
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          )}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : null}
          {message.text}
        </div>
      )}

      {/* Persönliche Daten */}
      <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          Persönliche Daten
        </h2>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
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
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">E-Mail</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-zinc-500">
              <Mail className="w-4 h-4" />
              {profile?.email}
            </div>
          </div>
        </div>
      </section>

      {/* Passwort ändern */}
      <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Passwort ändern
        </h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="px-4 py-2 bg-[#2a2a2a] text-zinc-300 rounded-lg hover:bg-[#333] transition-colors"
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
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none pr-10"
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
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none pr-10"
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
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-emerald-500 focus:outline-none"
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
                className="px-4 py-2 bg-[#2a2a2a] text-zinc-300 rounded-lg hover:bg-[#333]"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Benachrichtigungen */}
      <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
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
                notifyMaengel ? "bg-emerald-600" : "bg-[#2a2a2a]"
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
                notifyAuftraege ? "bg-emerald-600" : "bg-[#2a2a2a]"
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
                notifyAbnahmen ? "bg-emerald-600" : "bg-[#2a2a2a]"
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

      {/* Tour & Hilfe */}
      <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          Hilfe & Tour
        </h2>

        <button
          onClick={handleStartTour}
          className="px-4 py-2 bg-[#2C3A1C] text-emerald-400 rounded-lg hover:bg-[#3d4f28] transition-colors flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Einführungs-Tour starten
        </button>
      </section>

      {/* Session Info */}
      <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Session-Informationen
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Eingeloggt als</span>
            <span className="text-white">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Rolle</span>
            <span className="text-emerald-400">{getRoleLabel(profile?.role)}</span>
          </div>
          {profile?.lastLoginAt && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Letzte Aktivität</span>
              <span className="text-zinc-400">
                {new Date(profile.lastLoginAt).toLocaleString("de-DE")}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">Konto erstellt</span>
            <span className="text-zinc-400">
              {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString("de-DE")}
            </span>
          </div>
        </div>
      </section>

      {/* Admin Links */}
      {isAdmin && (
        <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Administration
          </h2>

          <div className="flex flex-wrap gap-3">
            <a
              href="/einstellungen"
              className="px-4 py-2 bg-[#2a2a2a] text-zinc-300 rounded-lg hover:bg-[#333] transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              System-Einstellungen
            </a>
            <a
              href="/admin/benutzer"
              className="px-4 py-2 bg-[#2a2a2a] text-zinc-300 rounded-lg hover:bg-[#333] transition-colors flex items-center gap-2"
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
