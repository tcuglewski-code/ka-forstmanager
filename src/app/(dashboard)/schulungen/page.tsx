"use client"

import { useState, useEffect, useCallback } from "react"
import { BookOpen, Plus, Loader2, Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"

interface Schulung {
  id: string
  titel: string
  typ: string
  beschreibung?: string | null
  datum?: string | null
  ort?: string | null
  maxTeilnehmer?: number | null
  status: string
  teilnehmerCount: number
}

const typBadge: Record<string, string> = {
  pflicht: "bg-red-100 text-red-800",
  freiwillig: "bg-blue-100 text-blue-800",
  auffrischung: "bg-amber-100 text-amber-800",
}

const statusBadge: Record<string, string> = {
  geplant: "bg-blue-100 text-blue-800",
  aktiv: "bg-emerald-100 text-emerald-800",
  abgeschlossen: "bg-[var(--color-surface-container-high)]/50 text-[var(--color-on-surface-variant)]",
}

const statusLabel: Record<string, string> = {
  geplant: "Geplant",
  aktiv: "Aktiv",
  abgeschlossen: "Abgeschlossen",
}

export default function SchulungenPage() {
  const [schulungen, setSchulungen] = useState<Schulung[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titel: "", typ: "pflicht", beschreibung: "", datum: "", ort: "", maxTeilnehmer: "", status: "geplant" })

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const r = await fetch("/api/schulungen").then((r) => r.json())
    setSchulungen(Array.isArray(r) ? r : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function create() {
    setSaving(true)
    await fetch("/api/schulungen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm({ titel: "", typ: "pflicht", beschreibung: "", datum: "", ort: "", maxTeilnehmer: "", status: "geplant" })
    await fetch_()
    setSaving(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-on-surface)" }}>
            <BookOpen className="w-6 h-6 text-emerald-400" /> Schulungen
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">Pflicht-, Freiwillige- und Auffrischungsschulungen</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Schulung anlegen
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schulungen.length === 0 ? (
            <p className="text-[var(--color-on-surface-variant)] col-span-3 text-center py-12">Keine Schulungen</p>
          ) : schulungen.map((s) => (
            <Link key={s.id} href={`/schulungen/${s.id}`} className="block bg-[var(--color-surface-container)] border border-border rounded-xl p-5 hover:border-zinc-600 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${typBadge[s.typ] ?? "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"}`}>
                    {s.typ.charAt(0).toUpperCase() + s.typ.slice(1)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[s.status] ?? "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"}`}>
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-[var(--color-on-surface)] mb-2">{s.titel}</h3>
              {s.beschreibung && <p className="text-xs text-[var(--color-on-surface-variant)] mb-3 line-clamp-2">{s.beschreibung}</p>}
              <div className="space-y-1.5">
                {s.datum && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.datum).toLocaleDateString("de-DE")}
                  </div>
                )}
                {s.ort && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                    <MapPin className="w-3 h-3" />
                    {s.ort}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                  <Users className="w-3 h-3" />
                  {s.teilnehmerCount}{s.maxTeilnehmer ? ` / ${s.maxTeilnehmer}` : ""} Teilnehmer
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-4">Schulung anlegen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Titel</label>
                <input value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Typ</label>
                  <select value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]">
                    <option value="pflicht">Pflicht</option>
                    <option value="freiwillig">Freiwillig</option>
                    <option value="auffrischung">Auffrischung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]">
                    <option value="geplant">Geplant</option>
                    <option value="aktiv">Aktiv</option>
                    <option value="abgeschlossen">Abgeschlossen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Beschreibung</label>
                <textarea value={form.beschreibung} onChange={(e) => setForm({ ...form, beschreibung: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Datum</label>
                  <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Max. Teilnehmer</label>
                  <input type="number" value={form.maxTeilnehmer} onChange={(e) => setForm({ ...form, maxTeilnehmer: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Ort</label>
                <input value={form.ort} onChange={(e) => setForm({ ...form, ort: e.target.value })} className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-[var(--color-on-surface-variant)] text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={create} disabled={saving || !form.titel} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Anlegen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
