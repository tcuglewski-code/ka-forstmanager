"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Pencil, X, TreePine, Check } from "lucide-react"
import { toast } from "sonner"

interface SortimentItem {
  id: string
  baumart: string
  sorte: string | null
  hkg: string | null
  fovg: boolean
  preis: number
  preis_pro_100: number | null
  einheit: string
  menge: number | null
  min_bestellung: number | null
  verfuegbar: boolean
  aktiv: boolean
  saison: string | null
  notizen: string | null
}

interface BaumschuleDetail {
  id: string
  name: string
  ort?: string | null
  bundesland?: string | null
  ansprechpartner?: string | null
  email?: string | null
  telefon?: string | null
}

interface SortimentForm {
  baumart: string
  sorte: string
  hkg: string
  fovg: boolean
  preis: string
  preis_pro_100: string
  einheit: string
  menge: string
  min_bestellung: string
  verfuegbar: boolean
  aktiv: boolean
  saison: string
  notizen: string
}

const emptyForm: SortimentForm = {
  baumart: "",
  sorte: "",
  hkg: "",
  fovg: false,
  preis: "",
  preis_pro_100: "",
  einheit: "Stk",
  menge: "",
  min_bestellung: "100",
  verfuegbar: true,
  aktiv: true,
  saison: "",
  notizen: "",
}

