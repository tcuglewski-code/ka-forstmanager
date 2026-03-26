// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, ChevronDown, X, Loader2 } from "lucide-react"

const BAUMARTEN = [
  "Stieleiche", "Traubeneiche", "Rotbuche", "Fichte", "Kiefer", "Lärche",
  "Kastanie", "Roteiche", "Walnuss", "Schwarznuss", "Baumhasel", "Esche",
  "Bergahorn", "Spitzahorn", "Douglasie", "Weißtanne",
]

const STATUS_CONFIG = {
  offen:       { label: "Offen",        color: "bg-zinc-700 text-zinc-300" },
  in_ernte:    { label: "In Ernte",     color: "bg-blue-900/60 text-blue-300" },
  "erfüllt":   { label: "Erfüllt ✅",   color: "bg-emerald-900/60 text-emerald-300" },
  teilerfüllt: { label: "Teilerfüllt 🟡", color: "bg-yellow-900/60 text-yellow-300" },
  storniert:   { label: "Storniert",    color: "bg-red-900/60 text-red-300" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-zinc-700 text-zinc-300" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function ProgressBar({ gesammelt, ziel }: { gesammelt: number; ziel: number }) {
  const pct = ziel > 0 ? Math.min(100, (gesammelt / ziel) * 100) : 0
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"
  return (
    <div className="space-y-1 min-w-[120px]">
      <div className="w-full bg-zinc-700 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-zinc-400">
        {gesammelt.toFixed(1)} / {ziel.toFixed(1)} kg ({pct.toFixed(0)}%)
      </p>
    </div>
  )
}

export default function ErnteanfragenPage() {
  const [anfragen, setAnfragen] = useState([])
  const [baumschulen, setBaumschulen] = useState([])
  const [saisons, setSaisons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Filter
  const [filterSaison, setFilterSaison] = useState("")
  const [filterBaumart, setFilterBaumart] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  // Form
  const [form, setForm] = useState({
    baumschuleId: "",
    baumart: "",
    herkunft: "",
    zielmenge: "",
    deadline: "",
    saisonId: "",
    notizen: "",
  })

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterSaison) params.set("saisonId", filterSaison)
    if (filterBaumart) params.set("baumart", filterBaumart)
    if (filterStatus) params.set("status", filterStatus)

    const [aRes, bRes, sRes] = await Promise.all([
      fetch(`/api/saatguternte/anfragen?${params}`),
      fetch("/api/saatguternte/baumschulen"),
      fetch("/api/saatguternte/saisons"),
    ])
    if (aRes.ok) setAnfragen(await aRes.json())
    if (bRes.ok) setBaumschulen(await bRes.json())
    if (sRes.ok) setSaisons(await sRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [filterSaison, filterBaumart, filterStatus])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/saatguternte/anfragen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      setForm({ baumschuleId: "", baumart: "", herkunft: "", zielmenge: "", deadline: "", saisonId: "", notizen: "" })
      load()
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ernteanfragen</h1>
          <p className="text-sm text-zinc-400 mt-1">Baumschul-Aufträge · Zielmenge vs. gesammelt</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Neue Anfrage
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterSaison}
          onChange={(e) => setFilterSaison(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
        >
          <option value="">Alle Saisons</option>
          {saisons.map((s) => (
            <option key={s.id} value={s.id}>{s.jahr}</option>
          ))}
        </select>

        <select
          value={filterBaumart}
          onChange={(e) => setFilterBaumart(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
        >
          <option value="">Alle Baumarten</option>
          {BAUMARTEN.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {(filterSaison || filterBaumart || filterStatus) && (
          <button
            onClick={() => { setFilterSaison(""); setFilterBaumart(""); setFilterStatus("") }}
            className="flex items-center gap-1 px-3 py-2 text-xs text-zinc-400 hover:text-white border border-[#2a2a2a] rounded-lg"
          >
            <X className="w-3 h-3" /> Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Tabelle */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : anfragen.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            Keine Anfragen gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-zinc-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Baumschule</th>
                  <th className="text-left px-4 py-3">Baumart</th>
                  <th className="text-left px-4 py-3">Herkunft</th>
                  <th className="text-right px-4 py-3">Zielmenge</th>
                  <th className="text-left px-4 py-3">Fortschritt</th>
                  <th className="text-left px-4 py-3">Deadline</th>
                  <th className="text-left px-4 py-3">Saison</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {anfragen.map((a) => (
                  <tr key={a.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition">
                    <td className="px-4 py-3 text-white font-medium">{a.baumschule?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{a.baumart}</td>
                    <td className="px-4 py-3 text-zinc-400">{a.herkunft ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{a.zielmenge.toFixed(1)} kg</td>
                    <td className="px-4 py-3">
                      <ProgressBar gesammelt={a.gesammelteKg} ziel={a.zielmenge} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {a.deadline ? new Date(a.deadline).toLocaleDateString("de-DE") : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{a.saison?.jahr ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && anfragen.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Gesamt Anfragen", value: anfragen.length },
            { label: "Gesamt Zielmenge", value: `${anfragen.reduce((s, a) => s + a.zielmenge, 0).toFixed(0)} kg` },
            { label: "Gesamt Gesammelt", value: `${anfragen.reduce((s, a) => s + a.gesammelteKg, 0).toFixed(0)} kg` },
            { label: "Erfüllt", value: anfragen.filter((a) => a.status === "erfüllt").length },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-semibold text-white">Neue Ernteanfrage</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Baumschule *</label>
                <select
                  required
                  value={form.baumschuleId}
                  onChange={(e) => setForm({ ...form, baumschuleId: e.target.value })}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Baumschule wählen…</option>
                  {baumschulen.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Baumart *</label>
                <select
                  required
                  value={form.baumart}
                  onChange={(e) => setForm({ ...form, baumart: e.target.value })}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Baumart wählen…</option>
                  {BAUMARTEN.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Herkunft / Provenienz</label>
                <input
                  type="text"
                  value={form.herkunft}
                  onChange={(e) => setForm({ ...form, herkunft: e.target.value })}
                  placeholder="z.B. Hessen, Bayern, RLP Mix"
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Zielmenge (kg) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={form.zielmenge}
                    onChange={(e) => setForm({ ...form, zielmenge: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Saison</label>
                <select
                  value={form.saisonId}
                  onChange={(e) => setForm({ ...form, saisonId: e.target.value })}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Saison wählen…</option>
                  {saisons.map((s) => (
                    <option key={s.id} value={s.id}>{s.jahr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
                <textarea
                  value={form.notizen}
                  onChange={(e) => setForm({ ...form, notizen: e.target.value })}
                  rows={3}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-lg text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Anfrage erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
