"use client"

import { useState, useEffect, useCallback } from "react"
import { ClipboardList, Plus, X, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface LinkedProtokoll {
  id: string
  datum: string
  ersteller?: string | null
  status: string
  gepflanztGesamt?: number | null
  flaecheBearbeitetHa?: number | null
  arbeitsbeginn?: string | null
  arbeitsende?: string | null
  mitarbeiterAnzahl?: number | null
  auftrag?: { titel: string; nummer?: string | null } | null
}

interface AvailableProtokoll {
  id: string
  datum: string
  ersteller?: string | null
  status: string
  gepflanztGesamt?: number | null
  flaecheBearbeitetHa?: number | null
}

export default function ProtokolleSection({
  rechnungId,
  auftragId,
}: {
  rechnungId: string
  auftragId?: string | null
}) {
  const [linked, setLinked] = useState<LinkedProtokoll[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [available, setAvailable] = useState<AvailableProtokoll[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const fetchLinked = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rechnungen/${rechnungId}/protokolle`)
      if (res.ok) setLinked(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [rechnungId])

  useEffect(() => { fetchLinked() }, [fetchLinked])

  async function openModal() {
    setShowModal(true)
    setLoadingAvailable(true)
    setSelected(new Set())
    try {
      const params = new URLSearchParams({ status: "genehmigt" })
      if (auftragId) params.set("auftragId", auftragId)
      const res = await fetch(`/api/tagesprotokoll?${params}`)
      if (res.ok) {
        const all: AvailableProtokoll[] = await res.json()
        const linkedIds = new Set(linked.map((p) => p.id))
        setAvailable(all.filter((p) => !linkedIds.has(p.id)))
      }
    } catch { /* ignore */ }
    setLoadingAvailable(false)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function saveLinks() {
    if (selected.size === 0) return
    setSaving(true)
    try {
      for (const protokollId of selected) {
        await fetch(`/api/rechnungen/${rechnungId}/protokolle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ protokollId }),
        })
      }
      toast.success(`${selected.size} Protokoll(e) verknüpft`)
      setShowModal(false)
      await fetchLinked()
    } catch {
      toast.error("Fehler beim Verknüpfen")
    }
    setSaving(false)
  }

  async function removeLink(protokollId: string) {
    if (!confirm("Verknüpfung entfernen?")) return
    try {
      const res = await fetch(`/api/rechnungen/${rechnungId}/protokolle/${protokollId}`, { method: "DELETE" })
      if (res.ok) {
        setLinked((prev) => prev.filter((p) => p.id !== protokollId))
        toast.success("Verknüpfung entfernt")
      }
    } catch {
      toast.error("Fehler beim Entfernen")
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="bg-[#161616] border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Zugehörige Protokolle
        </h3>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Protokoll verknüpfen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      ) : linked.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-4">Keine Protokolle verknüpft</p>
      ) : (
        <div className="space-y-2">
          {linked.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-[#111] border border-border rounded-lg px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-white">{fmtDate(p.datum)}</span>
                  {p.ersteller && <span className="text-xs text-zinc-500">{p.ersteller}</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                  {p.gepflanztGesamt != null && p.gepflanztGesamt > 0 && (
                    <span>{p.gepflanztGesamt.toLocaleString("de-DE")} Bäume</span>
                  )}
                  {p.flaecheBearbeitetHa != null && p.flaecheBearbeitetHa > 0 && (
                    <span>{p.flaecheBearbeitetHa} ha</span>
                  )}
                  {p.mitarbeiterAnzahl != null && p.mitarbeiterAnzahl > 0 && (
                    <span>{p.mitarbeiterAnzahl} MA</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeLink(p.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors ml-3"
                title="Verknüpfung entfernen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Protokoll verknüpfen */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a1a] border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-white">Genehmigte Protokolle verknüpfen</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingAvailable ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
              ) : available.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">Keine genehmigten Protokolle verfügbar</p>
              ) : (
                available.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                      selected.has(p.id)
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-[#111] border-border hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="accent-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-white">{fmtDate(p.datum)}</span>
                      {p.ersteller && <span className="text-xs text-zinc-500 ml-2">{p.ersteller}</span>}
                      <div className="flex gap-3 mt-0.5 text-xs text-zinc-500">
                        {p.gepflanztGesamt != null && p.gepflanztGesamt > 0 && (
                          <span>{p.gepflanztGesamt.toLocaleString("de-DE")} Bäume</span>
                        )}
                        {p.flaecheBearbeitetHa != null && p.flaecheBearbeitetHa > 0 && (
                          <span>{p.flaecheBearbeitetHa} ha</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {available.length > 0 && (
              <div className="px-6 py-4 border-t border-border">
                <button
                  onClick={saveLinks}
                  disabled={saving || selected.size === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {selected.size} Protokoll(e) verknüpfen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
