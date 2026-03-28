"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Shield,
  Check,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_PERMISSIONS, PERMISSION_GROUPS, ROLE_TEMPLATES, Permission } from "@/lib/permissions"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  avatar?: string
  permissions: string[]
  lastLoginAt?: string
  createdAt: string
}

const ROLES = [
  { value: "ka_admin", label: "Administrator" },
  { value: "ka_gruppenführer", label: "Gruppenführer" },
  { value: "ka_mitarbeiter", label: "Mitarbeiter" },
  { value: "baumschule", label: "Baumschule" },
]

export default function BenutzerVerwaltungPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form States
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formRole, setFormRole] = useState("ka_mitarbeiter")
  const [formPassword, setFormPassword] = useState("")
  const [formActive, setFormActive] = useState(true)
  const [formPermissions, setFormPermissions] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = session?.user && (session.user as { role?: string }).role === "ka_admin"

  // Redirect wenn kein Admin
  useEffect(() => {
    if (session && !isAdmin) {
      router.push("/dashboard")
    }
  }, [session, isAdmin, router])

  // Benutzer laden
  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/benutzer")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error("Benutzer laden fehlgeschlagen:", err)
    } finally {
      setLoading(false)
    }
  }

  // Modal öffnen
  const openCreateModal = () => {
    setEditingUser(null)
    setFormName("")
    setFormEmail("")
    setFormRole("ka_mitarbeiter")
    setFormPassword("")
    setFormActive(true)
    setFormPermissions([])
    setModalOpen(true)
  }

  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormRole(user.role)
    setFormPassword("")
    setFormActive(user.active)
    setFormPermissions(user.permissions)
    setModalOpen(true)
  }

  // Rolle-Template anwenden
  const applyRoleTemplate = () => {
    const template = ROLE_TEMPLATES[formRole as keyof typeof ROLE_TEMPLATES]
    if (template) {
      setFormPermissions([...template])
    }
  }

  // Permission togglen
  const togglePermission = (permission: string) => {
    setFormPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  // Speichern
  const handleSave = async () => {
    if (!formName || !formEmail) {
      setMessage({ type: "error", text: "Name und E-Mail erforderlich" })
      return
    }
    if (!editingUser && !formPassword) {
      setMessage({ type: "error", text: "Passwort erforderlich" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const body: Record<string, unknown> = {
        name: formName,
        email: formEmail,
        role: formRole,
        active: formActive,
        permissions: formPermissions,
      }

      if (formPassword) {
        body.password = formPassword
      }

      if (editingUser) {
        body.id = editingUser.id
        const res = await fetch("/api/admin/benutzer", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          setMessage({ type: "success", text: "Benutzer aktualisiert!" })
          loadUsers()
          setModalOpen(false)
        } else {
          const err = await res.json()
          setMessage({ type: "error", text: err.error || "Fehler beim Speichern" })
        }
      } else {
        const res = await fetch("/api/admin/benutzer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          setMessage({ type: "success", text: "Benutzer erstellt!" })
          loadUsers()
          setModalOpen(false)
        } else {
          const err = await res.json()
          setMessage({ type: "error", text: err.error || "Fehler beim Erstellen" })
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    } finally {
      setSaving(false)
    }
  }

  // Löschen
  const handleDelete = async (user: UserData) => {
    if (!confirm(`Benutzer "${user.name}" wirklich löschen?`)) return

    try {
      const res = await fetch(`/api/admin/benutzer?id=${user.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setMessage({ type: "success", text: "Benutzer gelöscht!" })
        loadUsers()
      } else {
        const err = await res.json()
        setMessage({ type: "error", text: err.error || "Fehler beim Löschen" })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Netzwerkfehler" })
    }
  }

  const getRoleLabel = (role: string) => {
    return ROLES.find((r) => r.value === role)?.label || role
  }

  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2C3A1C] flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Benutzerverwaltung</h1>
            <p className="text-sm text-zinc-500">{users.length} Benutzer</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Benutzer
        </button>
      </div>

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
          {message.type === "success" ? <Check className="w-4 h-4" /> : null}
          {message.text}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">E-Mail</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Rolle</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Letzter Login</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                    <span className="text-white">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs",
                      user.role === "ka_admin"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : user.role === "ka_gruppenführer"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs",
                      user.active
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {user.active ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-sm">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString("de-DE")
                    : "Nie"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      disabled={user.id === session?.user?.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-x-0 top-[5%] mx-auto max-w-2xl z-50 px-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
                <h2 className="text-lg font-semibold text-white">
                  {editingUser ? "Benutzer bearbeiten" : "Neuer Benutzer"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Basis-Daten */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
                      <User className="w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="flex-1 bg-transparent text-white outline-none"
                        placeholder="Max Mustermann"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">E-Mail *</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="flex-1 bg-transparent text-white outline-none"
                        placeholder="max@beispiel.de"
                      />
                    </div>
                  </div>
                </div>

                {/* Rolle & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Rolle</label>
                    <div className="flex gap-2">
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white outline-none"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={applyRoleTemplate}
                        className="px-3 py-2 bg-[#2a2a2a] text-zinc-300 rounded-lg hover:bg-[#333] text-sm"
                        title="Rollen-Vorlage anwenden"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Status</label>
                    <label className="flex items-center gap-3 px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setFormActive(!formActive)}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors",
                          formActive ? "bg-emerald-600" : "bg-[#2a2a2a]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full bg-white transition-transform mx-0.5",
                            formActive ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className="text-white">{formActive ? "Aktiv" : "Inaktiv"}</span>
                    </label>
                  </div>
                </div>

                {/* Passwort */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    {editingUser ? "Neues Passwort (leer = unverändert)" : "Passwort *"}
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="flex-1 bg-transparent text-white outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-3">Berechtigungen</label>
                  <div className="space-y-4 max-h-64 overflow-y-auto p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
                    {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                      <div key={groupKey}>
                        <h4 className="text-sm font-medium text-white mb-2">{group.label}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {group.permissions.map((permission) => (
                            <label
                              key={permission}
                              className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formPermissions.includes(permission)}
                                onChange={() => togglePermission(permission)}
                                className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-emerald-500 focus:ring-emerald-500"
                              />
                              {ALL_PERMISSIONS[permission as Permission]}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a]">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#2a2a2a] text-zinc-300 rounded-lg hover:bg-[#333]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Speichern" : "Erstellen"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
