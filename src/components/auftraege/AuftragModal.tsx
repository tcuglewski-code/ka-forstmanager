"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface Saison {
  id: string
  name: string
}
interface Gruppe {
  id: string
  name: string
}
interface Auftrag {
  id?: string
  titel?: string
  typ?: string
  status?: string
  beschreibung?: string
  flaeche_ha?: number | null
  standort?: string
  bundesland?: string
  waldbesitzer?: string | null
  waldbesitzerEmail?: string | null
  saisonId?: string | null
  gruppeId?: string | null
  startDatum?: string | null
  endDatum?: string | null
}

const TYPEN = [
  { value: "pflanzung", label: "Pflanzung" },
  { value: "zaunbau", label: "Zaunbau" },
  { value: "kulturschutz", label: "Kulturschutz" },
  { value: "kulturpflege", label: "Kulturpflege" },
  { value: "flaechenvorbereitung", label: "Flächenvorbereitung" },
  { value: "saatguternte", label: "Saatguternte" },
  { value: "pflanzenbeschaffung", label: "Pflanzenbeschaffung" },
]

const STATUS_LIST = [
  { value: "anfrage", label: "Anfrage" },
  { value: "geprueft", label: "Geprüft" },
  { value: "angebot", label: "Angebot" },
  { value: "bestaetigt", label: "Bestätigt" },
  { value: "in_ausfuehrung", label: "In Ausführung" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
]

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
]

export function AuftragModal({
  auftrag,
  onClose,
  onSave,
}: {
  auftrag?: Auftrag | null
  onClose: () => void
  onSave: () => void
}) {
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    titel: auftrag?.titel ?? "",
    typ: auftrag?.typ ?? "pflanzung",
    status: auftrag?.status ?? "anfrage",
    beschreibung: auftrag?.beschreibung ?? "",
    flaeche_ha: auftrag?.flaeche_ha?.toString() ?? "",
    standort: auftrag?.standort ?? "",
    bundesland: auftrag?.bundesland ?? "",
    waldbesitzer: auftrag?.waldbesitzer ?? "",
    waldbesitzerEmail: auftrag?.waldbesitzerEmail ?? "",
    saisonId: auftrag?.saisonId ?? "",
    gruppeId: auftrag?.gruppeId ?? "",
    startDatum: auftrag?.startDatum?.substring(0, 10) ?? "",
    endDatum: auftrag?.endDatum?.substring(0, 10) ?? "",
  })

  useEffect(() => {
    fetch("/api/saisons").then(r => r.json()).then(setSaisons)
    fetch("/api/gruppen").then(r => r.json()).then(setGruppen)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      flaeche_ha: form.flaeche_ha || null,
      saisonId: form.saisonId || null,
      gruppeId: form.gruppeId || null,
      startDatum: form.startDatum || null,
      endDatum: form.endDatum || null,
    }
    const url = auftrag?.id ? `/api/auftraege/${auftrag.id}` : "/api/auftraege"
    const method = auftrag?.id ? "PATCH" : "POST"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setLoading(false)
    onSave()
  }

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
      />
    </div>
  )

  const select = (label: string, key: keyof typeof form, options: { value: string; label: string }[], allowEmpty = false) => (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <select
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
      >
        {allowEmpty && <option value="">— keine —</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a] shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {auftrag?.id ? "Auftrag bearbeiten" : "Neuer Auftrag"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {field("Titel *", "titel", "text", "z.B. Frühjahrsaufforstung Revier Nord")}
            <div className="grid grid-cols-2 gap-4">
              {select("Typ *", "typ", TYPEN)}
              {select("Status", "status", STATUS_LIST)}
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Beschreibung</label>
              <textarea
                value={form.beschreibung}
                onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                rows={3}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Beschreibung der Maßnahme..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field("Fläche (ha)", "flaeche_ha", "number", "0.00")}
              {field("Standort", "standort", "text", "z.B. Revier Nord, Abt. 5")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Bundesland</label>
                <select
                  value={form.bundesland}
                  onChange={e => setForm(f => ({ ...f, bundesland: e.target.value }))}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">— wählen —</option>
                  {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {field("Waldbesitzer", "waldbesitzer", "text", "Name")}
            </div>
            {field("E-Mail Waldbesitzer", "waldbesitzerEmail", "email", "waldbesitzer@example.de")}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Saison</label>
                <select
                  value={form.saisonId}
                  onChange={e => setForm(f => ({ ...f, saisonId: e.target.value }))}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">— keine —</option>
                  {saisons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Gruppe</label>
                <select
                  value={form.gruppeId}
                  onChange={e => setForm(f => ({ ...f, gruppeId: e.target.value }))}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">— keine —</option>
                  {gruppen.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field("Startdatum", "startDatum", "date")}
              {field("Enddatum", "endDatum", "date")}
            </div>
          </div>

          <div className="shrink-0 flex gap-3 p-6 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.titel || !form.typ}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
