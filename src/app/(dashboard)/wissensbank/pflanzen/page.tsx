"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, TreePine, Droplets, Sun, Thermometer, Sprout, Plus, X, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface PflanzenInfo {
  id: string
  baumart: string
  lateinischName: string | null
  hoeheCm: number | null
  wurzeltiefeCm: number | null
  lichtbedarf: string | null
  bodentypus: string | null
  wuchsgeschwindigkeit: string | null
  frosthaerte: string | null
  pflegeaufwand: string | null
  foerderFaehig: boolean
  beschreibung: string | null
  bildUrl: string | null
  quellen: string | null
}

const LICHTBEDARF_LABELS: Record<string, string> = {
  vollsonne: "Vollsonne",
  halbschatten: "Halbschatten",
  schatten: "Schatten",
}

const SPEED_LABELS: Record<string, string> = {
  schnell: "Schnell",
  mittel: "Mittel",
  langsam: "Langsam",
}

const HAERTE_LABELS: Record<string, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
}

export default function PflanzenPage() {
  const [pflanzen, setPflanzen] = useState<PflanzenInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<PflanzenInfo | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const res = await fetch(`/api/pflanzen-info${params}`)
      const data = await res.json()
      setPflanzen(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Fehler beim Laden der Pflanzendaten")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(loadData, 300)
    return () => clearTimeout(timer)
  }, [loadData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] font-[family-name:var(--font-lora)]">
            Pflanzensteckbriefe
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Informationen zu Baumarten für Aufforstung und Kulturpflege
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Baumart
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Baumart suchen..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-container)] border border-border rounded-lg text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : pflanzen.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-on-surface-variant)]">
          <TreePine className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Noch keine Pflanzensteckbriefe vorhanden</p>
          <p className="text-xs mt-1">Erstellen Sie den ersten Steckbrief mit dem Button oben.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pflanzen.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="text-left bg-[var(--color-surface-container)] border border-border rounded-xl p-4 hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-[var(--color-on-surface)] group-hover:text-emerald-400 transition-colors">
                    {p.baumart}
                  </h3>
                  {p.lateinischName && (
                    <p className="text-xs text-[var(--color-on-surface-variant)] italic">{p.lateinischName}</p>
                  )}
                </div>
                <TreePine className="w-5 h-5 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.lichtbedarf && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded">
                    <Sun className="w-3 h-3" /> {LICHTBEDARF_LABELS[p.lichtbedarf] || p.lichtbedarf}
                  </span>
                )}
                {p.frosthaerte && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded">
                    <Thermometer className="w-3 h-3" /> {HAERTE_LABELS[p.frosthaerte] || p.frosthaerte}
                  </span>
                )}
                {p.wuchsgeschwindigkeit && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded">
                    <Sprout className="w-3 h-3" /> {SPEED_LABELS[p.wuchsgeschwindigkeit] || p.wuchsgeschwindigkeit}
                  </span>
                )}
                {p.foerderFaehig && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-violet-500/10 text-violet-500 rounded">
                    <CheckCircle className="w-3 h-3" /> Förderfähig
                  </span>
                )}
              </div>
              {p.beschreibung && (
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-2 line-clamp-2">
                  {p.beschreibung}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <SteckbriefDetail pflanze={selected} onClose={() => setSelected(null)} />
      )}

      {/* Add Modal */}
      {showAdd && (
        <SteckbriefForm
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadData() }}
        />
      )}
    </div>
  )
}

