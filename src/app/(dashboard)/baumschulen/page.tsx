"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, TreePine, MapPin, Mail, Phone, X, Package, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface Baumschule {
  id: string
  name: string
  ort: string | null
  bundesland: string | null
  ansprechpartner: string | null
  email: string | null
  telefon: string | null
  aktiv: boolean
  _count?: { anfragen?: number; preislisten?: number }
}

function NewBaumschuleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("")
  const [ort, setOrt] = useState("")
  const [bundesland, setBundesland] = useState("")
  const [ansprechpartner, setAnsprechpartner] = useState("")
  const [email, setEmail] = useState("")
  const [telefon, setTelefon] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return toast.error("Name ist Pflichtfeld")
    setSaving(true)
    try {
      const res = await fetch("/api/saatguternte/baumschulen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ort: ort.trim() || null,
          bundesland: bundesland.trim() || null,
          ansprechpartner: ansprechpartner.trim() || null,
          email: email.trim() || null,
          telefon: telefon.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? "Fehler")
      }
      toast.success("Baumschule angelegt")
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
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Neue Baumschule</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Name *</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Baumschule Darmstädter" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Ort</label>
              <input className={inputCls} value={ort} onChange={e => setOrt(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Bundesland</label>
              <input className={inputCls} value={bundesland} onChange={e => setBundesland(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Ansprechpartner</label>
            <input className={inputCls} value={ansprechpartner} onChange={e => setAnsprechpartner(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">E-Mail</label>
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Telefon</label>
              <input className={inputCls} value={telefon} onChange={e => setTelefon(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-border text-on-surface">Abbrechen</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
            {saving ? "Speichern..." : "Anlegen"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BaumschulenListPage() {
  const [items, setItems] = useState<Baumschule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/saatguternte/baumschulen")
      if (!res.ok) throw new Error("Fehler")
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface" style={{ fontFamily: "var(--font-display)" }}>
            Baumschulen
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Verwaltung der Baumschul-Partner inkl. Sortiment & Preislisten
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500">
          <Plus className="w-4 h-4" /> Neue Baumschule
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Laden...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-surface-container rounded-xl border border-border">
          <TreePine className="w-12 h-12 mx-auto text-on-surface-variant mb-3 opacity-50" />
          <p className="text-on-surface-variant">Noch keine Baumschulen angelegt</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-emerald-500 hover:text-emerald-400">
            Erste Baumschule anlegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(b => (
            <Link
              key={b.id}
              href={`/baumschulen/${b.id}`}
              className="group bg-surface-container border border-border rounded-xl p-5 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center flex-shrink-0">
                    <TreePine className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-on-surface text-sm truncate">{b.name}</h3>
                    {!b.aktiv && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-500">inaktiv</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="space-y-1.5 text-xs text-on-surface-variant">
                {(b.ort || b.bundesland) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>{[b.ort, b.bundesland].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {b.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{b.email}</span>
                  </div>
                )}
                {b.telefon && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <span>{b.telefon}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-on-surface-variant">
                <Package className="w-3 h-3" />
                <span>{b._count?.preislisten ?? 0} Sortiment-Einträge</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <NewBaumschuleModal onClose={() => setShowModal(false)} onSaved={fetchData} />}
    </div>
  )
}
