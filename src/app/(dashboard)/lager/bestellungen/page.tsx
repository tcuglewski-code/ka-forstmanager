"use client"

import { useState, useEffect } from "react"
import { Plus, ShoppingCart, Package, Truck, Check, Clock, X, FileText } from "lucide-react"
import { toast } from "sonner"

interface Lieferant {
  id: string
  name: string
  email: string | null
}

interface BestellPosition {
  id: string
  artikelId: string
  menge: number
  einzelpreis: number
  artikel: {
    id: string
    name: string
    einheit: string
  }
}

interface Bestellung {
  id: string
  lieferantId: string
  status: string
  bestelldatum: string
  gesamtbetrag: number
  notizen: string | null
  createdAt: string
  lieferant: Lieferant
  positionen: BestellPosition[]
}

interface KritischerArtikel {
  id: string
  name: string
  bestand: number
  mindestbestand: number
  einheit: string
  einkaufspreis: number | null
  lieferantId: string | null
  lieferant: Lieferant | null
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    ENTWURF: { bg: "bg-zinc-500/20", text: "text-zinc-400", icon: <FileText className="w-3 h-3" /> },
    BESTELLT: { bg: "bg-blue-500/20", text: "text-blue-400", icon: <Clock className="w-3 h-3" /> },
    GELIEFERT: { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: <Check className="w-3 h-3" /> },
  }
  const s = styles[status] || styles.ENTWURF
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${s.bg} ${s.text}`}>
      {s.icon}
      {status}
    </span>
  )
}

function NeueBestellungModal({ 
  onClose, 
  onSave,
  kritischeArtikel 
}: { 
  onClose: () => void
  onSave: () => void
  kritischeArtikel: KritischerArtikel[]
}) {
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([])
  const [selectedLieferant, setSelectedLieferant] = useState("")
  const [positionen, setPositionen] = useState<Array<{ artikelId: string; menge: number; einzelpreis: number }>>([])
  const [notizen, setNotizen] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/lager/lieferanten")
      .then(r => r.json())
      .then(data => setLieferanten(Array.isArray(data) ? data : []))
  }, [])

  // Auto-fill wenn Lieferant gewählt
  useEffect(() => {
    if (selectedLieferant) {
      const kritischeFürLieferant = kritischeArtikel.filter(
        a => a.lieferantId === selectedLieferant
      )
      setPositionen(kritischeFürLieferant.map(a => ({
        artikelId: a.id,
        menge: Math.max(a.mindestbestand * 2 - a.bestand, 1),
        einzelpreis: a.einkaufspreis ?? 0
      })))
    }
  }, [selectedLieferant, kritischeArtikel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLieferant || positionen.length === 0) {
      toast.error("Bitte Lieferant und mindestens eine Position wählen")
      return
    }

    setLoading(true)
    try {
      const gesamtbetrag = positionen.reduce((sum, p) => sum + p.menge * p.einzelpreis, 0)
      
      const res = await fetch("/api/lager/bestellungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lieferantId: selectedLieferant,
          positionen,
          gesamtbetrag,
          notizen: notizen || null
        })
      })

      if (res.ok) {
        toast.success("Bestellung erstellt")
        onSave()
      } else {
        toast.error("Fehler beim Erstellen")
      }
    } catch {
      toast.error("Fehler beim Erstellen")
    }
    setLoading(false)
  }

  const artikelFürLieferant = kritischeArtikel.filter(
    a => a.lieferantId === selectedLieferant
  )

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#C5A55A]" />
            Neue Bestellung
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-zinc-500 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Lieferant</label>
            <select
              value={selectedLieferant}
              onChange={e => setSelectedLieferant(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C5A55A]"
            >
              <option value="">Lieferant wählen...</option>
              {lieferanten.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {selectedLieferant && artikelFürLieferant.length === 0 && (
            <div className="text-center py-4 text-zinc-500 text-sm">
              Keine kritischen Artikel bei diesem Lieferanten
            </div>
          )}

          {positionen.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs text-zinc-400">Positionen (aus kritischen Beständen)</label>
              {positionen.map((pos, idx) => {
                const artikel = kritischeArtikel.find(a => a.id === pos.artikelId)
                return (
                  <div key={idx} className="flex items-center gap-3 bg-[#1e1e1e] rounded-lg p-3">
                    <div className="flex-1">
                      <span className="text-white">{artikel?.name}</span>
                      <span className="text-zinc-500 text-xs ml-2">
                        (Bestand: {artikel?.bestand}/{artikel?.mindestbestand})
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={pos.menge}
                      onChange={e => {
                        const updated = [...positionen]
                        updated[idx].menge = parseInt(e.target.value) || 1
                        setPositionen(updated)
                      }}
                      className="w-20 bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-sm text-white text-right"
                    />
                    <span className="text-zinc-500 text-xs">{artikel?.einheit}</span>
                    <span className="text-white text-sm">
                      {(pos.menge * pos.einzelpreis).toFixed(2)} €
                    </span>
                  </div>
                )
              })}
              <div className="text-right pt-2 border-t border-[#2a2a2a]">
                <span className="text-zinc-400 text-sm">Gesamt: </span>
                <span className="text-[#C5A55A] font-bold">
                  {positionen.reduce((sum, p) => sum + p.menge * p.einzelpreis, 0).toFixed(2)} €
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
            <textarea
              value={notizen}
              onChange={e => setNotizen(e.target.value)}
              rows={2}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C5A55A]"
              placeholder="Optionale Notizen..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !selectedLieferant || positionen.length === 0}
              className="flex-1 px-4 py-2 rounded-lg bg-[#C5A55A] hover:bg-[#D4B56A] text-[#2C3A1C] text-sm font-medium disabled:opacity-50 transition-all"
            >
              {loading ? "Erstellen..." : "Bestellung erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BestellungenPage() {
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([])
  const [kritischeArtikel, setKritischeArtikel] = useState<KritischerArtikel[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<string>("alle")

  const load = async () => {
    setLoading(true)
    try {
      const [bestellRes, artikelRes] = await Promise.all([
        fetch("/api/lager/bestellungen"),
        fetch("/api/lager")
      ])
      const bestellData = await bestellRes.json()
      const artikelData = await artikelRes.json()
      
      setBestellungen(Array.isArray(bestellData) ? bestellData : [])
      
      // Filter kritische Artikel
      const artikelArray = Array.isArray(artikelData) ? artikelData : []
      setKritischeArtikel(artikelArray.filter((a: KritischerArtikel) => a.bestand <= a.mindestbestand))
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/lager/bestellungen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Status auf ${status} geändert`)
        load()
      }
    } catch {
      toast.error("Fehler beim Aktualisieren")
    }
  }

  const filteredBestellungen = bestellungen.filter(b => {
    if (filter === "alle") return true
    return b.status === filter
  })

  const stats = {
    entwurf: bestellungen.filter(b => b.status === "ENTWURF").length,
    bestellt: bestellungen.filter(b => b.status === "BESTELLT").length,
    geliefert: bestellungen.filter(b => b.status === "GELIEFERT").length,
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bestellungen</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {bestellungen.length} Bestellungen • {kritischeArtikel.length} kritische Artikel
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A55A] hover:bg-[#D4B56A] text-[#2C3A1C] rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Neue Bestellung
        </button>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter(filter === "ENTWURF" ? "alle" : "ENTWURF")}
          className={`bg-[#161616] border rounded-xl p-4 text-center transition-all ${filter === "ENTWURF" ? "border-[#C5A55A]" : "border-[#2a2a2a] hover:border-zinc-600"}`}
        >
          <p className="text-2xl font-bold text-zinc-400">{stats.entwurf}</p>
          <p className="text-xs text-zinc-500">Entwürfe</p>
        </button>
        <button
          onClick={() => setFilter(filter === "BESTELLT" ? "alle" : "BESTELLT")}
          className={`bg-[#161616] border rounded-xl p-4 text-center transition-all ${filter === "BESTELLT" ? "border-[#C5A55A]" : "border-[#2a2a2a] hover:border-zinc-600"}`}
        >
          <p className="text-2xl font-bold text-blue-400">{stats.bestellt}</p>
          <p className="text-xs text-zinc-500">Bestellt</p>
        </button>
        <button
          onClick={() => setFilter(filter === "GELIEFERT" ? "alle" : "GELIEFERT")}
          className={`bg-[#161616] border rounded-xl p-4 text-center transition-all ${filter === "GELIEFERT" ? "border-[#C5A55A]" : "border-[#2a2a2a] hover:border-zinc-600"}`}
        >
          <p className="text-2xl font-bold text-emerald-400">{stats.geliefert}</p>
          <p className="text-xs text-zinc-500">Geliefert</p>
        </button>
      </div>

      {/* Bestellungs-Liste */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Laden...</div>
        ) : filteredBestellungen.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Keine Bestellungen vorhanden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Datum</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Lieferant</th>
                <th className="text-center px-5 py-3 text-zinc-500 font-medium">Status</th>
                <th className="text-center px-5 py-3 text-zinc-500 font-medium">Positionen</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Betrag</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBestellungen.map(b => (
                <tr key={b.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                  <td className="px-5 py-4 text-white">
                    {new Date(b.bestelldatum).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-5 py-4">
                    <a href={`/lager/lieferanten/${b.lieferantId}`} className="text-white hover:text-emerald-400">
                      {b.lieferant.name}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-4 text-center text-zinc-400">
                    {b.positionen.length} Artikel
                  </td>
                  <td className="px-5 py-4 text-right text-[#C5A55A] font-medium">
                    {Number(b.gesamtbetrag).toFixed(2)} €
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {b.status === "ENTWURF" && (
                        <button
                          onClick={() => updateStatus(b.id, "BESTELLT")}
                          className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        >
                          → Bestellt
                        </button>
                      )}
                      {b.status === "BESTELLT" && (
                        <button
                          onClick={() => updateStatus(b.id, "GELIEFERT")}
                          className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        >
                          → Geliefert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <NeueBestellungModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load() }}
          kritischeArtikel={kritischeArtikel}
        />
      )}
    </div>
  )
}
