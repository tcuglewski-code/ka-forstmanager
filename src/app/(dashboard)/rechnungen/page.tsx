"use client"

import { useState, useEffect, useCallback } from "react"
import { Receipt, Plus, Loader2, CheckCircle, ExternalLink, Printer } from "lucide-react"

interface Rechnung {
  id: string
  nummer: string
  betrag: number
  mwst: number
  status: string
  rechnungsDatum: string
  faelligAm?: string | null
  pdfUrl?: string | null
  notizen?: string | null
  auftrag?: { id: string; titel: string } | null
}

interface Auftrag { id: string; titel: string }

const statusBadge: Record<string, string> = {
  offen: "bg-blue-500/20 text-blue-400",
  freigegeben: "bg-amber-500/20 text-amber-400",
  bezahlt: "bg-emerald-500/20 text-emerald-400",
  storniert: "bg-red-500/20 text-red-400",
}

const statusLabel: Record<string, string> = {
  offen: "Offen",
  freigegeben: "Freigegeben",
  bezahlt: "Bezahlt",
  storniert: "Storniert",
}

export default function RechnungenPage() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nummer: "", auftragId: "", betrag: "", mwst: "19", faelligAm: "", notizen: "" })
  const [selectedAuftragLink, setSelectedAuftragLink] = useState("")
  const [loadingBetrag, setLoadingBetrag] = useState(false)

  // Sprint Q: Filter + Sortierung
  const [filterStatus, setFilterStatus] = useState("")
  const [sortBy, setSortBy] = useState<"datum" | "betrag" | "status">("datum")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [r, a] = await Promise.all([
      fetch("/api/rechnungen").then((r) => r.json()),
      fetch("/api/auftraege").then((r) => r.json()),
    ])
    setRechnungen(Array.isArray(r) ? r : [])
    setAuftraege(Array.isArray(a) ? a : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch(`/api/rechnungen/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    await fetchAll()
  }

  // Sprint Q + FP (A5): Auto-Laden aus Auftrag (Betrag, Kundename, Bezeichnung)
  async function onAuftragSelected(auftragId: string) {
    setForm(prev => ({ ...prev, auftragId }))
    setSelectedAuftragLink(auftragId ? `/auftraege/${auftragId}` : "")
    if (!auftragId) return

    setLoadingBetrag(true)
    try {
      // Sprint FP (A5): Auch Auftragsdaten laden für Kundename + Bezeichnung
      const [wirtschaftRes, auftragRes] = await Promise.all([
        fetch(`/api/auftraege/${auftragId}/wirtschaftlichkeit`),
        fetch(`/api/auftraege/${auftragId}`),
      ])
      const w = await wirtschaftRes.json()
      const auftragData = await auftragRes.json()

      // Betrag aus Wirtschaftlichkeit
      let betrag = ""
      if (w.umsatz && w.umsatz > 0) {
        betrag = String(w.umsatz)
      } else if (w.stundenAnzahl > 0) {
        const config = await fetch("/api/einstellungen/config").then(r => r.json())
        const vollkosten = parseFloat(config.vollkosten_pro_stunde ?? "43.50")
        betrag = String(Math.round(w.stundenAnzahl * vollkosten * 100) / 100)
      }

      // Sprint FP (A5): Notizen mit Kunde + Bezeichnung vorausfüllen
      const kunde = auftragData.waldbesitzer || ""
      const bezeichnung = auftragData.titel || ""
      const notizen = [
        kunde ? `Kunde: ${kunde}` : "",
        bezeichnung ? `Auftrag: ${bezeichnung}` : "",
      ].filter(Boolean).join("\n")

      setForm(prev => ({
        ...prev,
        betrag: betrag || prev.betrag,
        notizen: notizen || prev.notizen,
      }))
    } catch {
      // Fehler ignorieren
    }
    setLoadingBetrag(false)
  }

  async function create() {
    setSaving(true)
    await fetch("/api/rechnungen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm({ nummer: "", auftragId: "", betrag: "", mwst: "19", faelligAm: "", notizen: "" })
    setSelectedAuftragLink("")
    await fetchAll()
    setSaving(false)
  }

  // Sprint Q: Filtern + Sortieren (client-seitig)
  const gefilterteRechnungen = rechnungen
    .filter(r => !filterStatus || r.status === filterStatus)
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === "datum") {
        cmp = new Date(a.rechnungsDatum).getTime() - new Date(b.rechnungsDatum).getTime()
      } else if (sortBy === "betrag") {
        cmp = a.betrag - b.betrag
      } else if (sortBy === "status") {
        cmp = a.status.localeCompare(b.status)
      }
      return sortDir === "asc" ? cmp : -cmp
    })

  const gesamtOffen = rechnungen.filter((r) => r.status === "offen" || r.status === "freigegeben").reduce((s, r) => s + r.betrag, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" /> Rechnungen
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Offene Summe: <span className="text-amber-400 font-medium">{gesamtOffen.toFixed(2)} €</span>
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Rechnung erstellen
        </button>
      </div>

      {/* Sprint Q: Filter + Sortierung */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white"
        >
          <option value="">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="freigegeben">Freigegeben</option>
          <option value="bezahlt">Bezahlt</option>
          <option value="storniert">Storniert</option>
        </select>
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [b, d] = e.target.value.split("-")
            setSortBy(b as "datum" | "betrag" | "status")
            setSortDir(d as "asc" | "desc")
          }}
          className="px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white"
        >
          <option value="datum-desc">Datum (neueste)</option>
          <option value="datum-asc">Datum (älteste)</option>
          <option value="betrag-desc">Betrag (höchste)</option>
          <option value="betrag-asc">Betrag (niedrigste)</option>
          <option value="status-asc">Status (A–Z)</option>
        </select>
        {filterStatus && (
          <span className="flex items-center text-xs text-zinc-500">
            {gefilterteRechnungen.length} von {rechnungen.length} Rechnungen
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Nummer</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Auftrag</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Betrag</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Fällig</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">PDF</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {gefilterteRechnungen.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-600">
                  {filterStatus ? "Keine Rechnungen mit diesem Status" : "Keine Rechnungen"}
                </td></tr>
              ) : gefilterteRechnungen.map((r) => (
                <tr key={r.id} className="hover:bg-[#1c1c1c]">
                  <td className="px-6 py-4 text-sm font-mono text-white">{r.nummer}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {r.auftrag ? (
                      <a href={`/auftraege/${r.auftrag.id}`} className="hover:text-emerald-400 transition-colors">
                        {r.auftrag.titel}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-white">{r.betrag.toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[r.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {r.faelligAm ? new Date(r.faelligAm).toLocaleDateString("de-DE") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {r.pdfUrl ? (
                      <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <a href={`/rechnungen/${r.id}/drucken`} target="_blank"
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                        <Printer className="w-3 h-3" /> Drucken
                      </a>
                      {r.status === "offen" && (
                        <button onClick={() => patch(r.id, { status: "freigegeben" })} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs hover:bg-amber-500/30">
                          Freigeben
                        </button>
                      )}
                      {(r.status === "offen" || r.status === "freigegeben") && (
                        <button onClick={() => patch(r.id, { status: "bezahlt" })} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> Bezahlt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Rechnung erstellen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Rechnungsnummer (leer = auto-generiert)</label>
                <input
                  value={form.nummer}
                  onChange={(e) => setForm({ ...form, nummer: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="RE-2026-0001 (wird automatisch vergeben)"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Auftrag</label>
                <select
                  value={form.auftragId}
                  onChange={(e) => onAuftragSelected(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">— kein Auftrag —</option>
                  {auftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}</option>)}
                </select>
                {/* Sprint Q: Link zum Auftrag */}
                {selectedAuftragLink && (
                  <a
                    href={selectedAuftragLink}
                    target="_blank"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Auftrag in neuem Tab öffnen
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Betrag (€)
                    {loadingBetrag && <span className="ml-1 text-zinc-600">wird geladen...</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.betrag}
                    onChange={(e) => setForm({ ...form, betrag: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="Wird aus Auftrag geladen"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">MwSt (%)</label>
                  <input type="number" value={form.mwst} onChange={(e) => setForm({ ...form, mwst: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fällig am</label>
                <input type="date" value={form.faelligAm} onChange={(e) => setForm({ ...form, faelligAm: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
                <textarea value={form.notizen} onChange={(e) => setForm({ ...form, notizen: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setSelectedAuftragLink("") }}
                className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]"
              >
                Abbrechen
              </button>
              <button
                onClick={create}
                disabled={saving || !form.betrag}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
