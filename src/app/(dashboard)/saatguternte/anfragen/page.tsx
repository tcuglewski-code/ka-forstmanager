// @ts-nocheck
"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, X, Loader2, ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"

const BAUMARTEN = [
  "Stieleiche", "Traubeneiche", "Rotbuche", "Fichte", "Kiefer", "Lärche",
  "Kastanie", "Roteiche", "Walnuss", "Schwarznuss", "Baumhasel", "Esche",
  "Bergahorn", "Spitzahorn", "Douglasie", "Weißtanne", "Gemeine Kiefer",
]

const STATUS_CONFIG = {
  offen:         { label: "Offen",            color: "bg-[var(--color-surface-container-high)] text-zinc-300" },
  in_ernte:      { label: "In Ernte",         color: "bg-blue-900/60 text-blue-300" },
  "erfüllt":     { label: "Erfüllt ✅",       color: "bg-emerald-900/60 text-emerald-300" },
  teilerfüllt:   { label: "Teilerfüllt 🟡",   color: "bg-yellow-900/60 text-yellow-300" },
  storniert:     { label: "Storniert",        color: "bg-red-900/60 text-red-300" },
  "überschuss":  { label: "Überschuss ↑",     color: "bg-purple-900/60 text-purple-300" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-[var(--color-surface-container-high)] text-zinc-300" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function ProgressBar({ gesammelt, ziel }: { gesammelt: number; ziel: number }) {
  const pct = ziel > 0 ? Math.min(100, (gesammelt / ziel) * 100) : 0
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"
  const filled = Math.round(pct / 20)
  const empty = 5 - filled
  const blocks = "█".repeat(filled) + "░".repeat(empty)
  return (
    <div className="space-y-1 min-w-[160px]">
      <div className="w-full bg-[var(--color-surface-container-high)] rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-[var(--color-on-surface-variant)] font-mono">
        {blocks} {gesammelt.toLocaleString("de-DE")} / {ziel.toLocaleString("de-DE")} kg ({pct.toFixed(0)}%)
      </p>
    </div>
  )
}

function SHKBadge({ anfrage }: { anfrage: any }) {
  if (!anfrage.sonderherkunft) {
    return <span className="text-zinc-600">—</span>
  }
  return (
    <div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-900/50 text-yellow-300 border border-yellow-700/40">
        ⭐ SHK
      </span>
      {anfrage.sonderherkunftCode && (
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{anfrage.sonderherkunftCode}</p>
      )}
    </div>
  )
}

function HerkunftCell({ anfrage }: { anfrage: any }) {
  if (!anfrage.herkunftCode && !anfrage.herkunft) {
    return <span className="text-zinc-600">—</span>
  }
  return (
    <div>
      <span className="text-[var(--color-on-surface)] font-medium">{anfrage.herkunftCode ?? anfrage.herkunft}</span>
      {anfrage.herkunftName && (
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{anfrage.herkunftName}</p>
      )}
    </div>
  )
}

function RegisterLink({ anfrage }: { anfrage: any }) {
  const code = anfrage.herkunftCode || anfrage.herkunft
  if (!code) return null
  const href = `/saatguternte/register?search=${encodeURIComponent(code)}&baumart=${encodeURIComponent(anfrage.baumart)}`
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-1"
      title="Passende Flächen im Register"
    >
      <ExternalLink className="w-3 h-3" />
      Flächen
    </Link>
  )
}

