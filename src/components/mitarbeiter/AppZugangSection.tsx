"use client"

import { useState, useEffect, useCallback } from "react"
import { Smartphone, ShieldCheck, ShieldOff, KeyRound, Trash2, Loader2, Copy, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface AppAccountData {
  hasAccount: boolean
  active: boolean | null
  email: string | null
  role: string | null
  lastLoginAt: string | null
  userId: string | null
}

interface Props {
  mitarbeiterId: string
  isAdmin: boolean
  mitarbeiterEmail?: string | null
}

export function AppZugangSection({ mitarbeiterId, isAdmin, mitarbeiterEmail }: Props) {
  const [data, setData] = useState<AppAccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Create-Account modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createEmail, setCreateEmail] = useState("")
  const [createRolle, setCreateRolle] = useState("ka_mitarbeiter")

  // Temporary password display
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/mitarbeiter/${mitarbeiterId}/app-account`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      toast.error("Fehler beim Laden des App-Zugangs")
    } finally {
      setLoading(false)
    }
  }, [mitarbeiterId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/mitarbeiter/${mitarbeiterId}/app-account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Aktion fehlgeschlagen")
        return
      }
      if (action === "reset-password" && result.temporaresPasswort) {
        setTempPassword(result.temporaresPasswort)
        setShowPassword(true)
      }
      toast.success(
        action === "activate" ? "App-Zugang aktiviert" :
        action === "deactivate" ? "App-Zugang gesperrt" :
        "Passwort zurückgesetzt"
      )
      await fetchData()
    } catch {
      toast.error("Netzwerkfehler")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createEmail) {
      toast.error("E-Mail ist erforderlich")
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/mitarbeiter/${mitarbeiterId}/account-erstellen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: createEmail, rolle: createRolle }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Fehler beim Erstellen")
        return
      }
      if (result.temporaresPasswort) {
        setTempPassword(result.temporaresPasswort)
        setShowPassword(true)
      }
      toast.success("App-Zugang erstellt")
      setShowCreateModal(false)
      await fetchData()
    } catch {
      toast.error("Netzwerkfehler")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/mitarbeiter/${mitarbeiterId}/app-account`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Fehler beim Entfernen")
        return
      }
      toast.success("App-Zugang entfernt")
      setConfirmDelete(false)
      setTempPassword(null)
      await fetchData()
    } catch {
      toast.error("Netzwerkfehler")
    } finally {
      setActionLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Kopiert"))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-[var(--color-on-surface-variant)]">
        <Loader2 className="w-4 h-4 animate-spin" /> Lade App-Zugang...
      </div>
    )
  }

  if (!data) return null

  const statusBadge = !data.hasAccount
    ? { label: "Kein App-Zugang", cls: "bg-gray-100 text-gray-600 border-gray-300" }
    : data.active
    ? { label: "Aktiv", cls: "bg-emerald-100 text-emerald-800 border-emerald-500/30" }
    : { label: "Gesperrt", cls: "bg-red-100 text-red-800 border-red-500/30" }

  return (
    <div className="space-y-4">
      {/* Status + Info */}
      <div className="flex items-center gap-3 flex-wrap">
        <Smartphone className="w-5 h-5 text-[var(--color-on-surface-variant)]" />
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Admin details */}
      {data.hasAccount && isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">E-Mail</p>
            <p className="text-[var(--color-on-surface)]">{data.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Rolle</p>
            <p className="text-[var(--color-on-surface)]">{data.role || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Letzter Login</p>
            <p className="text-[var(--color-on-surface)]">
              {data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleString("de-DE") : "Noch nie"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Status</p>
            <p className="text-[var(--color-on-surface)]">{data.active ? "Aktiv" : "Gesperrt"}</p>
          </div>
        </div>
      )}

      {/* Temp password display */}
      {tempPassword && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">Temporäres Passwort (nur einmalig sichtbar!)</p>
          <div className="flex items-center gap-2">
            <code className="bg-white px-3 py-1.5 rounded border border-amber-200 text-sm font-mono text-amber-900 flex-1">
              {showPassword ? tempPassword : "••••••••"}
            </code>
            <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 rounded hover:bg-amber-100" title={showPassword ? "Verbergen" : "Anzeigen"}>
              {showPassword ? <EyeOff className="w-4 h-4 text-amber-700" /> : <Eye className="w-4 h-4 text-amber-700" />}
            </button>
            <button onClick={() => copyToClipboard(tempPassword)} className="p-1.5 rounded hover:bg-amber-100" title="Kopieren">
              <Copy className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          {!data.hasAccount ? (
            <button
              onClick={() => { setCreateEmail(mitarbeiterEmail || ""); setCreateRolle("ka_mitarbeiter"); setShowCreateModal(true) }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-forest hover:bg-[#3a4d26] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
            >
              <Smartphone className="w-4 h-4" /> App-Zugang erstellen
            </button>
          ) : (
            <>
              {data.active ? (
                <button
                  onClick={() => handleAction("deactivate")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg border border-red-200 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                  Sperren
                </button>
              ) : (
                <button
                  onClick={() => handleAction("activate")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Entsperren
                </button>
              )}
              <button
                onClick={() => handleAction("reset-password")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-lg border border-amber-200 transition-all disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Passwort zurücksetzen
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-[var(--color-on-surface-variant)] hover:text-red-600 hover:bg-red-50 text-sm rounded-lg border border-border transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Zugang entfernen
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm text-red-700">Wirklich entfernen?</span>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ja"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-red-700 text-xs font-medium hover:bg-red-100 rounded"
                  >
                    Nein
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">App-Zugang erstellen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="mitarbeiter@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                <select
                  value={createRolle}
                  onChange={(e) => setCreateRolle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="ka_mitarbeiter">Mitarbeiter</option>
                  <option value="ka_gruppenführer">Gruppenführer</option>
                  <option value="ka_admin">Admin</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Ein temporäres Passwort wird automatisch generiert und nach dem Erstellen einmalig angezeigt.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={actionLoading || !createEmail}
                  className="flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-[#3a4d26] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
