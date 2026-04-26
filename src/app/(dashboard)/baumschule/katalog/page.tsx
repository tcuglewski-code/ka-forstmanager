"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, TreeDeciduous, X, Trash2, Package } from "lucide-react"
import { toast } from "sonner"

interface Variante {
  id: string
  name: string
  hoehe: string | null
  qualitaet: string | null
  preisProStueck: number | null
  verfuegbar: boolean
  minBestellung: number | null
}

interface Produkt {
  id: string
  baumart: string
  kategorie: string | null
  beschreibung: string | null
  baumschuleId: string | null
  aktiv: boolean
  varianten: Variante[]
}

interface NewVariante {
  name: string
  hoehe: string
  qualitaet: string
  preisProStueck: string
  minBestellung: string
}

function NeuesProduktModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [baumart, setBaumart] = useState("")
  const [kategorie, setKategorie] = useState("")
  const [beschreibung, setBeschreibung] = useState("")
  const [varianten, setVarianten] = useState<NewVariante[]>([
    { name: "", hoehe: "", qualitaet: "", preisProStueck: "", minBestellung: "" },
  ])
  const [loading, setLoading] = useState(false)

  const addVariante = () => setVarianten((v) => [...v, { name: "", hoehe: "", qualitaet: "", preisProStueck: "", minBestellung: "" }])

  const save = async () => {
    if (!baumart.trim()) return toast.error("Baumart ist erforderlich")
    const validVarianten = varianten.filter((v) => v.name.trim())
    setLoading(true)
    try {
      const res = await fetch("/api/produkte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baumart,
          kategorie: kategorie || null,
          beschreibung: beschreibung || null,
          varianten: validVarianten.map((v) => ({
            name: v.name,
            hoehe: v.hoehe || null,
            qualitaet: v.qualitaet || null,
            preisProStueck: parseFloat(v.preisProStueck) || null,
            minBestellung: parseInt(v.minBestellung) || null,
          })),
        }),
      })
      if (!res.ok) throw new Error("Fehler")
      toast.success("Produkt erstellt")
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
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        <div className="sticky top-0 bg-[var(--color-surface)] px-6 py-4 border-b border-border flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-[var(--color-on-surface)]">Neues Produkt</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-surface-container)]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Baumart *</label>
              <input className={inputCls} value={baumart} onChange={(e) => setBaumart(e.target.value)} placeholder="z.B. Rotbuche" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Kategorie</label>
              <select className={inputCls} value={kategorie} onChange={(e) => setKategorie(e.target.value)}>
                <option value="">Keine</option>
                <option value="Laubholz">Laubholz</option>
                <option value="Nadelholz">Nadelholz</option>
                <option value="Sträucher">Sträucher</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Beschreibung</label>
            <textarea className={`${inputCls} h-20 resize-none`} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
          </div>

          {/* Varianten */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">Varianten</h3>
              <button onClick={addVariante} className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Variante
              </button>
            </div>
            <div className="space-y-2">
              {varianten.map((v, idx) => (
                <div key={idx} className="bg-[var(--color-surface-container)] border border-border rounded-lg p-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <input className={inputCls} value={v.name} onChange={(e) => setVarianten((vs) => vs.map((it, i) => (i === idx ? { ...it, name: e.target.value } : it)))} placeholder="Name" />
                    </div>
                    <div className="col-span-2">
                      <input className={inputCls} value={v.hoehe} onChange={(e) => setVarianten((vs) => vs.map((it, i) => (i === idx ? { ...it, hoehe: e.target.value } : it)))} placeholder="Höhe" />
                    </div>
                    <div className="col-span-2">
                      <input className={inputCls} value={v.qualitaet} onChange={(e) => setVarianten((vs) => vs.map((it, i) => (i === idx ? { ...it, qualitaet: e.target.value } : it)))} placeholder="Qual." />
                    </div>
                    <div className="col-span-2">
                      <input className={inputCls} type="number" step="0.01" value={v.preisProStueck} onChange={(e) => setVarianten((vs) => vs.map((it, i) => (i === idx ? { ...it, preisProStueck: e.target.value } : it)))} placeholder="€/Stk" />
                    </div>
                    <div className="col-span-2">
                      <input className={inputCls} type="number" value={v.minBestellung} onChange={(e) => setVarianten((vs) => vs.map((it, i) => (i === idx ? { ...it, minBestellung: e.target.value } : it)))} placeholder="Min." />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button onClick={() => setVarianten((vs) => vs.filter((_, i) => i !== idx))} className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-[var(--color-surface)] px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-border text-[var(--color-on-surface)]">Abbrechen</button>
          <button onClick={save} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-medium bg-green-700 text-white hover:bg-green-600 disabled:opacity-50">
            {loading ? "Speichern..." : "Produkt erstellen"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProduktKatalogPage() {
  const [produkte, setProdukte] = useState<Produkt[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/produkte?${params}`)
      if (!res.ok) throw new Error("Fehler")
      const data = await res.json()
      setProdukte(data.items)
    } catch {
      toast.error("Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const deleteProdukt = async (id: string) => {
    if (!confirm("Produkt wirklich deaktivieren?")) return
    try {
      await fetch(`/api/produkte/${id}`, { method: "DELETE" })
      toast.success("Produkt deaktiviert")
      fetchData()
    } catch {
      toast.error("Fehler")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]" style={{ fontFamily: "var(--font-display)" }}>
            Produktkatalog
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Baumschul-Produkte mit Qualitätsstufen und Größen
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-600">
          <Plus className="w-4 h-4" /> Neues Produkt
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
        <input
          className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
          placeholder="Baumart suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-on-surface-variant)]">Laden...</div>
      ) : produkte.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface-container)] rounded-xl border border-border">
          <TreeDeciduous className="w-12 h-12 mx-auto text-[var(--color-on-surface-variant)] mb-3 opacity-50" />
          <p className="text-[var(--color-on-surface-variant)]">Keine Produkte im Katalog</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-green-500 hover:text-green-400">
            Erstes Produkt anlegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produkte.map((p) => (
            <div key={p.id} className="bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden hover:border-green-600/50 transition-colors">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-700/20 flex items-center justify-center">
                    <TreeDeciduous className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-on-surface)] text-sm">{p.baumart}</h3>
                    {p.kategorie && <span className="text-xs text-[var(--color-on-surface-variant)]">{p.kategorie}</span>}
                  </div>
                </div>
                <button onClick={() => deleteProdukt(p.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {p.beschreibung && (
                <p className="px-5 py-2 text-xs text-[var(--color-on-surface-variant)]">{p.beschreibung}</p>
              )}
              <div className="px-5 py-3">
                {p.varianten.length === 0 ? (
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Keine Varianten</p>
                ) : (
                  <div className="space-y-2">
                    {p.varianten.map((v) => (
                      <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div>
                          <span className="text-sm text-[var(--color-on-surface)]">{v.name}</span>
                          <div className="flex gap-2 text-xs text-[var(--color-on-surface-variant)]">
                            {v.hoehe && <span>{v.hoehe}</span>}
                            {v.qualitaet && <span>Qual. {v.qualitaet}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          {v.preisProStueck != null && (
                            <span className="text-sm font-medium text-green-500">{v.preisProStueck.toFixed(2)} €</span>
                          )}
                          {v.minBestellung && (
                            <p className="text-[10px] text-[var(--color-on-surface-variant)]">min. {v.minBestellung}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 py-2 bg-[var(--color-surface-container-highest)] text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1">
                <Package className="w-3 h-3" /> {p.varianten.length} Variante{p.varianten.length !== 1 ? "n" : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NeuesProduktModal onClose={() => setShowModal(false)} onSave={fetchData} />}
    </div>
  )
}
