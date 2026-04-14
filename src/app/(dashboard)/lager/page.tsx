"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, X, QrCode, Printer, Package, ShoppingCart, Truck, Users, Search, Filter, ChevronDown, Pencil } from "lucide-react"
import QRCode from "react-qr-code"
import { toast } from "sonner"
import { BestandsAmpel } from "@/components/lager/BestandsAmpel"

const BASE_URL = "https://ka-forstmanager.vercel.app"

// Brand Colors
const WALDGRUEN = "#2C3A1C"
const GOLD = "#C5A55A"

interface LagerArtikel {
  id: string
  name: string
  kategorie: string
  einheit: string
  bestand: number
  mindestbestand: number
  lagerort?: string | null
  artikelnummer?: string | null
  einkaufspreis?: number | null
  verkaufspreis?: number | null
  lieferant?: { id: string; name: string } | null
}

interface Reservierung {
  id: string
  menge: number
  status: string
  auftragId: string
  artikel: { id: string; name: string; einheit: string }
}

interface Bestellung {
  id: string
  status: string
  bestelldatum: string
  gesamtbetrag: number
  lieferant: { id: string; name: string }
  positionen: Array<{ id: string }>
}

interface Lieferant {
  id: string
  name: string
  email: string | null
  telefon: string | null
  aktiv: boolean
  _count?: { artikel: number }
}

// Tab Types
type TabType = "artikel" | "reservierungen" | "bestellungen" | "lieferanten"

