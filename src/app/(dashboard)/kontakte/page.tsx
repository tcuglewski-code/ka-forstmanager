"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Phone, Mail, X } from "lucide-react"
import { toast } from "sonner"

interface Kontakt {
  id: string
  name: string
  typ: string
  telefon?: string | null
  email?: string | null
  forstamt?: string | null
  revier?: string | null
  adresse?: string | null
  notizen?: string | null
}

const TYP_FARBEN: Record<string, string> = {
  foerster: "bg-[#2C3A1C] text-emerald-400",
  waldbesitzer: "bg-blue-500/20 text-blue-400",
  behoerde: "bg-amber-500/20 text-amber-400",
  lieferant: "bg-violet-500/20 text-violet-400",
  sonstig: "bg-zinc-500/20 text-zinc-400",
}

const TYPEN = ["foerster", "waldbesitzer", "behoerde", "lieferant", "sonstig"]

function KontaktModal({ kontakt, onClose, onSave }: { kontakt?: Kontakt | null; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: boolean }>({})
  const [form, setForm] = useState({
    name: kontakt?.name ?? "",
    typ: kontakt?.typ ?? "sonstig",
    telefon: kontakt?.telefon ?? "",
    email: kontakt?.email ?? "",
    forstamt: kontakt?.forstamt ?? "",
    revier: kontakt?.revier ?? "",
    adresse: kontakt?.adresse ?? "",
    // Sprint FY (G1): PLZ + Ort Felder
    plz: "",
    ort: "",
    notizen: kontakt?.notizen ?? "",
  })

  // Sprint FY (G1): PLZ → Ort Autofill
  const handlePlzBlur = async () => {
    if (!form.plz || form.plz.length < 5) return
    try {
      const res = await fetch(`https://api.zippopotam.us/de/${form.plz}`)
      if (res.ok) {
        const data = await res.json()
        if (data.places?.[0]) {
          setForm(f => ({ ...f, ort: data.places[0]["place name"] }))
        }
      }
    } catch {
      // Stille Fehler
    }
  }

  // Sprint FY (G2): Forstamt-Vorschläge
  const [forstamtSuggestions, setForstamtSuggestions] = useState<Array<{ name: string; forstamt: string }>>([])
  const [showForstamtDropdown, setShowForstamtDropdown] = useState(false)

  const searchForstamt = async (q: string) => {
    if (q.length < 2) { setForstamtSuggestions([]); return }
    try {
      const res = await fetch(`/api/kontakte/suche?q=${encodeURIComponent(q)}&typ=foerster`)
      if (res.ok) {
        const data = await res.json()
        const unique = Array.from(new Set(data.map((k: { forstamt?: string }) => k.forstamt).filter(Boolean)))
        setForstamtSuggestions(unique.slice(0, 5).map(f => ({ name: String(f), forstamt: String(f) })))
        setShowForstamtDropdown(true)
      }
    } catch {
      // Stille Fehler
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Pflichtfeld-Validierung
    const newErrors: { name?: boolean } = {}
    if (!form.name.trim()) newErrors.name = true
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const url = kontakt?.id ? `/api/kontakte/${kontakt.id}` : "/api/kontakte"
      const method = kontakt?.id ? "PATCH" : "POST"
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      toast.success("Kontakt gespeichert")
    } catch {
      toast.error("Fehler")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a] shrink-0">
          <h2 className="text-lg font-semibold text-white">{kontakt?.id ? "Kontakt bearbeiten" : "Neuer Kontakt"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(v => ({ ...v, name: false })) }}
                className={`w-full bg-[#0f0f0f] border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 ${errors.name ? "border-red-500" : "border-[#2a2a2a]"}`} />
              {errors.name && <p className="text-red-400 text-xs mt-1">Name ist erforderlich</p>}
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Typ</label>
              <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {TYPEN.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Telefon</label>
              <input type="tel" value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">E-Mail</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            {/* Sprint FY (G2): Forstamt mit Autocomplete */}
            <div className="relative">
              <label className="block text-xs text-zinc-400 mb-1">Forstamt</label>
              <input type="text" value={form.forstamt}
                onChange={e => { setForm(f => ({ ...f, forstamt: e.target.value })); searchForstamt(e.target.value) }}
                onFocus={() => form.forstamt && searchForstamt(form.forstamt)}
                onBlur={() => setTimeout(() => setShowForstamtDropdown(false), 200)}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              {showForstamtDropdown && forstamtSuggestions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg max-h-32 overflow-y-auto">
                  {forstamtSuggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => { setForm(f => ({ ...f, forstamt: s.forstamt })); setShowForstamtDropdown(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-[#222] transition-colors">
                      {s.forstamt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Revier</label>
              <input type="text" value={form.revier} onChange={e => setForm(f => ({ ...f, revier: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            {/* Sprint FY (G1): PLZ + Ort mit Autofill */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">PLZ</label>
                <input type="text" value={form.plz}
                  onChange={e => setForm(f => ({ ...f, plz: e.target.value }))}
                  onBlur={handlePlzBlur}
                  placeholder="12345"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">Ort</label>
                <input type="text" value={form.ort}
                  onChange={e => setForm(f => ({ ...f, ort: e.target.value }))}
                  placeholder="wird automatisch befüllt"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-zinc-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Adresse (Straße)</label>
              <input type="text" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
              <textarea value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} rows={3}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
          </div>
          <div className="shrink-0 flex gap-3 p-6 border-t border-[#2a2a2a]">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function KontaktePage() {
  const [kontakte, setKontakte] = useState<Kontakt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterTyp, setFilterTyp] = useState("")
  const [modal, setModal] = useState<{ open: boolean; kontakt?: Kontakt | null }>({ open: false })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (filterTyp) params.set("typ", filterTyp)
    const res = await fetch(`/api/kontakte?${params}`)
    setKontakte(await res.json())
    setLoading(false)
  }, [search, filterTyp])

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kontakte</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{kontakte.length} Kontakte</p>
        </div>
        <button
          onClick={() => setModal({ open: true, kontakt: null })}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Kontakt
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select value={filterTyp} onChange={e => setFilterTyp(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500">
          <option value="">Alle Typen</option>
          {TYPEN.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-600">Laden...</div>
      ) : kontakte.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">Keine Kontakte gefunden</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kontakte.map(k => (
            <div
              key={k.id}
              onClick={() => setModal({ open: true, kontakt: k })}
              className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 hover:border-zinc-600 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white leading-tight">{k.name}</h3>
                <span className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-xs ${TYP_FARBEN[k.typ] ?? "bg-zinc-500/20 text-zinc-400"}`}>
                  {k.typ}
                </span>
              </div>
              {k.forstamt && <p className="text-xs text-zinc-500 mb-2">{k.forstamt}{k.revier ? ` · ${k.revier}` : ""}</p>}
              <div className="space-y-1">
                {k.telefon && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{k.telefon}</span>
                  </div>
                )}
                {k.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Mail className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="truncate">{k.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <KontaktModal
          kontakt={modal.kontakt}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load() }}
        />
      )}
    </div>
  )
}
