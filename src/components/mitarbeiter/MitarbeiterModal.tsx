"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Mitarbeiter {
  id?: string
  vorname: string
  nachname: string
  email?: string | null
  telefon?: string | null
  mobil?: string | null
  adresse?: string | null
  plz?: string | null
  ort?: string | null
  rolle: string
  status: string
  stundenlohn?: number | null
  notizen?: string | null
  notfallName?: string | null
  notfallTelefon?: string | null
  notfallBeziehung?: string | null
}

interface MitarbeiterModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Mitarbeiter>) => Promise<void>
  initialData?: Mitarbeiter | null
}

const defaultData: Partial<Mitarbeiter> = {
  vorname: "",
  nachname: "",
  email: null,
  telefon: null,
  mobil: null,
  adresse: null,
  plz: null,
  ort: null,
  rolle: "mitarbeiter",
  status: "aktiv",
  stundenlohn: undefined,
  notizen: null,
  notfallName: null,
  notfallTelefon: null,
  notfallBeziehung: null,
}

const rollenOptions = [
  { value: "mitarbeiter", label: "Mitarbeiter" },
  { value: "gf_standard", label: "👷 Gruppenführer" },
  { value: "gf_senior", label: "🏅 Senior-Gruppenführer" },
  { value: "gruppenfuehrer", label: "Gruppenführer (alt)" },
  { value: "buero", label: "Büro" },
  { value: "admin", label: "Admin" },
]

const statusOptions = [
  { value: "aktiv", label: "Aktiv" },
  { value: "inaktiv", label: "Inaktiv" },
  { value: "beurlaubt", label: "Beurlaubt" },
]

export function MitarbeiterModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: MitarbeiterModalProps) {
  const [form, setForm] = useState<Partial<Mitarbeiter>>(initialData || defaultData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const isEdit = !!initialData?.id

  // Bug B2: Formular mit bestehenden Mitarbeiter-Daten vorausfüllen wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      setForm(initialData || defaultData)
      setError("")
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vorname || !form.nachname) {
      setError("Vor- und Nachname sind Pflichtfelder.")
      return
    }
    setError("")
    setSaving(true)
    try {
      await onSave(form)
      toast.success("Mitarbeiter erfolgreich gespeichert")
      onClose()
    } catch {
      setError("Fehler beim Speichern. Bitte erneut versuchen.")
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  const update = (field: keyof Mitarbeiter, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Mitarbeiter bearbeiten" : "Mitarbeiter hinzufügen"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-[#1e1e1e] hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Vorname <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="vorname"
                value={form.vorname || ""}
                onChange={(e) => update("vorname", e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Nachname <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="nachname"
                value={form.nachname || ""}
                onChange={(e) => update("nachname", e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
          </div>

          {/* Kontakt */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">E-Mail</label>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Telefon</label>
              <input
                type="tel"
                name="telefon"
                value={form.telefon || ""}
                onChange={(e) => update("telefon", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Mobil</label>
            <input
              type="tel"
              name="mobil"
              value={form.mobil || ""}
              onChange={(e) => update("mobil", e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Adresse</label>
            <input
              type="text"
              name="adresse"
              value={form.adresse || ""}
              onChange={(e) => update("adresse", e.target.value)}
              placeholder="Straße und Hausnummer"
              className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">PLZ</label>
              <input
                type="text"
                name="plz"
                value={form.plz || ""}
                onChange={(e) => update("plz", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Ort</label>
              <input
                type="text"
                name="ort"
                value={form.ort || ""}
                onChange={(e) => update("ort", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
          </div>

          {/* Rolle & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Rolle</label>
              <select
                value={form.rolle || "mitarbeiter"}
                onChange={(e) => update("rolle", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              >
                {rollenOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                value={form.status || "aktiv"}
                onChange={(e) => update("status", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stundenlohn */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Stundenlohn (€)
            </label>
            <input
              type="number"
              name="stundenlohn"
              step="0.01"
              value={form.stundenlohn ?? ""}
              onChange={(e) =>
                update("stundenlohn", e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="z.B. 14.50"
              className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
          </div>

          {/* Notfallkontakt (Sprint U) */}
          <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">🚨 Notfallkontakt</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.notfallName || ""}
                  onChange={(e) => update("notfallName", e.target.value || null)}
                  placeholder="z.B. Maria Müller"
                  className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    value={form.notfallTelefon || ""}
                    onChange={(e) => update("notfallTelefon", e.target.value || null)}
                    placeholder="+49 151 123 4567"
                    className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Beziehung</label>
                  <input
                    type="text"
                    value={form.notfallBeziehung || ""}
                    onChange={(e) => update("notfallBeziehung", e.target.value || null)}
                    placeholder="z.B. Partner, Mutter"
                    className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Notizen</label>
            <textarea
              name="notizen"
              value={form.notizen || ""}
              onChange={(e) => update("notizen", e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[#0f0f0f] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-lg text-sm transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-[#2C3A1C] hover:bg-[#3a4d26] text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Speichern...
                </>
              ) : isEdit ? (
                "Aktualisieren"
              ) : (
                "Hinzufügen"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
