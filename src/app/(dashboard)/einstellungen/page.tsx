"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, Users, Building2, Cpu, Plus, Pencil, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

const rolleBadge: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-400",
  buero: "bg-blue-500/20 text-blue-400",
  gruppenfuehrer: "bg-amber-500/20 text-amber-400",
  mitarbeiter: "bg-zinc-700/50 text-zinc-400",
}

export default function EinstellungenPage() {
  const [tab, setTab] = useState<"benutzer" | "firma" | "system">("benutzer")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "mitarbeiter" })
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", active: true, password: "" })

  // Firma-Konfiguration (Sprint P: aus DB geladen)
  const [config, setConfig] = useState<Record<string, string>>({
    firma_name: "Koch Aufforstung GmbH",
    firma_adresse: "",
    firma_email: "",
    firma_farbe: "#2C3A1C",
    preis_pro_ha: "1800",
    standard_stundenlohn: "12",
  })
  const [configLoading, setConfigLoading] = useState(true)
  const [firmaSaved, setFirmaSaved] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const r = await fetch("/api/einstellungen/users").then((r) => r.json())
    setUsers(Array.isArray(r) ? r : [])
    setLoading(false)
  }, [])

  // Lade gespeicherte Konfiguration aus DB (Sprint P)
  const fetchConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const r = await fetch("/api/einstellungen/config").then((r) => r.json())
      if (r && typeof r === "object") {
        setConfig(prev => ({ ...prev, ...r }))
      }
    } catch {
      // Ignoriere Fehler beim Laden
    }
    setConfigLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { fetchConfig() }, [fetchConfig])

  async function createUser() {
    setSaving(true)
    try {
      await fetch("/api/einstellungen/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      toast.success("Benutzer erfolgreich angelegt")
      setShowModal(false)
      setForm({ name: "", email: "", password: "", role: "mitarbeiter" })
      await fetchUsers()
    } catch (e: unknown) {
      toast.error("Fehler: " + (e instanceof Error ? e.message : String(e)))
    }
    setSaving(false)
  }

  async function updateUser() {
    if (!editUser) return
    setSaving(true)
    try {
      const data: Record<string, unknown> = { name: editForm.name, email: editForm.email, role: editForm.role, active: editForm.active }
      if (editForm.password) data.password = editForm.password
      await fetch(`/api/einstellungen/users/${editUser.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      toast.success("Benutzer aktualisiert")
      setEditUser(null)
      await fetchUsers()
    } catch (e: unknown) {
      toast.error("Fehler: " + (e instanceof Error ? e.message : String(e)))
    }
    setSaving(false)
  }

  function openEdit(user: User) {
    setEditUser(user)
    setEditForm({ name: user.name, email: user.email, role: user.role, active: user.active, password: "" })
  }

  // Firma-Einstellungen in DB speichern (Sprint P)
  async function saveFirma() {
    setSaving(true)
    try {
      await fetch("/api/einstellungen/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: {
            firma_name: config.firma_name,
            firma_adresse: config.firma_adresse,
            firma_email: config.firma_email,
            firma_farbe: config.firma_farbe,
            preis_pro_ha: config.preis_pro_ha,
            standard_stundenlohn: config.standard_stundenlohn,
            vollkosten_pro_stunde: config.vollkosten_pro_stunde,
            maschinenzuschlag_kunde: config.maschinenzuschlag_kunde,
            maschinenbonus_mitarbeiter: config.maschinenbonus_mitarbeiter,
            // Sprint FQ (B2): Neue Kalkulations-Parameter
            preis_pro_baum_default: config.preis_pro_baum_default,
            mwst_satz: config.mwst_satz,
          },
        }),
      })
      // CSS-Variable aktualisieren
      if (config.firma_farbe) {
        document.documentElement.style.setProperty("--primary", config.firma_farbe)
      }
      toast.success("Firma-Einstellungen gespeichert")
      setFirmaSaved(true)
      setTimeout(() => setFirmaSaved(false), 2000)
    } catch (e: unknown) {
      toast.error("Fehler: " + (e instanceof Error ? e.message : String(e)))
    }
    setSaving(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" /> Einstellungen
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Benutzer, Firma und System</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#161616] border border-[#2a2a2a] rounded-lg p-1 w-fit">
        {([
          { key: "benutzer", label: "Benutzer", icon: Users },
          { key: "firma", label: "Firma", icon: Building2 },
          { key: "system", label: "System", icon: Cpu },
        ] as const).map((t) => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.key ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-400 hover:text-white"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Benutzer Tab */}
      {tab === "benutzer" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Benutzer anlegen
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">E-Mail</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Rolle</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Aktiv</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {users.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-600">Keine Benutzer</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#1c1c1c]">
                      <td className="px-6 py-4 text-sm font-medium text-white">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${rolleBadge[u.role] ?? "bg-zinc-700 text-zinc-400"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`w-2 h-2 rounded-full inline-block ${u.active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(u)} className="text-zinc-600 hover:text-emerald-400 transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Firma Tab */}
      {tab === "firma" && (
        <div className="max-w-lg space-y-4">
          {configLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Firmenname</label>
                <input
                  value={config.firma_name ?? ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, firma_name: e.target.value }))}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Adresse</label>
                <input
                  value={config.firma_adresse ?? ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, firma_adresse: e.target.value }))}
                  placeholder="Straße, PLZ Ort"
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Kontakt-E-Mail</label>
                <input
                  type="email"
                  value={config.firma_email ?? ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, firma_email: e.target.value }))}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Primärfarbe</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.firma_farbe ?? "#2C3A1C"}
                    onChange={(e) => setConfig(prev => ({ ...prev, firma_farbe: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    value={config.firma_farbe ?? "#2C3A1C"}
                    onChange={(e) => setConfig(prev => ({ ...prev, firma_farbe: e.target.value }))}
                    className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Kalkulations-Einstellungen (Sprint Q + FQ B2) */}
              <div className="space-y-4 mt-6 pt-4 border-t border-[#2a2a2a]">
                <h3 className="text-sm font-semibold text-zinc-300">Kalkulations-Einstellungen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Preis pro ha (€)</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={config.preis_pro_ha ?? "1800"}
                      onChange={(e) => setConfig(prev => ({ ...prev, preis_pro_ha: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Standard-Nettolohn MA (€/h)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={config.standard_stundenlohn ?? "12"}
                      onChange={(e) => setConfig(prev => ({ ...prev, standard_stundenlohn: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Vollkosten pro Stunde (€) — Kundenpreis</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={config.vollkosten_pro_stunde ?? "43.50"}
                      onChange={(e) => setConfig(prev => ({ ...prev, vollkosten_pro_stunde: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                    />
                  </div>
                  {/* Sprint FQ (B2): Preis pro Baum + MwSt */}
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Preis pro Baum Standard (€)</label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={config.preis_pro_baum_default ?? "2.50"}
                      onChange={(e) => setConfig(prev => ({ ...prev, preis_pro_baum_default: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">MwSt.-Satz (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={config.mwst_satz ?? "19"}
                      onChange={(e) => setConfig(prev => ({ ...prev, mwst_satz: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Maschinenzuschlag Kunde (€/h)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={config.maschinenzuschlag_kunde ?? "6.00"}
                      onChange={(e) => setConfig(prev => ({ ...prev, maschinenzuschlag_kunde: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Maschinenbonus Mitarbeiter (€/h)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={config.maschinenbonus_mitarbeiter ?? "1.00"}
                      onChange={(e) => setConfig(prev => ({ ...prev, maschinenbonus_mitarbeiter: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-600">💡 Vollkosten = Lohn + Steuern + Versicherung — wird dem Kunden in Rechnung gestellt.</p>
              </div>

              <button
                onClick={saveFirma}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {firmaSaved ? <><Check className="w-4 h-4" /> Gespeichert!</> : "Speichern"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* System Tab */}
      {tab === "system" && (
        <div className="space-y-4">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">App-API</h3>
            <p className="text-sm text-zinc-400 mb-4">REST API für die mobile App (ka-app). JWT-Token basierte Authentifizierung.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-[#333]">
                <span className="text-xs font-mono text-zinc-400">POST /api/app/auth</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Aktiv</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-[#333]">
                <span className="text-xs font-mono text-zinc-400">GET /api/app/me</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Aktiv</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-[#333]">
                <span className="text-xs font-mono text-zinc-400">POST /api/app/protokolle</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Aktiv</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-[#333]">
                <span className="text-xs font-mono text-zinc-400">POST /api/app/stunden</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Aktiv</span>
              </div>
            </div>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Webhooks</h3>
            <p className="text-sm text-zinc-400">Webhook-Integration für externe Systeme (z.B. ERP, Buchhaltung).</p>
            <div className="mt-4 p-4 bg-[#111] rounded-lg border border-[#333] text-sm text-zinc-600">
              🔧 Konfiguration folgt in einer späteren Version
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Benutzer anlegen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">E-Mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Passwort</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Rolle</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="admin">Admin</option>
                  <option value="buero">Büro</option>
                  <option value="gf_senior">🏅 Senior-Gruppenführer</option>
                  <option value="gf_standard">👷 Gruppenführer</option>
                  <option value="gruppenfuehrer">Gruppenführer (alt)</option>
                  <option value="mitarbeiter">Mitarbeiter</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={createUser} disabled={saving || !form.name || !form.email || !form.password} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Anlegen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Benutzer bearbeiten</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">E-Mail</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Neues Passwort (leer = unverändert)</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Rolle</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                    <option value="admin">Admin</option>
                    <option value="buero">Büro</option>
                    <option value="gf_senior">🏅 Senior-Gruppenführer</option>
                    <option value="gf_standard">👷 Gruppenführer</option>
                    <option value="gruppenfuehrer">Gruppenführer (alt)</option>
                    <option value="mitarbeiter">Mitarbeiter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Status</label>
                  <select value={editForm.active ? "aktiv" : "inaktiv"} onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "aktiv" })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                    <option value="aktiv">Aktiv</option>
                    <option value="inaktiv">Inaktiv</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={updateUser} disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
