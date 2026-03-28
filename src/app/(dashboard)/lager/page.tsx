"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, X, QrCode, Printer, Package } from "lucide-react"
import QRCode from "react-qr-code"
import { toast } from "sonner"

const BASE_URL = "https://ka-forstmanager.vercel.app"

interface LagerArtikel {
  id: string
  name: string
  kategorie: string
  einheit: string
  bestand: number
  mindestbestand: number
  lagerort?: string | null
  artikelnummer?: string | null
  // Sprint FS: EK/VK Preise
  einkaufspreis?: number | null
  verkaufspreis?: number | null
}

interface AuftragOption { id: string; titel: string }
interface MitarbeiterOption { id: string; vorname: string; nachname: string }

interface LagerBewegung {
  id: string
  typ: string
  menge: number
  notiz?: string | null
  createdAt: string
  auftrag?: { id: string; titel: string } | null
  mitarbeiter?: { id: string; vorname: string; nachname: string } | null
}

function Ampel({ bestand, mindestbestand }: { bestand: number; mindestbestand: number }) {
  if (bestand < mindestbestand) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title="Unterbestand" />
  if (bestand < mindestbestand * 2) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" title="Niedrig" />
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="OK" />
}

function QrPrintModal({ artikel, onClose }: { artikel: LagerArtikel; onClose: () => void }) {
  const qrValue = `${BASE_URL}/lager?item=${artikel.id}`
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return
    const w = window.open("", "_blank", "width=400,height=500")
    if (!w) return
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code – ${artikel.name}</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; }
          .box { border: 2px solid #333; border-radius: 12px; padding: 32px; text-align: center; max-width: 320px; }
          h2 { margin: 16px 0 4px; font-size: 20px; }
          p { margin: 4px 0; color: #555; font-size: 13px; }
          svg { display: block; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="box">
          ${printContent.innerHTML}
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `)
    w.document.close()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            QR Code
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Print content (hidden wrapper for HTML extraction) */}
          <div ref={printRef} className="hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              {/* placeholder — actual QR rendered below */}
            </svg>
            <h2>{artikel.name}</h2>
            <p>ID: {artikel.id}</p>
            <p style={{ fontSize: "11px", wordBreak: "break-all" }}>{qrValue}</p>
          </div>

          {/* Actual QR code display */}
          <div className="bg-white p-4 rounded-xl">
            <QRCode value={qrValue} size={180} />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">{artikel.name}</p>
            {artikel.artikelnummer && (
              <p className="text-zinc-500 text-xs mt-1">Art.-Nr.: {artikel.artikelnummer}</p>
            )}
            <p className="text-zinc-600 text-xs mt-1 break-all">{qrValue}</p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Printer className="w-4 h-4" />
            QR Code drucken
          </button>
        </div>
      </div>
    </div>
  )
}

function ArtikelModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  // Sprint FS: EK/VK Preise hinzugefügt
  const [form, setForm] = useState({ name: "", kategorie: "material", einheit: "Stück", bestand: "0", mindestbestand: "0", lagerort: "", artikelnummer: "", einkaufspreis: "", verkaufspreis: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/lager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      toast.success("Artikel angelegt")
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
          <h2 className="text-lg font-semibold text-white">Neuer Artikel</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {([["Name *", "name", "text", "z.B. Schutzhelm, Säge, Herbizid..."], ["Lagerort", "lagerort", "text", "z.B. Halle A, Regal 3"], ["Artikelnummer", "artikelnummer", "text", "z.B. ART-001"]] as [string, string, string, string][]).map(([label, key, type, placeholder]) => (
            <div key={key}>
              <label className="block text-xs text-zinc-400 mb-1">{label}</label>
              <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Kategorie</label>
              <select value={form.kategorie} onChange={e => setForm(f => ({ ...f, kategorie: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                {["material", "werkzeug", "pflanzgut", "schutz", "chemie", "sonstiges"].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Einheit</label>
              <select value={form.einheit} onChange={e => setForm(f => ({ ...f, einheit: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="" disabled>Einheit wählen</option>
                {["Stück", "kg", "g", "l", "ml", "m", "m²", "m³", "Paar", "Packung", "Karton", "Rolle"].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Bestand</label>
              <input type="number" value={form.bestand} onChange={e => setForm(f => ({ ...f, bestand: e.target.value }))}
                placeholder="0"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mindestbestand</label>
              <input type="number" value={form.mindestbestand} onChange={e => setForm(f => ({ ...f, mindestbestand: e.target.value }))}
                placeholder="5"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          {/* Sprint FS: Einkaufs- und Verkaufspreise */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Einkaufspreis (€)</label>
              <input type="number" step="0.01" min="0" value={form.einkaufspreis} onChange={e => setForm(f => ({ ...f, einkaufspreis: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Verkaufspreis (€)</label>
              <input type="number" step="0.01" min="0" value={form.verkaufspreis} onChange={e => setForm(f => ({ ...f, verkaufspreis: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading || !form.name} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BuchungModal({ artikel, onClose, onSave }: { artikel: LagerArtikel; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ typ: "ausgang", menge: "1", notiz: "", auftragId: "", mitarbeiterId: "" })
  const [auftraege, setAuftraege] = useState<AuftragOption[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<MitarbeiterOption[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/auftraege?limit=50").then(r => r.json()).catch(() => ({ auftraege: [] })),
      fetch("/api/mitarbeiter").then(r => r.json()).catch(() => []),
    ]).then(([auftragData, maData]) => {
      setAuftraege(Array.isArray(auftragData) ? auftragData : (auftragData.auftraege ?? []))
      setMitarbeiter(Array.isArray(maData) ? maData : (maData.mitarbeiter ?? []))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`/api/lager/${artikel.id}/bewegung`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          auftragId: form.auftragId || null,
          mitarbeiterId: form.mitarbeiterId || null,
        }),
      })
      toast.success("Bestand aktualisiert")
    } catch {
      toast.error("Fehler beim Speichern")
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Buchung: {artikel.name}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Typ</label>
            <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="ausgang">Ausgabe (-)</option>
              <option value="reserve">Reserve (−, mit Rückgabe)</option>
              <option value="rueckgabe">Rückgabe (+)</option>
              <option value="eingang">Eingang/Nachbestellung (+)</option>
              <option value="korrektur">Korrektur/Inventur (+)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Menge ({artikel.einheit})</label>
            <input type="number" min="0.01" step="0.01" value={form.menge} onChange={e => setForm(f => ({ ...f, menge: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notiz</label>
            <input type="text" value={form.notiz} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Auftrag <span className="text-zinc-600">(optional)</span></label>
            <select value={form.auftragId} onChange={e => setForm(f => ({ ...f, auftragId: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">Kein Auftrag</option>
              {auftraege.map(a => <option key={a.id} value={a.id}>{a.titel}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Mitarbeiter <span className="text-zinc-600">(optional)</span></label>
            <select value={form.mitarbeiterId} onChange={e => setForm(f => ({ ...f, mitarbeiterId: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">Kein Mitarbeiter</option>
              {mitarbeiter.map(m => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white transition-all">Abbrechen</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {loading ? "Buchen..." : "Buchen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ArtikelDetailModal({ artikel, onClose }: { artikel: LagerArtikel; onClose: () => void }) {
  const [bewegungen, setBewegungen] = useState<LagerBewegung[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/lager/${artikel.id}/bewegung`)
      .then(r => r.json())
      .then(data => { setBewegungen(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [artikel.id])

  const typColor: Record<string, string> = {
    eingang: "text-emerald-400",
    ausgang: "text-red-400",
    korrektur: "text-amber-400",
    zuweisung: "text-blue-400",
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a] shrink-0">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">{artikel.name}</h2>
              <p className="text-xs text-zinc-500">Bestand: {artikel.bestand} {artikel.einheit} · {artikel.lagerort ?? "Kein Lagerort"}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Bewegungshistorie</h3>
          {loading ? (
            <div className="text-center py-8 text-zinc-600 text-sm">Laden...</div>
          ) : bewegungen.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-sm">Keine Buchungen vorhanden</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left pb-2 text-zinc-500 font-medium text-xs">Datum</th>
                    <th className="text-left pb-2 text-zinc-500 font-medium text-xs">Typ</th>
                    <th className="text-right pb-2 text-zinc-500 font-medium text-xs">Menge</th>
                    <th className="text-left pb-2 text-zinc-500 font-medium text-xs pl-3">Notiz</th>
                    <th className="text-left pb-2 text-zinc-500 font-medium text-xs pl-3">Zuweisung</th>
                  </tr>
                </thead>
                <tbody>
                  {bewegungen.map(b => (
                    <tr key={b.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                      <td className="py-2.5 text-zinc-500 text-xs whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium ${typColor[b.typ] ?? "text-zinc-400"}`}>{b.typ}</span>
                      </td>
                      <td className="py-2.5 text-right text-white text-xs">
                        {b.typ === "ausgang" ? "-" : b.typ === "eingang" ? "+" : ""}{b.menge} {artikel.einheit}
                      </td>
                      <td className="py-2.5 pl-3 text-zinc-500 text-xs">{b.notiz ?? "–"}</td>
                      <td className="py-2.5 pl-3">
                        <div className="flex flex-wrap gap-1">
                          {b.auftrag && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                              {b.auftrag.titel}
                            </span>
                          )}
                          {b.mitarbeiter && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-violet-500/20 text-violet-400">
                              {b.mitarbeiter.vorname} {b.mitarbeiter.nachname}
                            </span>
                          )}
                          {!b.auftrag && !b.mitarbeiter && <span className="text-zinc-600 text-xs">–</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrapper to use useSearchParams safely with Suspense boundary
import { Suspense } from "react"

function LagerPageInner() {
  const searchParams = useSearchParams()
  const itemIdFromUrl = searchParams.get("item")

  const [artikel, setArtikel] = useState<LagerArtikel[]>([])
  const [loading, setLoading] = useState(true)
  const [showArtikelModal, setShowArtikelModal] = useState(false)
  const [buchungArtikel, setBuchungArtikel] = useState<LagerArtikel | null>(null)
  const [qrArtikel, setQrArtikel] = useState<LagerArtikel | null>(null)
  const [detailArtikel, setDetailArtikel] = useState<LagerArtikel | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const highlightRef = useRef<HTMLTableRowElement>(null)

  // Y1: Bulk-Auswahl und Filter-States
  const [selected, setSelected] = useState<string[]>([])
  const [filterKategorie, setFilterKategorie] = useState("")
  const [filterLagerort, setFilterLagerort] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/lager")
    const data: LagerArtikel[] = await res.json()
    setArtikel(data)
    setLoading(false)
    return data
  }, [])

  useEffect(() => {
    load().then((data) => {
      // ?item=<id> via QR-Code öffnen
      if (itemIdFromUrl) {
        setHighlightedId(itemIdFromUrl)
        const found = data.find(a => a.id === itemIdFromUrl)
        if (found) {
          setBuchungArtikel(found)
        }
        setTimeout(() => {
          highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 300)
      }
    })
  }, [load, itemIdFromUrl])

  // Y1: Gefilterte Liste
  const filteredArtikel = artikel.filter(a => {
    if (filterKategorie && a.kategorie !== filterKategorie) return false
    if (filterLagerort && !(a.lagerort?.toLowerCase().includes(filterLagerort.toLowerCase()))) return false
    return true
  })

  const unterMindest = artikel.filter(a => a.bestand < a.mindestbestand).length

  // Y1: Alle eindeutigen Kategorien für Dropdown
  const kategorien = Array.from(new Set(artikel.map(a => a.kategorie))).sort()

  // Y1: Bulk-Löschen
  const handleBulkDelete = async () => {
    if (!confirm(`${selected.length} Artikel wirklich löschen?`)) return
    const count = selected.length
    let errors = 0
    for (const id of selected) {
      const res = await fetch(`/api/lager/${id}`, { method: "DELETE" })
      if (!res.ok) errors++
    }
    setSelected([])
    await load()
    if (errors > 0) {
      toast.error(`${errors} von ${count} Artikeln konnten nicht gelöscht werden`)
    } else {
      toast.success(`${count} Artikel gelöscht`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Lager</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {artikel.length} Artikel
            {unterMindest > 0 && <span className="ml-2 text-red-400">• {unterMindest} unter Mindestbestand</span>}
          </p>
        </div>
        <button
          onClick={() => setShowArtikelModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Artikel
        </button>
      </div>

      {/* Y1: Filter-Bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterKategorie}
          onChange={e => setFilterKategorie(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Alle Kategorien</option>
          {kategorien.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Lagerort filtern..."
          value={filterLagerort}
          onChange={e => setFilterLagerort(e.target.value)}
          className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-48"
        />
        {(filterKategorie || filterLagerort) && (
          <button
            onClick={() => { setFilterKategorie(""); setFilterLagerort("") }}
            className="text-xs text-zinc-500 hover:text-white px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Y1: Bulk-Aktionsleiste */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <span className="text-red-400 text-sm font-medium">
            {selected.length} Artikel ausgewählt
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Löschen
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-xs text-zinc-500 hover:text-white ml-auto"
          >
            Auswahl aufheben
          </button>
        </div>
      )}

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {/* Y1: Header-Checkbox */}
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.length === filteredArtikel.length && filteredArtikel.length > 0}
                  onChange={e => setSelected(e.target.checked ? filteredArtikel.map(a => a.id) : [])}
                  className="rounded border-zinc-600"
                />
              </th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium w-6"></th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Kategorie</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">Bestand</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">Mindest</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Lagerort</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-zinc-600">Laden...</td></tr>
            ) : filteredArtikel.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-zinc-600">
                {artikel.length === 0 ? "Keine Artikel vorhanden" : "Keine Artikel gefunden"}
              </td></tr>
            ) : (
              filteredArtikel.map(a => {
                const isHighlighted = a.id === highlightedId
                return (
                  <tr
                    key={a.id}
                    ref={isHighlighted ? highlightRef : undefined}
                    className={`border-b border-[#1e1e1e] transition-colors ${
                      isHighlighted
                        ? "bg-emerald-900/30 border-l-2 border-l-emerald-500"
                        : "hover:bg-[#1c1c1c]"
                    }`}
                  >
                    {/* Y1: Zeilen-Checkbox */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(a.id)}
                        onChange={e => setSelected(prev =>
                          e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id)
                        )}
                        className="rounded border-zinc-600"
                      />
                    </td>
                    <td className="px-4 py-3"><Ampel bestand={a.bestand} mindestbestand={a.mindestbestand} /></td>
                    <td className="px-4 py-3 font-medium">
                      <button
                        onClick={() => setDetailArtikel(a)}
                        className="text-white hover:text-emerald-400 transition-colors text-left"
                      >
                        {a.name}
                      </button>
                      {isHighlighted && (
                        <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          ↑ gescannt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-[#2a2a2a] text-zinc-400">{a.kategorie}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">{a.bestand} {a.einheit}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{a.mindestbestand} {a.einheit}</td>
                    <td className="px-4 py-3 text-zinc-500">{a.lagerort ?? "–"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setQrArtikel(a)}
                          title="QR Code anzeigen"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-[#2a2a2a] transition-all"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBuchungArtikel(a)}
                          className="px-3 py-1 rounded-lg text-xs bg-[#1e1e1e] text-zinc-400 hover:text-white hover:bg-[#2a2a2a] transition-all"
                        >
                          Buchen
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showArtikelModal && (
        <ArtikelModal onClose={() => setShowArtikelModal(false)} onSave={() => { setShowArtikelModal(false); load() }} />
      )}
      {buchungArtikel && (
        <BuchungModal artikel={buchungArtikel} onClose={() => setBuchungArtikel(null)} onSave={() => { setBuchungArtikel(null); load() }} />
      )}
      {qrArtikel && (
        <QrPrintModal artikel={qrArtikel} onClose={() => setQrArtikel(null)} />
      )}
      {detailArtikel && (
        <ArtikelDetailModal artikel={detailArtikel} onClose={() => setDetailArtikel(null)} />
      )}
    </div>
  )
}

export default function LagerPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-zinc-600">Laden...</div>}>
      <LagerPageInner />
    </Suspense>
  )
}
