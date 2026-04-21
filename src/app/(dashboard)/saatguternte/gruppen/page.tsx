// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Plus, Users, User, TreePine, X, Loader2, CheckSquare, Square } from "lucide-react"

export default function GruppenPage() {
  const [gruppen, setGruppen] = useState([])
  const [saisons, setSaisons] = useState([])
  const [personen, setPersonen] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSaison, setFilterSaison] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedGruppe, setExpandedGruppe] = useState(null)

  const [form, setForm] = useState({
    saisonId: "",
    name: "",
    gruppenfuehrerName: "",
    stundenlohnGF: "17.0",
    notizen: "",
    mitglieder: [] as string[],
  })

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterSaison) params.set("saisonId", filterSaison)

    const [gRes, sRes, pRes] = await Promise.all([
      fetch(`/api/saatguternte/gruppen?${params}`),
      fetch("/api/saatguternte/saisons"),
      fetch("/api/saatguternte/personen"),
    ])
    if (gRes.ok) setGruppen(await gRes.json())
    if (sRes.ok) setSaisons(await sRes.json())
    if (pRes.ok) setPersonen(await pRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [filterSaison])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/saatguternte/gruppen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      setForm({ saisonId: "", name: "", gruppenfuehrerName: "", stundenlohnGF: "17.0", notizen: "", mitglieder: [] })
      load()
    }
    setSaving(false)
  }

  function toggleMitglied(personId: string) {
    setForm((prev) => ({
      ...prev,
      mitglieder: prev.mitglieder.includes(personId)
        ? prev.mitglieder.filter((id) => id !== personId)
        : [...prev.mitglieder, personId],
    }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Erntegruppen</h1>
          <p className="text-sm text-zinc-400 mt-1">Sammler-Teams · Gruppenführer · Saisonplanung</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Neue Gruppe
        </button>
      </div>

      {/* Saison-Filter */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setFilterSaison("")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${!filterSaison ? "bg-emerald-700 text-white" : "bg-[#1e1e1e] text-zinc-400 hover:text-white"}`}
        >
          Alle
        </button>
        {saisons.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterSaison(s.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filterSaison === s.id ? "bg-emerald-700 text-white" : "bg-[#1e1e1e] text-zinc-400 hover:text-white"}`}
          >
            {s.jahr}
          </button>
        ))}
      </div>

      {/* Gruppen-Karten */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : gruppen.length === 0 ? (
        <div className="text-center py-16">
          <TreePine className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">Keine Gruppen gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gruppen.map((gruppe) => (
            <div key={gruppe.id} className="bg-[#161616] border border-border rounded-2xl overflow-hidden">
              {/* Karten-Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center flex-shrink-0">
                    <TreePine className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{gruppe.name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      Saison {gruppe.saison?.jahr ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Karten-Body */}
              <div className="p-5 space-y-3">
                {gruppe.gruppenfuehrerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span className="text-zinc-400">Gruppenführer:</span>
                    <span className="text-white font-medium">{gruppe.gruppenfuehrerName}</span>
                  </div>
                )}

                {gruppe.stundenlohnGF && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-400">GF Stundenlohn:</span>
                    <span className="text-white">{gruppe.stundenlohnGF.toFixed(2)} €/h</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-zinc-400">Mitglieder:</span>
                  <span className="text-white font-medium">{gruppe._count?.mitglieder ?? 0}</span>
                </div>

                {/* Mitglieder-Liste Toggle */}
                <button
                  onClick={() => setExpandedGruppe(expandedGruppe === gruppe.id ? null : gruppe.id)}
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition"
                >
                  {expandedGruppe === gruppe.id ? "▲ Verstecken" : "▼ Sammler anzeigen"}
                </button>

                {expandedGruppe === gruppe.id && (
                  <div className="space-y-1.5 pt-1">
                    {gruppe.mitglieder?.length > 0 ? (
                      gruppe.mitglieder.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span>{m.person?.name ?? "—"}</span>
                          {m.person?.nationalitaet && (
                            <span className="text-zinc-500">({m.person.nationalitaet})</span>
                          )}
                          <span className="ml-auto text-zinc-600 capitalize">{m.rolle}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600">Keine Mitglieder</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Neue Gruppe */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161616] border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-white">Neue Erntegruppe</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Saison *</label>
                <select
                  required
                  value={form.saisonId}
                  onChange={(e) => setForm({ ...form, saisonId: e.target.value })}
                  className="w-full bg-[#1e1e1e] border border-border text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Saison wählen…</option>
                  {saisons.map((s) => (
                    <option key={s.id} value={s.id}>{s.jahr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Gruppenname *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="z.B. Gruppe Rumänien 2025"
                  className="w-full bg-[#1e1e1e] border border-border text-white text-sm rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Gruppenführer</label>
                  <input
                    type="text"
                    value={form.gruppenfuehrerName}
                    onChange={(e) => setForm({ ...form, gruppenfuehrerName: e.target.value })}
                    placeholder="Name"
                    className="w-full bg-[#1e1e1e] border border-border text-white text-sm rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">GF Stundenlohn (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.stundenlohnGF}
                    onChange={(e) => setForm({ ...form, stundenlohnGF: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-border text-white text-sm rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Mitglieder-Auswahl */}
              {personen.length > 0 && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">
                    Mitglieder ({form.mitglieder.length} ausgewählt)
                  </label>
                  <div className="bg-[#1e1e1e] border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
                    {personen.map((p) => {
                      const selected = form.mitglieder.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleMitglied(p.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#252525] transition text-left"
                        >
                          {selected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                          )}
                          <span className={selected ? "text-white" : "text-zinc-400"}>{p.name}</span>
                          {p.nationalitaet && (
                            <span className="text-zinc-600 text-xs ml-auto">{p.nationalitaet}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
                <textarea
                  value={form.notizen}
                  onChange={(e) => setForm({ ...form, notizen: e.target.value })}
                  rows={2}
                  className="w-full bg-[#1e1e1e] border border-border text-white text-sm rounded-lg px-3 py-2 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border text-zinc-400 hover:text-white rounded-lg text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Gruppe erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
