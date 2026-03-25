"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X, Car, Truck, Wrench, Tractor } from "lucide-react"
import { toast } from "sonner"

interface Fahrzeug {
  id: string
  typ: string
  bezeichnung: string
  kennzeichen?: string | null
  baujahr?: number | null
  status: string
  tuvDatum?: string | null
  naechsteWartung?: string | null
  notizen?: string | null
  stundenBonus?: number | null
  bonusBeschreibung?: string | null
}
interface Geraet {
  id: string
  typ: string
  bezeichnung: string
  seriennummer?: string | null
  status: string
  naechsteWartung?: string | null
}

interface Gruppe {
  id: string
  name: string
}

interface Auftrag {
  id: string
  titel: string
}

interface Maschineneinsatz {
  id: string
  fahrzeug: { id: string; bezeichnung: string; kennzeichen?: string | null }
  gruppe?: { id: string; name: string } | null
  auftrag?: { id: string; titel: string } | null
  vonDatum: string
  bisDatum?: string | null
  zweck?: string | null
  stundensatz?: number | null
}

const STATUS_FARBEN: Record<string, string> = {
  verfuegbar: "bg-emerald-500/20 text-emerald-400",
  im_einsatz: "bg-amber-500/20 text-amber-400",
  in_wartung: "bg-blue-500/20 text-blue-400",
  defekt: "bg-red-500/20 text-red-400",
}

const TypIcon = ({ typ }: { typ: string }) => {
  if (typ === "lkw") return <Truck className="w-4 h-4" />
  if (typ === "maschine") return <Tractor className="w-4 h-4" />
  return <Car className="w-4 h-4" />
}

// ─── Modal: Fahrzeug bearbeiten (Y2) ─────────────────────────────────────────