function SteckbriefDetail({ pflanze: p, onClose }: { pflanze: PflanzenInfo; onClose: () => void }) {
  const row = (label: string, value: string | number | null | undefined) =>
    value != null && value !== "" ? (
      <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
        <span className="text-xs text-[var(--color-on-surface-variant)]">{label}</span>
        <span className="text-sm text-[var(--color-on-surface)] font-medium">{value}</span>
      </div>
    ) : null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-on-surface)]">{p.baumart}</h2>
            {p.lateinischName && <p className="text-sm text-[var(--color-on-surface-variant)] italic">{p.lateinischName}</p>}
          </div>
          <button onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-1">
          {row("Max. Höhe", p.hoeheCm ? `${p.hoeheCm} cm` : null)}
          {row("Wurzeltiefe", p.wurzeltiefeCm ? `${p.wurzeltiefeCm} cm` : null)}
          {row("Lichtbedarf", p.lichtbedarf ? (LICHTBEDARF_LABELS[p.lichtbedarf] || p.lichtbedarf) : null)}
          {row("Bodentypus", p.bodentypus)}
          {row("Wuchsgeschwindigkeit", p.wuchsgeschwindigkeit ? (SPEED_LABELS[p.wuchsgeschwindigkeit] || p.wuchsgeschwindigkeit) : null)}
          {row("Frosthärte", p.frosthaerte ? (HAERTE_LABELS[p.frosthaerte] || p.frosthaerte) : null)}
          {row("Pflegeaufwand", p.pflegeaufwand ? (HAERTE_LABELS[p.pflegeaufwand] || p.pflegeaufwand) : null)}
          {row("Förderfähig", p.foerderFaehig ? "Ja" : "Nein")}
          {p.beschreibung && (
            <div className="pt-3">
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Beschreibung</p>
              <p className="text-sm text-[var(--color-on-surface)]">{p.beschreibung}</p>
            </div>
          )}
          {p.quellen && (
            <div className="pt-2">
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Quellen</p>
              <p className="text-xs text-[var(--color-on-surface-variant)]">{p.quellen}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SteckbriefForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    baumart: "",
    lateinischName: "",
    hoeheCm: "",
    wurzeltiefeCm: "",
    lichtbedarf: "",
    bodentypus: "",
    wuchsgeschwindigkeit: "",
    frosthaerte: "",
    pflegeaufwand: "",
    foerderFaehig: false,
    beschreibung: "",
    quellen: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.baumart.trim()) {
      toast.error("Baumart ist erforderlich")
      return
    }
    setLoading(true)
    try {
      const payload = {
        baumart: form.baumart.trim(),
        lateinischName: form.lateinischName || null,
        hoeheCm: form.hoeheCm ? parseInt(form.hoeheCm) : null,
        wurzeltiefeCm: form.wurzeltiefeCm ? parseInt(form.wurzeltiefeCm) : null,
        lichtbedarf: form.lichtbedarf || null,
        bodentypus: form.bodentypus || null,
        wuchsgeschwindigkeit: form.wuchsgeschwindigkeit || null,
        frosthaerte: form.frosthaerte || null,
        pflegeaufwand: form.pflegeaufwand || null,
        foerderFaehig: form.foerderFaehig,
        beschreibung: form.beschreibung || null,
        quellen: form.quellen || null,
      }
      const res = await fetch("/api/pflanzen-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Fehler beim Speichern")
        return
      }
      toast.success("Pflanzensteckbrief erstellt")
      onSaved()
    } catch {
      toast.error("Netzwerkfehler")
    } finally {
      setLoading(false)
    }
  }

  const sel = (label: string, key: string, options: { value: string; label: string }[]) => (
    <div>
      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">{label}</label>
      <select
        value={form[key as keyof typeof form] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
      >
        <option value="">— wählen —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const input = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Neuer Pflanzensteckbrief</h2>
          <button onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {input("Baumart *", "baumart", "text", "z.B. Eiche")}
              {input("Lateinisch", "lateinischName", "text", "z.B. Quercus robur")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {input("Max. Höhe (cm)", "hoeheCm", "number")}
              {input("Wurzeltiefe (cm)", "wurzeltiefeCm", "number")}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {sel("Lichtbedarf", "lichtbedarf", [
                { value: "vollsonne", label: "Vollsonne" },
                { value: "halbschatten", label: "Halbschatten" },
                { value: "schatten", label: "Schatten" },
              ])}
              {sel("Wuchsgeschw.", "wuchsgeschwindigkeit", [
                { value: "schnell", label: "Schnell" },
                { value: "mittel", label: "Mittel" },
                { value: "langsam", label: "Langsam" },
              ])}
              {sel("Frosthärte", "frosthaerte", [
                { value: "hoch", label: "Hoch" },
                { value: "mittel", label: "Mittel" },
                { value: "niedrig", label: "Niedrig" },
              ])}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {input("Bodentypus", "bodentypus", "text", "z.B. Lehm, Sand")}
              {sel("Pflegeaufwand", "pflegeaufwand", [
                { value: "niedrig", label: "Niedrig" },
                { value: "mittel", label: "Mittel" },
                { value: "hoch", label: "Hoch" },
              ])}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.foerderFaehig}
                onChange={e => setForm(f => ({ ...f, foerderFaehig: e.target.checked }))}
                className="accent-emerald-500"
              />
              <span className="text-sm text-[var(--color-on-surface)]">Förderfähig</span>
            </label>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Beschreibung</label>
              <textarea
                value={form.beschreibung}
                onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                rows={3}
                placeholder="Kurzbeschreibung der Baumart..."
                className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            {input("Quellen", "quellen", "text", "z.B. Wikipedia, BFW")}
          </div>
          <div className="p-6 border-t border-border shrink-0 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.baumart.trim()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Speichern..." : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