function BaumartGruppe({ baumart, items, collapsed, onToggle }: {
  baumart: string
  items: any[]
  collapsed: boolean
  onToggle: () => void
}) {
  const totalZiel = items.reduce((s, a) => s + a.zielmenge, 0)
  return (
    <>
      {/* Subheader */}
      <tr
        className="bg-[#1a2a1a] border-b border-border cursor-pointer hover:bg-[#1e2e1e] transition"
        onClick={onToggle}
      >
        <td colSpan={9} className="px-4 py-2">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-emerald-300 font-semibold text-sm tracking-wide uppercase">
              {baumart}
            </span>
            <span className="text-[var(--color-on-surface-variant)] text-xs">
              ({items.length} {items.length === 1 ? "Anfrage" : "Anfragen"} · {totalZiel.toLocaleString("de-DE")} kg gesamt)
            </span>
          </div>
        </td>
      </tr>
      {/* Rows */}
      {!collapsed && items.map((a) => (
        <tr key={a.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-lowest)] transition">
          <td className="px-4 py-3 text-[var(--color-on-surface)] font-medium">
            <div>{a.baumschule?.name ?? "—"}</div>
            <div className="text-xs text-[var(--color-on-surface-variant)]">{a.saison?.jahr ?? ""}</div>
          </td>
          <td className="px-4 py-3 text-zinc-300">{a.baumart}</td>
          <td className="px-4 py-3">
            <HerkunftCell anfrage={a} />
            <RegisterLink anfrage={a} />
          </td>
          <td className="px-4 py-3">
            <SHKBadge anfrage={a} />
          </td>
          <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">
            {a.zielmenge.toLocaleString("de-DE")} kg
          </td>
          <td className="px-4 py-3 text-right text-[var(--color-on-surface-variant)] tabular-nums">
            {a.gesammelteKg.toLocaleString("de-DE")} kg
          </td>
          <td className="px-4 py-3">
            <ProgressBar gesammelt={a.gesammelteKg} ziel={a.zielmenge} />
          </td>
          <td className="px-4 py-3">
            <StatusBadge status={a.status} />
          </td>
          <td className="px-4 py-3 text-[var(--color-on-surface-variant)] text-xs">
            {a.deadline ? new Date(a.deadline).toLocaleDateString("de-DE") : "—"}
          </td>
        </tr>
      ))}
    </>
  )
}

