"use client"

import { useState, useEffect, useCallback } from "react"
import { ClipboardList, Plus, Loader2, ChevronDown, ChevronUp, X } from "lucide-react"
import TagesprotokollFormular from "@/components/tagesprotokoll/TagesprotokollFormular"
import TagesprotokollDetail, { type TagesprotokollFull } from "@/components/tagesprotokoll/TagesprotokollDetail"

interface Auftrag {
  id: string
  titel: string
  waldbesitzer?: string | null
  gruppe?: { id: string; name: string } | null
  // Sprint FP (A7): Felder für Autofill
  wizardDaten?: {
    flaeche_forstamt?: string
    flaeche_revier?: string
    forstamt?: string
    revier?: string
  } | null
  lat?: number | null
  lng?: number | null
}

interface ProtokollListItem {
  id: string
  datum: string
  status: string
  auftrag?: { id: string; titel: string } | null
  witterung?: string | null
  std_handpflanzung?: number | null
  stk_pflanzung?: number | null
  stk_pflanzung_mit_bohrer?: number | null
  kommentar?: string | null
}

export default function ProtokolleSeite() {
  const [protokolle, setProtokolle] = useState<ProtokollListItem[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)

  // Filter
  const [filterAuftrag, setFilterAuftrag] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterVon, setFilterVon] = useState("")
  const [filterBis, setFilterBis] = useState("")

  // Modal: neues Protokoll
  const [showForm, setShowForm] = useState(false)
  const [selectedAuftrag, setSelectedAuftrag] = useState<Auftrag | null>(null)

  // Detail-Ansicht
  const [detailProtokoll, setDetailProtokoll] = useState<TagesprotokollFull | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterAuftrag) params.set("auftragId", filterAuftrag)
    if (filterStatus) params.set("status", filterStatus)
    if (filterVon) params.set("von", filterVon)
    if (filterBis) params.set("bis", filterBis)
    const [p, a] = await Promise.all([
      fetch(`/api/tagesprotokoll?${params}`).then((r) => r.json()),
      fetch("/api/auftraege").then((r) => r.json()),
    ])
    setProtokolle(Array.isArray(p) ? p : [])
    setAuftraege(Array.isArray(a) ? a : [])
    setLoading(false)
  }, [filterAuftrag, filterStatus, filterVon, filterBis])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function loadDetail(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      setDetailProtokoll(null)
      return
    }
    setExpandedId(id)
    setDetailLoading(true)
    const res = await fetch(`/api/tagesprotokoll/${id}`)
    const data = await res.json()
    setDetailProtokoll(data)
    setDetailLoading(false)
  }

  function openFormForAuftrag(auftragId: string) {
    const a = auftraege.find((x) => x.id === auftragId) ?? null
    setSelectedAuftrag(a)
    setShowForm(true)
  }

  const statusLabel: Record<string, string> = {
    entwurf: "Entwurf",
    eingereicht: "Eingereicht",
    genehmigt: "Genehmigt",
    abgelehnt: "Abgelehnt",
  }

  const statusColor: Record<string, string> = {
    entwurf: "text-zinc-400 bg-zinc-800 border-zinc-700",
    eingereicht: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    genehmigt: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    abgelehnt: "text-red-400 bg-red-500/10 border-red-500/30",
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" /> Tagesprotokolle
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Tagesberichte und Arbeitsprotokolle</p>
        </div>
        <button
          onClick={() => {
            setSelectedAuftrag(auftraege[0] ?? null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Protokoll erstellen
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterAuftrag}
          onChange={(e) => setFilterAuftrag(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">Alle Aufträge</option>
          {auftraege.map((a) => (
            <option key={a.id} value={a.id}>
              {a.titel}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">Alle Status</option>
          <option value="entwurf">Entwurf</option>
          <option value="eingereicht">Eingereicht</option>
          <option value="genehmigt">Genehmigt</option>
          <option value="abgelehnt">Abgelehnt</option>
        </select>
        <input
          type="date"
          value={filterVon}
          onChange={(e) => setFilterVon(e.target.value)}
          placeholder="Von"
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
        />
        <input
          type="date"
          value={filterBis}
          onChange={(e) => setFilterBis(e.target.value)}
          placeholder="Bis"
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : protokolle.length === 0 ? (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <ClipboardList className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">Noch keine Protokolle vorhanden.</p>
          {auftraege.length > 0 && (
            <button
              onClick={() => { setSelectedAuftrag(auftraege[0]); setShowForm(true) }}
              className="mt-4 text-sm text-emerald-400 hover:text-emerald-300"
            >
              Erstes Protokoll erstellen →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {protokolle.map((p) => (
            <div key={p.id} className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {/* Row */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#1c1c1c] transition-colors"
                onClick={() => loadDetail(p.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {new Date(p.datum).toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                    {p.auftrag && (
                      <span className="text-sm text-zinc-400 truncate">{p.auftrag.titel}</span>
                    )}
                    {p.witterung && (
                      <span className="text-xs text-zinc-500">{p.witterung}</span>
                    )}
                  </div>
                  {p.kommentar && (
                    <p className="text-xs text-zinc-600 mt-0.5 truncate">{p.kommentar}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {((p.stk_pflanzung ?? 0) + (p.stk_pflanzung_mit_bohrer ?? 0)) > 0 && (
                    <span className="text-xs font-medium text-emerald-400">
                      {((p.stk_pflanzung ?? 0) + (p.stk_pflanzung_mit_bohrer ?? 0)).toLocaleString()} Stk.
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[p.status] ?? "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
                    {statusLabel[p.status] ?? p.status}
                  </span>
                  {expandedId === p.id ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {/* Detail-Panel */}
              {expandedId === p.id && (
                <div className="border-t border-[#2a2a2a] p-5">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    </div>
                  ) : detailProtokoll ? (
                    <div className="flex flex-col gap-4">
                      <TagesprotokollDetail protokoll={detailProtokoll} />
                      {/* Neues Protokoll für gleichen Auftrag */}
                      {p.auftrag && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => openFormForAuftrag(p.auftrag!.id)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                          >
                            + Neues Protokoll für diesen Auftrag
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Neues Protokoll */}
      {showForm && selectedAuftrag && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <h2 className="text-base font-bold text-white">Tagesprotokoll erstellen</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auftrag wählen */}
            <div className="px-6 pt-4 pb-0">
              <label className="block text-xs text-zinc-500 mb-1">Auftrag *</label>
              <select
                value={selectedAuftrag.id}
                onChange={(e) => {
                  const a = auftraege.find((x) => x.id === e.target.value) ?? null
                  setSelectedAuftrag(a)
                }}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white mb-2"
              >
                {auftraege.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titel}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-6 py-4">
              <TagesprotokollFormular
                auftragId={selectedAuftrag?.id ?? ""}
                auftragTitel={selectedAuftrag?.titel}
                waldbesitzer={selectedAuftrag?.waldbesitzer ?? undefined}
                gruppeId={selectedAuftrag?.gruppe?.id}
                // Sprint FP (A7): Autofill Revier + Forstamt aus Auftrag
                defaultFoerstamt={selectedAuftrag?.wizardDaten?.flaeche_forstamt ?? selectedAuftrag?.wizardDaten?.forstamt ?? ""}
                defaultRevier={selectedAuftrag?.wizardDaten?.flaeche_revier ?? selectedAuftrag?.wizardDaten?.revier ?? ""}
                defaultGpsLat={selectedAuftrag?.lat ?? undefined}
                defaultGpsLon={selectedAuftrag?.lng ?? undefined}
                onSaved={async () => {
                  setShowForm(false)
                  await fetchAll()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