function FahrzeugEditModal({
  fahrzeug,
  onClose,
  onSave,
}: {
  fahrzeug: Fahrzeug
  onClose: () => void
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    typ: fahrzeug.typ,
    bezeichnung: fahrzeug.bezeichnung,
    kennzeichen: fahrzeug.kennzeichen ?? "",
    baujahr: fahrzeug.baujahr ? String(fahrzeug.baujahr) : "",
    status: fahrzeug.status,
    tuvDatum: fahrzeug.tuvDatum ? fahrzeug.tuvDatum.split("T")[0] : "",
    notizen: fahrzeug.notizen ?? "",
    stundenBonus: fahrzeug.stundenBonus ? String(fahrzeug.stundenBonus) : "",
    bonusBeschreibung: fahrzeug.bonusBeschreibung ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/fuhrpark/${fahrzeug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Fehler beim Speichern")
      toast.success("Fahrzeug aktualisiert")
    } catch {
      toast.error("Fehler beim Speichern")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Fahrzeug bearbeiten</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Typ</label>
              <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["pkw", "lkw", "transporter", "maschine"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["verfuegbar", "im_einsatz", "in_wartung", "defekt"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {[["Bezeichnung *", "bezeichnung"], ["Kennzeichen", "kennzeichen"], ["Baujahr", "baujahr"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input type={key === "baujahr" ? "number" : "text"} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">TÜV-Datum</label>
            <input type="date" value={form.tuvDatum} onChange={e => setForm(f => ({ ...f, tuvDatum: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
            <textarea rows={2} value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="border-t border-[#2a2a2a] pt-3">
            <p className="text-xs text-zinc-500 mb-3">Maschinenbonus</p>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Maschinenzuschlag (€/h)</label>
              <input type="number" step="0.50" min="0" placeholder="0.00" value={form.stundenBonus}
                onChange={e => setForm(f => ({ ...f, stundenBonus: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="mt-3">
              <label className="text-xs text-zinc-500 mb-1 block">Bonus-Beschreibung</label>
              <input type="text" placeholder="z.B. Schwermaschinenzuschlag" value={form.bonusBeschreibung}
                onChange={e => setForm(f => ({ ...f, bonusBeschreibung: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.bezeichnung}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Aktualisieren"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Neues Fahrzeug ────────────────────────────────────────────────────

function FahrzeugModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    typ: "pkw", bezeichnung: "", kennzeichen: "", baujahr: "", status: "verfuegbar",
    tuvDatum: "", notizen: "", stundenBonus: "", bonusBeschreibung: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/fuhrpark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      toast.success("Fahrzeug gespeichert")
    } catch {
      toast.error("Fehler beim Speichern")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Neues Fahrzeug</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Typ</label>
              <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["pkw", "lkw", "transporter", "maschine"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["verfuegbar", "im_einsatz", "in_wartung", "defekt"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {[["Bezeichnung *", "bezeichnung"], ["Kennzeichen", "kennzeichen"], ["Baujahr", "baujahr"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input type={key === "baujahr" ? "number" : "text"} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">TÜV-Datum</label>
            <input type="date" value={form.tuvDatum} onChange={e => setForm(f => ({ ...f, tuvDatum: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          {/* K6: Maschinenbonus */}
          <div className="border-t border-[#2a2a2a] pt-3">
            <p className="text-xs text-zinc-500 mb-3">Maschinenbonus (Sprint K6)</p>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Maschinenzuschlag (€/h)</label>
              <input type="number" step="0.50" min="0" placeholder="0.00"
                value={form.stundenBonus}
                onChange={(e) => setForm(prev => ({ ...prev, stundenBonus: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="mt-3">
              <label className="text-xs text-zinc-500 mb-1 block">Bonus-Beschreibung</label>
              <input type="text" placeholder="z.B. Schwermaschinenzuschlag"
                value={form.bonusBeschreibung}
                onChange={(e) => setForm(prev => ({ ...prev, bonusBeschreibung: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.bezeichnung} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Neues Gerät ───────────────────────────────────────────────────────

function GeraetModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ typ: "", bezeichnung: "", seriennummer: "", status: "verfuegbar", naechsteWartung: "", notizen: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/geraete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      toast.success("Gerät gespeichert")
    } catch {
      toast.error("Fehler beim Speichern")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Neues Gerät</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[["Typ *", "typ"], ["Bezeichnung *", "bezeichnung"], ["Seriennummer", "seriennummer"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input type="text" value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nächste Wartung</label>
            <input type="date" value={form.naechsteWartung} onChange={e => setForm(f => ({ ...f, naechsteWartung: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.bezeichnung || !form.typ} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Einsatz buchen ────────────────────────────────────────────────────

function EinsatzModal({
  fahrzeuge, gruppen, auftraege, onClose, onSave,
}: {
  fahrzeuge: Fahrzeug[]
  gruppen: Gruppe[]
  auftraege: Auftrag[]
  onClose: () => void
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fahrzeugId: "", gruppeId: "", auftragId: "",
    vonDatum: new Date().toISOString().slice(0, 10),
    bisDatum: "", zweck: "", stundensatz: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/maschineneinsaetze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gruppeId: form.gruppeId || null,
          auftragId: form.auftragId || null,
          bisDatum: form.bisDatum || null,
          stundensatz: form.stundensatz ? parseFloat(form.stundensatz) : null,
        }),
      })
      toast.success("Einsatz gebucht")
    } catch {
      toast.error("Fehler beim Buchen")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Einsatz buchen</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Fahrzeug *</label>
            <select value={form.fahrzeugId} onChange={e => setForm(f => ({ ...f, fahrzeugId: e.target.value }))} required
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">— wählen —</option>
              {fahrzeuge.map(f => (
                <option key={f.id} value={f.id}>{f.bezeichnung}{f.kennzeichen ? ` (${f.kennzeichen})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Gruppe</label>
            <select value={form.gruppeId} onChange={e => setForm(f => ({ ...f, gruppeId: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">— keine Gruppe —</option>
              {gruppen.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Auftrag (optional)</label>
            <select value={form.auftragId} onChange={e => setForm(f => ({ ...f, auftragId: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">— kein Auftrag —</option>
              {auftraege.map(a => <option key={a.id} value={a.id}>{a.titel}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Von *</label>
              <input type="date" value={form.vonDatum} onChange={e => setForm(f => ({ ...f, vonDatum: e.target.value }))} required
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Bis (optional)</label>
              <input type="date" value={form.bisDatum} onChange={e => setForm(f => ({ ...f, bisDatum: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Zweck</label>
            <input type="text" value={form.zweck} onChange={e => setForm(f => ({ ...f, zweck: e.target.value }))}
              placeholder="z.B. Holztransport, Pflanzung..."
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Stundensatz (€/h)</label>
            <input type="number" step="0.50" min="0" value={form.stundensatz} onChange={e => setForm(f => ({ ...f, stundensatz: e.target.value }))}
              placeholder="0.00"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.fahrzeugId || !form.vonDatum}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Buchen..." : "Einsatz buchen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Haupt-Seite ──────────────────────────────────────────────────────────────

export default function FuhrparkPage() {
  const [tab, setTab] = useState<"fahrzeuge" | "geraete" | "einsaetze">("fahrzeuge")
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([])
  const [geraete, setGeraete] = useState<Geraet[]>([])
  const [einsaetze, setEinsaetze] = useState<Maschineneinsatz[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [einsaetzeLoading, setEinsaetzeLoading] = useState(false)
  const [modal, setModal] = useState<"fahrzeug" | "geraet" | "einsatz" | null>(null)
  // Y2: Edit-State für Fahrzeuge
  const [editFahrzeug, setEditFahrzeug] = useState<Fahrzeug | null>(null)
  const heute = new Date()

  const load = useCallback(async () => {
    setLoading(true)
    const [f, g] = await Promise.all([
      fetch("/api/fuhrpark").then(r => r.json()),
      fetch("/api/geraete").then(r => r.json()),
    ])
    setFahrzeuge(f)
    setGeraete(g)
    setLoading(false)
  }, [])

  const loadEinsaetze = useCallback(async () => {
    setEinsaetzeLoading(true)
    try {
      const [e, gr, au] = await Promise.all([
        fetch("/api/maschineneinsaetze").then(r => r.json()),
        fetch("/api/gruppen").then(r => r.json()),
        fetch("/api/auftraege").then(r => r.json()),
      ])
      setEinsaetze(Array.isArray(e) ? e : [])
      setGruppen(Array.isArray(gr) ? gr : [])
      setAuftraege(Array.isArray(au) ? au : [])
    } catch {
      setEinsaetze([])
    } finally {
      setEinsaetzeLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === "einsaetze") loadEinsaetze() }, [tab, loadEinsaetze])

  const isTuvUeberfaellig = (datum: string | null | undefined) => datum && new Date(datum) < heute

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fuhrpark & Geräte</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{fahrzeuge.length} Fahrzeuge · {geraete.length} Geräte</p>
        </div>
        <button
          onClick={() => {
            if (tab === "fahrzeuge") setModal("fahrzeug")
            else if (tab === "geraete") setModal("geraet")
            else setModal("einsatz")
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          {tab === "fahrzeuge" ? "Fahrzeug" : tab === "geraete" ? "Gerät" : "Einsatz buchen"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0f0f0f] rounded-lg p-1 mb-6 w-fit">
        {(["fahrzeuge", "geraete", "einsaetze"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-500 hover:text-white"}`}>
            {t === "fahrzeuge" ? "Fahrzeuge" : t === "geraete" ? "Geräte" : "Einsätze"}
          </button>
        ))}
      </div>

      {loading && tab !== "einsaetze" ? <div className="text-center py-16 text-zinc-600">Laden...</div> : (
        <>
          {/* ─── Tab: Fahrzeuge ─────────────────────────────────────────── */}
          {tab === "fahrzeuge" && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Typ</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bezeichnung</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Kennzeichen</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">TÜV</th>
                    <th className="text-right px-4 py-3 text-zinc-500 font-medium">Zuschlag/h</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {fahrzeuge.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Keine Fahrzeuge</td></tr>
                  ) : fahrzeuge.map(f => (
                    <tr key={f.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors cursor-default">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <TypIcon typ={f.typ} />
                          <span className="uppercase text-xs">{f.typ}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{f.bezeichnung}</td>
                      <td className="px-4 py-3 text-zinc-400">{f.kennzeichen ?? "–"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[f.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {f.tuvDatum ? (
                          <span className={isTuvUeberfaellig(f.tuvDatum) ? "text-red-400" : "text-zinc-400"}>
                            {new Date(f.tuvDatum).toLocaleDateString("de-DE")}
                            {isTuvUeberfaellig(f.tuvDatum) && " ⚠️"}
                          </span>
                        ) : <span className="text-zinc-600">–</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {f.stundenBonus && f.stundenBonus > 0 ? (
                          <span className="text-emerald-400 text-xs" title={f.bonusBeschreibung ?? undefined}>
                            +{f.stundenBonus.toFixed(2)} €/h
                          </span>
                        ) : <span className="text-zinc-600">–</span>}
                      </td>
                      {/* Y2: Edit-Button */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditFahrzeug(f)}
                          className="text-zinc-500 hover:text-emerald-400 transition-colors text-xs px-2 py-1 rounded hover:bg-[#2a2a2a]"
                        >
                          Bearbeiten
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Tab: Geräte ─────────────────────────────────────────────── */}
          {tab === "geraete" && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bezeichnung</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Typ</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Nächste Wartung</th>
                  </tr>
                </thead>
                <tbody>
                  {geraete.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-zinc-600">Keine Geräte</td></tr>
                  ) : geraete.map(g => (
                    <tr key={g.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors cursor-default">
                      <td className="px-4 py-3 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-zinc-500" />
                          {g.bezeichnung}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{g.typ}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_FARBEN[g.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {g.naechsteWartung ? (
                          <span className={new Date(g.naechsteWartung) < heute ? "text-amber-400" : "text-zinc-400"}>
                            {new Date(g.naechsteWartung).toLocaleDateString("de-DE")}
                          </span>
                        ) : <span className="text-zinc-600">–</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Tab: Einsätze (K2) ──────────────────────────────────────── */}
          {tab === "einsaetze" && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fahrzeug</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Gruppe</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Auftrag</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Von</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bis</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Zweck</th>
                  </tr>
                </thead>
                <tbody>
                  {einsaetzeLoading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Laden...</td></tr>
                  ) : einsaetze.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Keine Einsätze erfasst</td></tr>
                  ) : einsaetze.map(e => (
                    <tr key={e.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        {e.fahrzeug.bezeichnung}
                        {e.fahrzeug.kennzeichen && <span className="text-zinc-500 ml-1 text-xs">({e.fahrzeug.kennzeichen})</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{e.gruppe?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-400">{e.auftrag?.titel ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(e.vonDatum).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {e.bisDatum ? new Date(e.bisDatum).toLocaleDateString("de-DE") : (
                          <span className="text-amber-400 text-xs">Laufend</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{e.zweck ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {modal === "fahrzeug" && (
        <FahrzeugModal onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
      {/* Y2: Edit-Modal */}
      {editFahrzeug && (
        <FahrzeugEditModal
          fahrzeug={editFahrzeug}
          onClose={() => setEditFahrzeug(null)}
          onSave={() => { setEditFahrzeug(null); load() }}
        />
      )}
      {modal === "geraet" && (
        <GeraetModal onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
      {modal === "einsatz" && (
        <EinsatzModal
          fahrzeuge={fahrzeuge}
          gruppen={gruppen}
          auftraege={auftraege}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadEinsaetze() }}
        />
      )}
    </div>
  )
}