const EMPTY_FORM = {
  baumschuleId: "",
  saisonId: "",
  baumart: "",
  herkunftCode: "",
  herkunftName: "",
  sonderherkunft: false,
  sonderherkunftCode: "",
  sonderherkunftName: "",
  zielmenge: "",
  deadline: "",
  notizen: "",
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
  const [filterHerkunft, setFilterHerkunft] = useState("")
  const [filterNurSHK, setFilterNurSHK] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")

  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // Form
  const [form, setForm] = useState({ ...EMPTY_FORM })

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterSaison) params.set("saisonId", filterSaison)
    if (filterBaumart) params.set("baumart", filterBaumart)
    if (filterStatus) params.set("status", filterStatus)
    if (filterHerkunft) params.set("herkunftCode", filterHerkunft)
    if (filterNurSHK) params.set("sonderherkunft", "true")

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

  useEffect(() => { load() }, [filterSaison, filterBaumart, filterStatus, filterHerkunft, filterNurSHK])

  // Gruppierung nach Baumart
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const a of anfragen) {
      if (!map[a.baumart]) map[a.baumart] = []
      map[a.baumart].push(a)
    }
    // Sort groups by name, sort within group by herkunftCode
    const result: Array<{ baumart: string; items: any[] }> = []
    for (const baumart of Object.keys(map).sort()) {
      const items = map[baumart].sort((a, b) => {
        const ca = a.herkunftCode ?? a.herkunft ?? ""
        const cb = b.herkunftCode ?? b.herkunft ?? ""
        return ca.localeCompare(cb)
      })
      result.push({ baumart, items })
    }
    return result
  }, [anfragen])

  function toggleGroup(baumart: string) {
    setCollapsedGroups((prev) => ({ ...prev, [baumart]: !prev[baumart] }))
  }

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
      setForm({ ...EMPTY_FORM })
      load()
    }
    setSaving(false)
  }

  const hasFilter = filterSaison || filterBaumart || filterStatus || filterHerkunft || filterNurSHK

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ernteanfragen</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Baumschul-Aufträge · Herkunftsgebiet · Sonderherkünfte
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Neue Anfrage
        </button>
      </div>

      {/* Filter-Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterSaison}
          onChange={(e) => setFilterSaison(e.target.value)}
          className="bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
        >
          <option value="">Alle Saisons</option>
          {saisons.map((s) => (
            <option key={s.id} value={s.id}>{s.jahr}</option>
          ))}
        </select>

        <select
          value={filterBaumart}
          onChange={(e) => setFilterBaumart(e.target.value)}
          className="bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
        >
          <option value="">Alle Baumarten</option>
          {BAUMARTEN.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <input
          type="text"
          value={filterHerkunft}
          onChange={(e) => setFilterHerkunft(e.target.value)}
          placeholder="Herkunft-Code…"
          className="bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2 w-36"
        />

        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={filterNurSHK}
            onChange={(e) => setFilterNurSHK(e.target.checked)}
            className="accent-yellow-400 w-4 h-4"
          />
          ⭐ Nur Sonderherkünfte
        </label>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {hasFilter && (
          <button
            onClick={() => {
              setFilterSaison("")
              setFilterBaumart("")
              setFilterStatus("")
              setFilterHerkunft("")
              setFilterNurSHK(false)
            }}
            className="flex items-center gap-1 px-3 py-2 text-xs text-[var(--color-on-surface-variant)] hover:text-white border border-border rounded-lg"
          >
            <X className="w-3 h-3" /> Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Tabelle */}
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : anfragen.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-on-surface-variant)]">
            Keine Anfragen gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[var(--color-on-surface-variant)] text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Baumschule</th>
                  <th className="text-left px-4 py-3">Baumart</th>
                  <th className="text-left px-4 py-3">Herkunft</th>
                  <th className="text-left px-4 py-3">SHK</th>
                  <th className="text-right px-4 py-3">Ziel kg</th>
                  <th className="text-right px-4 py-3">Gesammelt</th>
                  <th className="text-left px-4 py-3">Fortschritt</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(({ baumart, items }) => (
                  <BaumartGruppe
                    key={baumart}
                    baumart={baumart}
                    items={items}
                    collapsed={!!collapsedGroups[baumart]}
                    onToggle={() => toggleGroup(baumart)}
                  />
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
            { label: "Gesamt Zielmenge", value: `${anfragen.reduce((s, a) => s + a.zielmenge, 0).toLocaleString("de-DE")} kg` },
            { label: "Gesamt Gesammelt", value: `${anfragen.reduce((s, a) => s + a.gesammelteKg, 0).toLocaleString("de-DE")} kg` },
            { label: "Sonderherkünfte", value: anfragen.filter((a) => a.sonderherkunft).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4">
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-on-surface)" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container)] border border-border rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Neue Ernteanfrage</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-on-surface-variant)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Baumschule */}
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Baumschule *</label>
                <select
                  required
                  value={form.baumschuleId}
                  onChange={(e) => setForm({ ...form, baumschuleId: e.target.value })}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Baumschule wählen…</option>
                  {baumschulen.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Saison */}
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Saison</label>
                <select
                  value={form.saisonId}
                  onChange={(e) => setForm({ ...form, saisonId: e.target.value })}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Saison wählen…</option>
                  {saisons.map((s) => (
                    <option key={s.id} value={s.id}>{s.jahr}</option>
                  ))}
                </select>
              </div>

              {/* Baumart */}
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Baumart *</label>
                <select
                  required
                  value={form.baumart}
                  onChange={(e) => setForm({ ...form, baumart: e.target.value })}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Baumart wählen…</option>
                  {BAUMARTEN.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Herkunft */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Herkunftsgebiet-Code</label>
                  <input
                    type="text"
                    value={form.herkunftCode}
                    onChange={(e) => setForm({ ...form, herkunftCode: e.target.value })}
                    placeholder="z.B. 06, 818 07"
                    className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Herkunftsgebiet-Name</label>
                  <input
                    type="text"
                    value={form.herkunftName}
                    onChange={(e) => setForm({ ...form, herkunftName: e.target.value })}
                    placeholder="optional"
                    className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Sonderherkunft */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.sonderherkunft}
                    onChange={(e) => setForm({ ...form, sonderherkunft: e.target.checked })}
                    className="accent-yellow-400 w-4 h-4"
                  />
                  <span className="text-sm text-[var(--color-on-surface)] font-medium">⭐ Sonderherkunft (DKV)</span>
                </label>
                {form.sonderherkunft && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Sonderherkunft-Code</label>
                      <input
                        type="text"
                        value={form.sonderherkunftCode}
                        onChange={(e) => setForm({ ...form, sonderherkunftCode: e.target.value })}
                        placeholder="z.B. DKV-818-001"
                        className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Sonderherkunft-Name</label>
                      <input
                        type="text"
                        value={form.sonderherkunftName}
                        onChange={(e) => setForm({ ...form, sonderherkunftName: e.target.value })}
                        placeholder="optional"
                        className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Zielmenge + Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Zielmenge (kg) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={form.zielmenge}
                    onChange={(e) => setForm({ ...form, zielmenge: e.target.value })}
                    className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Notizen</label>
                <textarea
                  value={form.notizen}
                  onChange={(e) => setForm({ ...form, notizen: e.target.value })}
                  rows={3}
                  className="w-full bg-[var(--color-surface-container-highest)] border border-border text-[var(--color-on-surface)] text-sm rounded-lg px-3 py-2 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border text-[var(--color-on-surface-variant)] hover:text-white rounded-lg text-sm"
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