// ============== MODALS ==============
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
          <button onClick={onClose} className="p-2 -m-2 touch-target"><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div ref={printRef} className="hidden">
            <h2>{artikel.name}</h2>
            <p>ID: {artikel.id}</p>
            <p style={{ fontSize: "11px", wordBreak: "break-all" }}>{qrValue}</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <QRCode value={qrValue} size={180} />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">{artikel.name}</p>
            {artikel.artikelnummer && (
              <p className="text-zinc-500 text-xs mt-1">Art.-Nr.: {artikel.artikelnummer}</p>
            )}
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 w-full justify-center px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: GOLD }}
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
          <button onClick={onClose} className="p-2 -m-2 touch-target"><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="z.B. Schutzhelm, Säge..."
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
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
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mindestbestand</label>
              <input type="number" value={form.mindestbestand} onChange={e => setForm(f => ({ ...f, mindestbestand: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Einkaufspreis (€)</label>
              <input type="number" step="0.01" value={form.einkaufspreis} onChange={e => setForm(f => ({ ...f, einkaufspreis: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Verkaufspreis (€)</label>
              <input type="number" step="0.01" value={form.verkaufspreis} onChange={e => setForm(f => ({ ...f, verkaufspreis: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white">Abbrechen</button>
            <button type="submit" disabled={loading || !form.name} 
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
              style={{ backgroundColor: GOLD, color: WALDGRUEN }}>
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
  const [form, setForm] = useState({ typ: "ausgang", menge: "1", notiz: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`/api/lager/${artikel.id}/bewegung`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          <button onClick={onClose} className="p-2 -m-2 touch-target"><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Typ</label>
            <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="ausgang">Ausgabe (-)</option>
              <option value="eingang">Eingang (+)</option>
              <option value="korrektur">Korrektur</option>
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white">Abbrechen</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: GOLD, color: WALDGRUEN }}>
              {loading ? "Buchen..." : "Buchen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditArtikelModal({ artikel, onClose, onSave }: { artikel: LagerArtikel; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: artikel.name,
    kategorie: artikel.kategorie,
    einheit: artikel.einheit,
    mindestbestand: String(artikel.mindestbestand),
    lagerort: artikel.lagerort ?? "",
    artikelnummer: artikel.artikelnummer ?? "",
    einkaufspreis: artikel.einkaufspreis != null ? String(artikel.einkaufspreis) : "",
    verkaufspreis: artikel.verkaufspreis != null ? String(artikel.verkaufspreis) : "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/lager/${artikel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          kategorie: form.kategorie,
          einheit: form.einheit,
          mindestbestand: form.mindestbestand,
          lagerort: form.lagerort || null,
          artikelnummer: form.artikelnummer || null,
          einkaufspreis: form.einkaufspreis ? parseFloat(form.einkaufspreis) : null,
          verkaufspreis: form.verkaufspreis ? parseFloat(form.verkaufspreis) : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Artikel aktualisiert")
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
          <h2 className="text-lg font-semibold text-white">Artikel bearbeiten</h2>
          <button onClick={onClose} className="p-2 -m-2 touch-target"><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
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
                {["Stück", "kg", "g", "l", "ml", "m", "m²", "m³", "Paar", "Packung", "Karton", "Rolle"].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mindestbestand</label>
              <input type="number" value={form.mindestbestand} onChange={e => setForm(f => ({ ...f, mindestbestand: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Lagerort</label>
              <input type="text" value={form.lagerort} onChange={e => setForm(f => ({ ...f, lagerort: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Einkaufspreis (€)</label>
              <input type="number" step="0.01" value={form.einkaufspreis} onChange={e => setForm(f => ({ ...f, einkaufspreis: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Verkaufspreis (€)</label>
              <input type="number" step="0.01" value={form.verkaufspreis} onChange={e => setForm(f => ({ ...f, verkaufspreis: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Artikelnummer</label>
            <input type="text" value={form.artikelnummer} onChange={e => setForm(f => ({ ...f, artikelnummer: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-zinc-400 hover:text-white">Abbrechen</button>
            <button type="submit" disabled={loading || !form.name}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
              style={{ backgroundColor: GOLD, color: WALDGRUEN }}>
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============== MAIN COMPONENT ==============
function LagerPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const itemIdFromUrl = searchParams.get("item")
  const tabFromUrl = (searchParams.get("tab") as TabType) || "artikel"

  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl)
  const [artikel, setArtikel] = useState<LagerArtikel[]>([])
  const [reservierungen, setReservierungen] = useState<Reservierung[]>([])
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([])
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showArtikelModal, setShowArtikelModal] = useState(false)
  const [buchungArtikel, setBuchungArtikel] = useState<LagerArtikel | null>(null)
  const [editArtikel, setEditArtikel] = useState<LagerArtikel | null>(null)
  const [qrArtikel, setQrArtikel] = useState<LagerArtikel | null>(null)
  
  const [filterKategorie, setFilterKategorie] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [artikelRes, reservRes, bestellRes, lieferantenRes] = await Promise.all([
        fetch("/api/lager"),
        fetch("/api/lager/reservierung").catch(() => null),
        fetch("/api/lager/bestellungen").catch(() => null),
        fetch("/api/lager/lieferanten").catch(() => null),
      ])

      if (!artikelRes.ok) throw new Error(`HTTP ${artikelRes.status}`)
      const artikelData = await artikelRes.json()
      setArtikel(Array.isArray(artikelData) ? artikelData : [])

      setReservierungen(reservRes?.ok ? await reservRes.json().catch(() => []) : [])
      setBestellungen(bestellRes?.ok ? await bestellRes.json().catch(() => []) : [])
      setLieferanten(lieferantenRes?.ok ? await lieferantenRes.json().catch(() => []) : [])
    } catch (err) {
      console.error("[Lager] load error:", err)
      toast.error("Lager konnte nicht geladen werden")
      setArtikel([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (itemIdFromUrl) {
      const found = artikel.find(a => a.id === itemIdFromUrl)
      if (found) setBuchungArtikel(found)
    }
  }, [itemIdFromUrl, artikel])

  const changeTab = (tab: TabType) => {
    setActiveTab(tab)
    router.push(`/lager?tab=${tab}`, { scroll: false })
  }

  // Stats
  const stats = {
    gesamtwert: artikel.reduce((sum, a) => sum + (a.bestand * (a.einkaufspreis ?? 0)), 0),
    kritisch: artikel.filter(a => a.bestand <= a.mindestbestand).length,
    offeneBestellungen: bestellungen.filter(b => b.status !== "GELIEFERT").length
  }

  // Filtered Artikel
  const filteredArtikel = artikel.filter(a => {
    if (filterKategorie && a.kategorie !== filterKategorie) return false
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const kategorien = Array.from(new Set(artikel.map(a => a.kategorie))).sort()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header mit Stats-Banner */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Lager</h1>
          <button
            onClick={() => setShowArtikelModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: GOLD, color: WALDGRUEN }}
          >
            <Plus className="w-4 h-4" />
            Artikel
          </button>
        </div>
        
        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-zinc-500 text-xs mb-1">Gesamtwert</p>
            <p className="text-xl font-bold" style={{ color: GOLD }}>{stats.gesamtwert.toFixed(2)} €</p>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-zinc-500 text-xs mb-1">Unter Mindestbestand</p>
            <p className={`text-xl font-bold ${stats.kritisch > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {stats.kritisch} Artikel
            </p>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-zinc-500 text-xs mb-1">Offene Bestellungen</p>
            <p className="text-xl font-bold text-blue-400">{stats.offeneBestellungen}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a] mb-6 overflow-x-auto">
        {[
          { id: "artikel" as const, label: "Artikel", icon: Package, count: artikel.length },
          { id: "reservierungen" as const, label: "Reservierungen", icon: ShoppingCart, count: reservierungen.filter(r => r.status === "RESERVIERT").length },
          { id: "bestellungen" as const, label: "Bestellungen", icon: Truck, count: stats.offeneBestellungen },
          { id: "lieferanten" as const, label: "Lieferanten", icon: Users, count: lieferanten.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-current text-white" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
            style={activeTab === tab.id ? { borderColor: GOLD, color: GOLD } : {}}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? "bg-[#C5A55A]/20" : "bg-[#2a2a2a]"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "artikel" && (
        <>
          {/* Filter */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Artikel suchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={filterKategorie}
              onChange={e => setFilterKategorie(e.target.value)}
              className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Alle Kategorien</option>
              {kategorien.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* Artikel-Tabelle */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium w-6"></th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Kategorie</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Bestand</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Lagerort</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Laden...</td></tr>
                ) : filteredArtikel.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Keine Artikel gefunden</td></tr>
                ) : (
                  filteredArtikel.map(a => (
                    <tr key={a.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                      <td className="px-4 py-3">
                        <BestandsAmpel bestand={a.bestand} mindestbestand={a.mindestbestand} />
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{a.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-[#2a2a2a] text-zinc-400">{a.kategorie}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white">{a.bestand}</span>
                        <span className="text-zinc-500">/{a.mindestbestand} {a.einheit}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{a.lagerort ?? "–"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setEditArtikel(a)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-[#2a2a2a] transition-all"
                            title="Bearbeiten"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setQrArtikel(a)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "reservierungen" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Artikel</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Menge</th>
                <th className="text-center px-4 py-3 text-zinc-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservierungen.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-12 text-zinc-600">Keine Reservierungen</td></tr>
              ) : (
                reservierungen.map(r => (
                  <tr key={r.id} className="border-b border-[#1e1e1e]">
                    <td className="px-4 py-3 text-white">{r.artikel.name}</td>
                    <td className="px-4 py-3 text-right text-white">{r.menge} {r.artikel.einheit}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        r.status === "RESERVIERT" ? "bg-blue-500/20 text-blue-400" :
                        r.status === "VERBRAUCHT" ? "bg-emerald-500/20 text-emerald-400" :
                        "bg-amber-500/20 text-amber-400"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "bestellungen" && (
        <div>
          <div className="flex justify-end mb-4">
            <a href="/lager/bestellungen" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: GOLD, color: WALDGRUEN }}>
              <Plus className="w-4 h-4" />
              Neue Bestellung
            </a>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Datum</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Lieferant</th>
                  <th className="text-center px-4 py-3 text-zinc-500 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {bestellungen.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-zinc-600">Keine Bestellungen</td></tr>
                ) : (
                  bestellungen.slice(0, 10).map(b => (
                    <tr key={b.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c]">
                      <td className="px-4 py-3 text-white">{new Date(b.bestelldatum).toLocaleDateString("de-DE")}</td>
                      <td className="px-4 py-3 text-white">{b.lieferant.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          b.status === "ENTWURF" ? "bg-zinc-500/20 text-zinc-400" :
                          b.status === "BESTELLT" ? "bg-blue-500/20 text-blue-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        }`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: GOLD }}>{Number(b.gesamtbetrag).toFixed(2)} €</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "lieferanten" && (
        <div>
          <div className="flex justify-end mb-4">
            <a href="/lager/lieferanten" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: GOLD, color: WALDGRUEN }}>
              <Plus className="w-4 h-4" />
              Lieferanten verwalten
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lieferanten.map(l => (
              <a key={l.id} href={`/lager/lieferanten/${l.id}`}
                className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 hover:border-zinc-600 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{l.name}</h3>
                  <span className={`w-2 h-2 rounded-full ${l.aktiv ? "bg-emerald-500" : "bg-zinc-500"}`} />
                </div>
                {l.email && <p className="text-zinc-500 text-xs truncate">{l.email}</p>}
                {l.telefon && <p className="text-zinc-500 text-xs">{l.telefon}</p>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showArtikelModal && (
        <ArtikelModal onClose={() => setShowArtikelModal(false)} onSave={() => { setShowArtikelModal(false); load() }} />
      )}
      {buchungArtikel && (
        <BuchungModal artikel={buchungArtikel} onClose={() => setBuchungArtikel(null)} onSave={() => { setBuchungArtikel(null); load() }} />
      )}
      {editArtikel && (
        <EditArtikelModal artikel={editArtikel} onClose={() => setEditArtikel(null)} onSave={() => { setEditArtikel(null); load() }} />
      )}
      {qrArtikel && (
        <QrPrintModal artikel={qrArtikel} onClose={() => setQrArtikel(null)} />
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