function SortimentModal({
  item,
  baumschuleId,
  onClose,
  onSaved,
}: {
  item: SortimentItem | null
  baumschuleId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<SortimentForm>(
    item
      ? {
          baumart: item.baumart,
          sorte: item.sorte ?? "",
          hkg: item.hkg ?? "",
          fovg: item.fovg,
          preis: String(item.preis ?? ""),
          preis_pro_100: item.preis_pro_100 != null ? String(item.preis_pro_100) : "",
          einheit: item.einheit ?? "Stk",
          menge: item.menge != null ? String(item.menge) : "",
          min_bestellung: item.min_bestellung != null ? String(item.min_bestellung) : "",
          verfuegbar: item.verfuegbar,
          aktiv: item.aktiv,
          saison: item.saison ?? "",
          notizen: item.notizen ?? "",
        }
      : emptyForm,
  )
  const [saving, setSaving] = useState(false)

  function set<K extends keyof SortimentForm>(key: K, val: SortimentForm[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function save() {
    if (!form.baumart.trim()) return toast.error("Baumart ist Pflichtfeld")
    if (!form.preis || isNaN(parseFloat(form.preis))) return toast.error("Preis ist Pflichtfeld")
    setSaving(true)
    try {
      const url = item
        ? `/api/baumschulen/${baumschuleId}/sortiment/${item.id}`
        : `/api/baumschulen/${baumschuleId}/sortiment`
      const method = item ? "PATCH" : "POST"
      const body = {
        baumart: form.baumart.trim(),
        sorte: form.sorte.trim() || null,
        hkg: form.hkg.trim() || null,
        fovg: form.fovg,
        preis: parseFloat(form.preis),
        preis_pro_100: form.preis_pro_100 ? parseFloat(form.preis_pro_100) : null,
        einheit: form.einheit.trim() || "Stk",
        menge: form.menge ? parseInt(form.menge) : null,
        min_bestellung: form.min_bestellung ? parseInt(form.min_bestellung) : null,
        verfuegbar: form.verfuegbar,
        aktiv: form.aktiv,
        saison: form.saison.trim() || null,
        notizen: form.notizen.trim() || null,
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? "Fehler")
      }
      toast.success(item ? "Eintrag aktualisiert" : "Eintrag angelegt")
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full bg-surface-container-low border border-border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-emerald-500"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface px-6 py-4 border-b border-border flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-on-surface">
            {item ? "Sortiment-Eintrag bearbeiten" : "Neuer Sortiment-Eintrag"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Baumart *</label>
              <input className={inputCls} value={form.baumart} onChange={e => set("baumart", e.target.value)} placeholder="z.B. Rotbuche" />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Sorte</label>
              <input className={inputCls} value={form.sorte} onChange={e => set("sorte", e.target.value)} placeholder="z.B. 1+2P 15-30cm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">HKG</label>
              <input className={inputCls} value={form.hkg} onChange={e => set("hkg", e.target.value)} placeholder="z.B. 848 02" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                <input type="checkbox" checked={form.fovg} onChange={e => set("fovg", e.target.checked)} className="rounded" />
                FoVG
              </label>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Saison</label>
              <input className={inputCls} value={form.saison} onChange={e => set("saison", e.target.value)} placeholder="z.B. 2025/2026" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Preis (€) *</label>
              <input className={inputCls} type="number" step="0.01" value={form.preis} onChange={e => set("preis", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Preis / 100 Stk. (€)</label>
              <input className={inputCls} type="number" step="0.01" value={form.preis_pro_100} onChange={e => set("preis_pro_100", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Einheit</label>
              <input className={inputCls} value={form.einheit} onChange={e => set("einheit", e.target.value)} placeholder="Stk / kg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Bestand (Menge)</label>
              <input className={inputCls} type="number" value={form.menge} onChange={e => set("menge", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Min. Bestellung</label>
              <input className={inputCls} type="number" value={form.min_bestellung} onChange={e => set("min_bestellung", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={form.verfuegbar} onChange={e => set("verfuegbar", e.target.checked)} className="rounded" />
              Verfügbar
            </label>
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={form.aktiv} onChange={e => set("aktiv", e.target.checked)} className="rounded" />
              Aktiv
            </label>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Notizen</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.notizen} onChange={e => set("notizen", e.target.value)} />
          </div>
        </div>
        <div className="sticky bottom-0 bg-surface px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-border text-on-surface">Abbrechen</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
            {saving ? "Speichern..." : item ? "Speichern" : "Anlegen"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BaumschuleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [baumschule, setBaumschule] = useState<BaumschuleDetail | null>(null)
  const [sortiment, setSortiment] = useState<SortimentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalItem, setModalItem] = useState<SortimentItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/baumschulen/${id}/sortiment`)
      if (!res.ok) throw new Error("Fehler")
      const data = await res.json()
      setBaumschule(data.baumschule ?? null)
      setSortiment(Array.isArray(data.sortiment) ? data.sortiment : [])
    } catch {
      toast.error("Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function deleteItem(itemId: string) {
    if (!confirm("Sortiment-Eintrag wirklich löschen?")) return
    try {
      const res = await fetch(`/api/baumschulen/${id}/sortiment/${itemId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Fehler")
      toast.success("Eintrag gelöscht")
      fetchData()
    } catch {
      toast.error("Fehler beim Löschen")
    }
  }

  function openNew() { setModalItem(null); setModalOpen(true) }
  function openEdit(item: SortimentItem) { setModalItem(item); setModalOpen(true) }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link href="/baumschulen" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-4">
        <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
      </Link>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Laden...</div>
      ) : !baumschule ? (
        <div className="text-center py-12 text-on-surface-variant">Baumschule nicht gefunden</div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-surface-container border border-border rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/15 flex items-center justify-center flex-shrink-0">
                <TreePine className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-on-surface" style={{ fontFamily: "var(--font-display)" }}>
                  {baumschule.name}
                </h1>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-on-surface-variant">
                  {(baumschule.ort || baumschule.bundesland) && (
                    <div>
                      <span className="text-xs">Standort: </span>
                      <span className="text-on-surface">{[baumschule.ort, baumschule.bundesland].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {baumschule.ansprechpartner && (
                    <div>
                      <span className="text-xs">Ansprechpartner: </span>
                      <span className="text-on-surface">{baumschule.ansprechpartner}</span>
                    </div>
                  )}
                  {baumschule.email && (
                    <div>
                      <span className="text-xs">E-Mail: </span>
                      <a href={`mailto:${baumschule.email}`} className="text-emerald-400 hover:underline">{baumschule.email}</a>
                    </div>
                  )}
                  {baumschule.telefon && (
                    <div>
                      <span className="text-xs">Telefon: </span>
                      <a href={`tel:${baumschule.telefon}`} className="text-emerald-400 hover:underline">{baumschule.telefon}</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sortiment */}
          <div className="bg-surface-container border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Sortiment & Preisliste</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{sortiment.length} Einträge</p>
              </div>
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500">
                <Plus className="w-4 h-4" /> Sortiment-Item hinzufügen
              </button>
            </div>

            {sortiment.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant text-sm">
                Noch keine Sortiment-Einträge angelegt.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-on-surface-variant uppercase tracking-wide border-b border-border">
                      <th className="px-2 py-2">Baumart</th>
                      <th className="px-2 py-2">Sorte</th>
                      <th className="px-2 py-2">HKG</th>
                      <th className="px-2 py-2">FoVG</th>
                      <th className="px-2 py-2 text-right">Preis/100</th>
                      <th className="px-2 py-2 text-right">Bestand</th>
                      <th className="px-2 py-2">Aktiv</th>
                      <th className="px-2 py-2 w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortiment.map(s => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-surface-container-high">
                        <td className="px-2 py-2 text-on-surface font-medium">{s.baumart}</td>
                        <td className="px-2 py-2 text-on-surface-variant">{s.sorte ?? "—"}</td>
                        <td className="px-2 py-2 text-on-surface-variant font-mono text-xs">{s.hkg ?? "—"}</td>
                        <td className="px-2 py-2">
                          {s.fovg ? <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">FoVG</span> : <span className="text-on-surface-variant">—</span>}
                        </td>
                        <td className="px-2 py-2 text-right text-on-surface font-mono">
                          {s.preis_pro_100 != null ? `${s.preis_pro_100.toFixed(2)} €` : `${s.preis.toFixed(2)} €/${s.einheit}`}
                        </td>
                        <td className="px-2 py-2 text-right text-on-surface-variant">
                          {s.menge != null ? s.menge.toLocaleString("de-DE") : "—"}
                        </td>
                        <td className="px-2 py-2">
                          {s.aktiv ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <span className="text-xs text-on-surface-variant">inaktiv</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface" title="Bearbeiten">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteItem(s.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Löschen">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {modalOpen && id && (
        <SortimentModal
          item={modalItem}
          baumschuleId={id}
          onClose={() => setModalOpen(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
