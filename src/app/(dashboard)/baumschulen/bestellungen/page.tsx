"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Filter,
  Inbox,
  Mail,
  MapPin,
  Phone,
  TreePine,
  X,
} from "lucide-react"

type Bestellung = {
  id: string
  baumart: string
  menge: number
  flaecheHa: number | null
  bundesland: string | null
  kontaktName: string | null
  kontaktEmail: string | null
  kontaktTelefon: string | null
  pflanzenArten: unknown
  notizen: string | null
  quelle: string | null
  status: string
  createdAt: string
  baumschuleId: string | null
  baumschule: { id: string; name: string; ort: string | null; bundesland: string | null } | null
}

type BaumschuleLite = {
  id: string
  name: string
  ort: string | null
  bundesland: string | null
  preislisten?: { baumart: string }[]
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  neu: { label: "neu", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  zugewiesen: { label: "zugewiesen", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  angeboten: { label: "angeboten", cls: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  bestaetigt: { label: "bestätigt", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  geliefert: { label: "geliefert", cls: "bg-emerald-700/20 text-emerald-300 border-emerald-700/40" },
  storniert: { label: "storniert", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
}

const STATUS_FILTER = ["alle", "neu", "zugewiesen", "angeboten", "bestaetigt", "geliefert", "storniert"]

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${m.cls}`}>
      {m.label}
    </span>
  )
}

function ZuweisenModal({
  bestellung,
  baumschulen,
  onClose,
  onSaved,
}: {
  bestellung: Bestellung
  baumschulen: BaumschuleLite[]
  onClose: () => void
  onSaved: () => void
}) {
  const [selectedId, setSelectedId] = useState(bestellung.baumschuleId ?? "")
  const [saving, setSaving] = useState(false)
  const [onlyMatching, setOnlyMatching] = useState(true)

  const baumartLower = bestellung.baumart.toLowerCase()
  const filtered = useMemo(() => {
    if (!onlyMatching) return baumschulen
    return baumschulen.filter((b) =>
      (b.preislisten ?? []).some((p) => p.baumart.toLowerCase().includes(baumartLower))
    )
  }, [baumschulen, onlyMatching, baumartLower])

  async function save() {
    if (!selectedId) return toast.error("Baumschule wählen")
    setSaving(true)
    try {
      const res = await fetch(`/api/baumschulen/bestellungen/${bestellung.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baumschuleId: selectedId, status: "zugewiesen" }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? "Fehler")
      }
      toast.success("Baumschule zugewiesen")
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Baumschule zuweisen</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm text-on-surface-variant">
            Bestellung: <span className="text-on-surface font-medium">{bestellung.baumart}</span>
            {bestellung.flaecheHa ? ` · ${bestellung.flaecheHa} ha` : ""}
            {bestellung.bundesland ? ` · ${bestellung.bundesland}` : ""}
          </div>
          <label className="flex items-center gap-2 text-xs text-on-surface-variant">
            <input
              type="checkbox"
              checked={onlyMatching}
              onChange={(e) => setOnlyMatching(e.target.checked)}
            />
            Nur Baumschulen mit „{bestellung.baumart}“ im Sortiment
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
          >
            <option value="">— Baumschule wählen —</option>
            {filtered.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.ort ? ` (${b.ort})` : ""}
              </option>
            ))}
          </select>
          {filtered.length === 0 && (
            <p className="text-xs text-amber-500">
              Keine Baumschulen mit dieser Baumart im Sortiment gefunden.
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-border text-on-surface">
            Abbrechen
          </button>
          <button
            onClick={save}
            disabled={saving || !selectedId}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Zuweisen"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BestellungenAdminPage() {
  const [items, setItems] = useState<Bestellung[]>([])
  const [baumschulen, setBaumschulen] = useState<BaumschuleLite[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("alle")
  const [baumartFilter, setBaumartFilter] = useState("")
  const [modalFor, setModalFor] = useState<Bestellung | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (statusFilter !== "alle") q.set("status", statusFilter)
      if (baumartFilter.trim()) q.set("baumart", baumartFilter.trim())
      const [bRes, bsRes] = await Promise.all([
        fetch(`/api/baumschulen/bestellungen?${q.toString()}`),
        fetch("/api/saatguternte/baumschulen"),
      ])
      if (!bRes.ok) throw new Error("Bestellungen konnten nicht geladen werden")
      const bJson = await bRes.json()
      setItems(Array.isArray(bJson?.bestellungen) ? bJson.bestellungen : [])

      if (bsRes.ok) {
        const bsJson = await bsRes.json()
        const list: BaumschuleLite[] = Array.isArray(bsJson) ? bsJson : []
        // Phase-1-Fix: API liefert preislisten jetzt direkt mit (keine N+1 Fetches mehr)
        setBaumschulen(list)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, baumartFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function stornieren(b: Bestellung) {
    if (!confirm(`Bestellung „${b.baumart}“ wirklich stornieren?`)) return
    try {
      const res = await fetch(`/api/baumschulen/bestellungen/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "storniert" }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? "Fehler")
      }
      toast.success("Storniert")
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <Link
          href="/baumschulen"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zu Baumschulen
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface" style={{ fontFamily: "var(--font-display)" }}>
            Eingehende Bestellungen
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Anfragen aus dem Pflanzenbeschaffungs-Wizard — Baumschule zuweisen, Status verfolgen.
          </p>
        </div>
      </div>

      <div className="bg-surface-container border border-border rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-on-surface-variant" />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                statusFilter === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-surface-container-low text-on-surface-variant border-border hover:border-emerald-500/50"
              }`}
            >
              {s === "alle" ? "alle" : STATUS_META[s]?.label ?? s}
            </button>
          ))}
        </div>
        <input
          value={baumartFilter}
          onChange={(e) => setBaumartFilter(e.target.value)}
          placeholder="Baumart filtern…"
          className="ml-auto bg-surface-container-low border border-border rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Laden...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-surface-container rounded-xl border border-border">
          <Inbox className="w-12 h-12 mx-auto text-on-surface-variant mb-3 opacity-50" />
          <p className="text-on-surface-variant">Keine Bestellungen gefunden</p>
        </div>
      ) : (
        <div className="bg-surface-container border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Datum</th>
                  <th className="text-left px-4 py-3 font-medium">Baumart</th>
                  <th className="text-left px-4 py-3 font-medium">Fläche</th>
                  <th className="text-left px-4 py-3 font-medium">Bundesland</th>
                  <th className="text-left px-4 py-3 font-medium">Kontakt</th>
                  <th className="text-left px-4 py-3 font-medium">Baumschule</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id} className="border-t border-border hover:bg-surface-container-low/50">
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TreePine className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-on-surface font-medium">{b.baumart}</span>
                      </div>
                      {b.menge > 0 && (
                        <div className="text-[11px] text-on-surface-variant">{b.menge} Stück</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {b.flaecheHa ? `${b.flaecheHa} ha` : "—"}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {b.bundesland ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {b.bundesland}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-on-surface text-xs">{b.kontaktName ?? "—"}</div>
                      {b.kontaktEmail && (
                        <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <a className="hover:underline" href={`mailto:${b.kontaktEmail}`}>{b.kontaktEmail}</a>
                        </div>
                      )}
                      {b.kontaktTelefon && (
                        <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {b.kontaktTelefon}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.baumschule ? (
                        <Link
                          href={`/baumschulen/${b.baumschule.id}`}
                          className="text-emerald-500 hover:text-emerald-400 text-xs"
                        >
                          {b.baumschule.name}
                        </Link>
                      ) : (
                        <span className="text-on-surface-variant text-xs">— nicht zugewiesen —</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {b.status !== "storniert" && b.status !== "geliefert" && (
                        <>
                          <button
                            onClick={() => setModalFor(b)}
                            className="text-xs px-2 py-1 rounded-md border border-border hover:border-emerald-500 text-on-surface mr-1.5"
                          >
                            {b.baumschuleId ? "Ändern" : "Zuweisen"}
                          </button>
                          {b.status !== "bestaetigt" && (
                            <button
                              onClick={() => stornieren(b)}
                              className="text-xs px-2 py-1 rounded-md border border-border hover:border-red-500 text-on-surface-variant"
                            >
                              Stornieren
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalFor && (
        <ZuweisenModal
          bestellung={modalFor}
          baumschulen={baumschulen}
          onClose={() => setModalFor(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
