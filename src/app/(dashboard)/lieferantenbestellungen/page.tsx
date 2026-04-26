"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, ShoppingCart, Truck, Check, X, FileText, Clock,
  Sparkles, Trash2, ChevronDown, Search,
} from "lucide-react"
import { toast } from "sonner"

interface Position {
  id?: string
  baumart: string
  menge: number
  einheit: string
  preisProEinheit: number | null
  gesamtpreis: number | null
  qualitaet: string | null
  bemerkung: string | null
}

interface Bestellung {
  id: string
  bestellnummer: string
  lieferantName: string
  lieferantEmail: string | null
  bestelldatum: string
  lieferdatum: string | null
  status: string
  gesamtbetrag: number | null
  bemerkung: string | null
  positionen: Position[]
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  entwurf: { bg: "bg-zinc-500/20", text: "text-[var(--color-on-surface-variant)]", icon: <FileText className="w-3 h-3" />, label: "Entwurf" },
  bestellt: { bg: "bg-blue-500/20", text: "text-blue-400", icon: <Clock className="w-3 h-3" />, label: "Bestellt" },
  geliefert: { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: <Check className="w-3 h-3" />, label: "Geliefert" },
  storniert: { bg: "bg-red-500/20", text: "text-red-400", icon: <X className="w-3 h-3" />, label: "Storniert" },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.entwurf
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  )
}

interface NewPosition {
  baumart: string
  menge: string
  einheit: string
  preisProEinheit: string
  qualitaet: string
}

function NeueBestellungModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [lieferantName, setLieferantName] = useState("")
  const [lieferantEmail, setLieferantEmail] = useState("")
  const [bemerkung, setBemerkung] = useState("")
  const [positionen, setPositionen] = useState<NewPosition[]>([
    { baumart: "", menge: "", einheit: "Stück", preisProEinheit: "", qualitaet: "" },
  ])
  const [aiText, setAiText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const addPosition = () => setPositionen((p) => [...p, { baumart: "", menge: "", einheit: "Stück", preisProEinheit: "", qualitaet: "" }])
  const removePosition = (idx: number) => setPositionen((p) => p.filter((_, i) => i !== idx))

  const extractAI = async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/lieferantenbestellungen/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      })
      if (!res.ok) throw new Error("Fehler")
      const data = await res.json()
      if (data.positionen?.length) {
        setPositionen(
          data.positionen.map((p: { baumart: string; menge: number; einheit: string; preisProEinheit: number | null; qualitaet: string | null }) => ({
            baumart: p.baumart || "",
            menge: String(p.menge || ""),
            einheit: p.einheit || "Stück",
            preisProEinheit: p.preisProEinheit ? String(p.preisProEinheit) : "",
            qualitaet: p.qualitaet || "",
          }))
        )
        toast.success(`${data.positionen.length} Positionen extrahiert`)
      }
    } catch {
      toast.error("KI-Extraktion fehlgeschlagen")
    } finally {
      setAiLoading(false)
    }
  }

  const save = async () => {
    if (!lieferantName.trim()) return toast.error("Lieferant ist erforderlich")
    const validPositionen = positionen.filter((p) => p.baumart.trim() && parseInt(p.menge) > 0)
    if (validPositionen.length === 0) return toast.error("Mindestens eine Position erforderlich")

    setLoading(true)
    try {
      const gesamtbetrag = validPositionen.reduce((sum, p) => {
        const preis = parseFloat(p.preisProEinheit) || 0
        return sum + preis * parseInt(p.menge)
      }, 0)

      const res = await fetch("/api/lieferantenbestellungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lieferantName,
          lieferantEmail: lieferantEmail || null,
          bemerkung: bemerkung || null,
          gesamtbetrag: gesamtbetrag || null,
          positionen: validPositionen.map((p) => ({
            baumart: p.baumart,
            menge: parseInt(p.menge),
            einheit: p.einheit,
            preisProEinheit: parseFloat(p.preisProEinheit) || null,
            qualitaet: p.qualitaet || null,
          })),
        }),
      })
      if (!res.ok) throw new Error("Fehler")
      toast.success("Bestellung erstellt")
      onSave()
      onClose()
    } catch {
      toast.error("Fehler beim Erstellen")
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
        <div className="sticky top-0 bg-[var(--color-surface)] px-6 py-4 border-b border-border flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-[var(--color-on-surface)]">Neue Lieferantenbestellung</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-surface-container)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lieferant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Lieferant *</label>
              <input className={inputCls} value={lieferantName} onChange={(e) => setLieferantName(e.target.value)} placeholder="Baumschule / Lieferant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">E-Mail</label>
              <input className={inputCls} type="email" value={lieferantEmail} onChange={(e) => setLieferantEmail(e.target.value)} placeholder="email@lieferant.de" />
            </div>
          </div>

          {/* KI-Extraktion */}
          <div className="bg-[var(--color-surface-container)] rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-[var(--color-on-surface)]">KI-Import aus Text</span>
            </div>
            <textarea
              className={`${inputCls} h-24 resize-none`}
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Rechnung/Lieferschein-Text einfügen... z.B.: 500 Stk Rotbuche Qualität A 40-60cm à 0,85€"
            />
            <button
              onClick={extractAI}
              disabled={aiLoading || !aiText.trim()}
              className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2"
            >
              {aiLoading ? "Extrahiere..." : "Positionen extrahieren"}
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Positionen */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">Positionen</h3>
              <button onClick={addPosition} className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Position
              </button>
            </div>
            <div className="space-y-2">
              {positionen.map((pos, idx) => (
                <div key={idx} className="bg-[var(--color-surface-container)] border border-border rounded-lg p-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <input className={inputCls} value={pos.baumart} onChange={(e) => setPositionen((p) => p.map((it, i) => (i === idx ? { ...it, baumart: e.target.value } : it)))} placeholder="Baumart" />
                    </div>
                    <div className="col-span-2">
                      <input className={inputCls} type="number" min="1" value={pos.menge} onChange={(e) => setPositionen((p) => p.map((it, i) => (i === idx ? { ...it, menge: e.target.value } : it)))} placeholder="Menge" />
                    </div>
                    <div className="col-span-2">
                      <select className={inputCls} value={pos.einheit} onChange={(e) => setPositionen((p) => p.map((it, i) => (i === idx ? { ...it, einheit: e.target.value } : it)))}>
                        <option>Stück</option>
                        <option>Bund</option>
                        <option>kg</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input className={inputCls} type="number" step="0.01" min="0" value={pos.preisProEinheit} onChange={(e) => setPositionen((p) => p.map((it, i) => (i === idx ? { ...it, preisProEinheit: e.target.value } : it)))} placeholder="€/Stk" />
                    </div>
                    <div className="col-span-2">
                      <input className={inputCls} value={pos.qualitaet} onChange={(e) => setPositionen((p) => p.map((it, i) => (i === idx ? { ...it, qualitaet: e.target.value } : it)))} placeholder="Qual." />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button onClick={() => removePosition(idx)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bemerkung */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Bemerkung</label>
            <textarea className={`${inputCls} h-20 resize-none`} value={bemerkung} onChange={(e) => setBemerkung(e.target.value)} />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[var(--color-surface)] px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-border text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]">
            Abbrechen
          </button>
          <button onClick={save} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-medium bg-green-700 text-white hover:bg-green-600 disabled:opacity-50">
            {loading ? "Speichern..." : "Bestellung anlegen"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LieferantenBestellungenPage() {
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/lieferantenbestellungen?${params}`)
      if (!res.ok) throw new Error("Fehler")
      const data = await res.json()
      setBestellungen(data.items)
    } catch {
      toast.error("Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/lieferantenbestellungen/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Fehler")
      toast.success(`Status: ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
      fetchData()
    } catch {
      toast.error("Status-Update fehlgeschlagen")
    }
  }

  const deleteBestellung = async (id: string) => {
    if (!confirm("Bestellung wirklich löschen?")) return
    try {
      const res = await fetch(`/api/lieferantenbestellungen/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Fehler")
      toast.success("Gelöscht")
      fetchData()
    } catch {
      toast.error("Fehler beim Löschen")
    }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "–"
  const formatCurrency = (n: number | null) => n != null ? `${n.toFixed(2)} €` : "–"

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]" style={{ fontFamily: "var(--font-display)" }}>
            Lieferantenbestellungen
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Bestellungen bei Baumschulen und Lieferanten verwalten
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-600"
        >
          <Plus className="w-4 h-4" /> Neue Bestellung
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
          <input
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
            placeholder="Suche nach Lieferant oder Nummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Alle Status</option>
          <option value="entwurf">Entwurf</option>
          <option value="bestellt">Bestellt</option>
          <option value="geliefert">Geliefert</option>
          <option value="storniert">Storniert</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-[var(--color-on-surface-variant)]">Laden...</div>
      ) : bestellungen.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface-container)] rounded-xl border border-border">
          <ShoppingCart className="w-12 h-12 mx-auto text-[var(--color-on-surface-variant)] mb-3 opacity-50" />
          <p className="text-[var(--color-on-surface-variant)]">Keine Bestellungen vorhanden</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-green-500 hover:text-green-400">
            Erste Bestellung anlegen
          </button>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                <th className="px-4 py-3">Nummer</th>
                <th className="px-4 py-3">Lieferant</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Betrag</th>
                <th className="px-4 py-3 text-right">Pos.</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bestellungen.map((b) => (
                <tr key={b.id} className="border-b border-border/50 last:border-0 hover:bg-[var(--color-surface-container-highest)] transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} className="font-mono text-sm text-green-500 hover:text-green-400 flex items-center gap-1">
                      {b.bestellnummer}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === b.id ? "rotate-180" : ""}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-on-surface)]">{b.lieferantName}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-on-surface-variant)]">{formatDate(b.bestelldatum)}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-on-surface)]">{formatCurrency(b.gesamtbetrag)}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-on-surface-variant)]">{b.positionen.length}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status === "entwurf" && (
                        <button onClick={() => updateStatus(b.id, "bestellt")} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400" title="Als bestellt markieren">
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      {b.status === "bestellt" && (
                        <button onClick={() => updateStatus(b.id, "geliefert")} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title="Als geliefert markieren">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteBestellung(b.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Löschen">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expanded positions */}
          {expandedId && bestellungen.find((b) => b.id === expandedId)?.positionen.length ? (
            <div className="px-4 py-3 bg-[var(--color-surface-container-highest)] border-t border-border">
              <h4 className="text-xs font-semibold text-[var(--color-on-surface-variant)] mb-2 uppercase">Positionen</h4>
              <div className="grid grid-cols-5 gap-2 text-xs text-[var(--color-on-surface-variant)] mb-1 font-medium">
                <span>Baumart</span><span>Menge</span><span>Einheit</span><span>Preis/Stk</span><span>Gesamt</span>
              </div>
              {bestellungen.find((b) => b.id === expandedId)!.positionen.map((p, i) => (
                <div key={p.id || i} className="grid grid-cols-5 gap-2 text-sm text-[var(--color-on-surface)] py-1">
                  <span>{p.baumart}</span>
                  <span>{p.menge}</span>
                  <span>{p.einheit}</span>
                  <span>{p.preisProEinheit != null ? `${p.preisProEinheit.toFixed(2)} €` : "–"}</span>
                  <span>{p.gesamtpreis != null ? `${p.gesamtpreis.toFixed(2)} €` : "–"}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {showModal && <NeueBestellungModal onClose={() => setShowModal(false)} onSave={fetchData} />}
    </div>
  )
}
