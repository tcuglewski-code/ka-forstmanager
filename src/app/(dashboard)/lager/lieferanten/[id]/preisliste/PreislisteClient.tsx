"use client"

// KU-1: Lieferanten-Preisliste Client-Komponente
// CSV-Import, manuelle Eingabe, KI-Import für Spalten-Mapping

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/useConfirm"
import { 
  Upload, Plus, Trash2, Save, FileSpreadsheet, AlertTriangle,
  Loader2, Check, X, Sparkles, Calendar
} from "lucide-react"

interface Artikel {
  id: string
  name: string
  kategorie: string
  einheit: string
  einkaufspreis: number | null
  verkaufspreis: number | null
  lieferantPreis: number | null
  lieferantBestellnummer: string | null
  bestand: number
  updatedAt: Date
}

interface Lieferant {
  id: string
  name: string
  artikel: Artikel[]
}

interface NeuerArtikel {
  name: string
  baumartName: string
  einheit: string
  verfuegbarkeit: "vorhanden" | "ausverkauft" | "auf_anfrage"
  preis: string
  gueltigBis: string
}

interface Props {
  lieferant: Lieferant
}

export default function PreislisteClient({ lieferant }: Props) {
  const router = useRouter()
  const { confirm, ConfirmDialogElement } = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [artikel, setArtikel] = useState<Artikel[]>(lieferant.artikel)
  const [neuerArtikel, setNeuerArtikel] = useState<NeuerArtikel>({
    name: "",
    baumartName: "",
    einheit: "Stück",
    verfuegbarkeit: "vorhanden",
    preis: "",
    gueltigBis: ""
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null)
  const [csvMapping, setCsvMapping] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Preis-Alter prüfen (>30 Tage = Warnung)
  const istPreisAlt = (updatedAt: Date) => {
    const diffDays = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays > 30
  }

  // Artikel hinzufügen
  const handleAddArtikel = async () => {
    if (!neuerArtikel.name || !neuerArtikel.preis) {
      setError("Name und Preis sind erforderlich")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/lager/artikel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: neuerArtikel.name,
          kategorie: "pflanzgut",
          einheit: neuerArtikel.einheit,
          lieferantId: lieferant.id,
          lieferantPreis: parseFloat(neuerArtikel.preis.replace(",", ".")),
          einkaufspreis: parseFloat(neuerArtikel.preis.replace(",", ".")),
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      setSuccess("Artikel hinzugefügt")
      setShowAddForm(false)
      setNeuerArtikel({
        name: "",
        baumartName: "",
        einheit: "Stück",
        verfuegbarkeit: "vorhanden",
        preis: "",
        gueltigBis: ""
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setSaving(false)
    }
  }

  // CSV-Datei verarbeiten
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvImporting(true)
    setError(null)

    try {
      const text = await file.text()
      const lines = text.split("\n").map(line => 
        line.split(/[;,]/).map(cell => cell.trim().replace(/^["']|["']$/g, ""))
      ).filter(line => line.some(cell => cell))

      if (lines.length < 2) {
        throw new Error("CSV muss mindestens Header und eine Datenzeile enthalten")
      }

      setCsvPreview(lines.slice(0, 6)) // Erste 6 Zeilen als Vorschau
      
      // Auto-Mapping versuchen
      const headers = lines[0].map(h => h.toLowerCase())
      const mapping: Record<string, number> = {}
      
      headers.forEach((h, i) => {
        if (h.includes("name") || h.includes("artikel") || h.includes("bezeichnung")) mapping.name = i
        if (h.includes("baumart") || h.includes("art") || h.includes("sorte")) mapping.baumart = i
        if (h.includes("einheit") || h.includes("unit")) mapping.einheit = i
        if (h.includes("preis") || h.includes("€") || h.includes("euro") || h.includes("price")) mapping.preis = i
        if (h.includes("verfügbar") || h.includes("status") || h.includes("lager")) mapping.verfuegbarkeit = i
      })

      setCsvMapping(mapping)
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV-Verarbeitung fehlgeschlagen")
    } finally {
      setCsvImporting(false)
    }
  }

  // CSV-Import durchführen
  const handleCSVImport = async () => {
    if (!csvPreview || Object.keys(csvMapping).length === 0) {
      setError("Bitte Spalten zuordnen")
      return
    }

    if (csvMapping.name === undefined || csvMapping.preis === undefined) {
      setError("Name und Preis müssen zugeordnet sein")
      return
    }

    setCsvImporting(true)
    setError(null)

    try {
      // Alle Zeilen außer Header parsen
      const dataRows = csvPreview.slice(1)
      let importedCount = 0

      for (const row of dataRows) {
        const name = row[csvMapping.name]
        const preis = row[csvMapping.preis]?.replace(",", ".").replace(/[^\d.]/g, "")
        
        if (!name || !preis || isNaN(parseFloat(preis))) continue

        await fetch(`/api/lager/artikel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            kategorie: "pflanzgut",
            einheit: csvMapping.einheit !== undefined ? row[csvMapping.einheit] || "Stück" : "Stück",
            lieferantId: lieferant.id,
            lieferantPreis: parseFloat(preis),
            einkaufspreis: parseFloat(preis),
          })
        })
        importedCount++
      }

      setSuccess(`${importedCount} Artikel importiert`)
      setCsvPreview(null)
      setCsvMapping({})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import fehlgeschlagen")
    } finally {
      setCsvImporting(false)
    }
  }

  // Artikel löschen
  const handleDeleteArtikel = async (artikelId: string) => {
    const ok = await confirm({ title: "Bestätigen", message: "Artikel wirklich löschen?" })
    if (!ok) return

    try {
      await fetch(`/api/lager/artikel/${artikelId}`, { method: "DELETE" })
      setArtikel(prev => prev.filter(a => a.id !== artikelId))
      setSuccess("Artikel gelöscht")
      toast.success("Artikel gelöscht")
    } catch (err) {
      setError("Löschen fehlgeschlagen")
      toast.error("Löschen fehlgeschlagen")
    }
  }

  return (
    <div className="space-y-6">
      {ConfirmDialogElement}
      {/* Fehler/Erfolg-Meldungen */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-500/20 rounded">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-300">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto p-1 hover:bg-green-500/20 rounded">
            <X className="w-4 h-4 text-green-400" />
          </button>
        </div>
      )}

      {/* Aktions-Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Artikel hinzufügen
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-zinc-300 rounded-lg text-sm hover:bg-[#3a3a3a] transition-colors"
        >
          <Upload className="w-4 h-4" />
          CSV importieren
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleCSVUpload}
          className="hidden"
        />
      </div>

      {/* CSV-Import Vorschau */}
      {csvPreview && (
        <div className="bg-[#161616] border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              CSV-Vorschau
            </h3>
            <button
              onClick={() => { setCsvPreview(null); setCsvMapping({}) }}
              className="p-1 hover:bg-surface-container-highest rounded"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Spalten-Mapping */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {csvPreview[0].map((header, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs text-zinc-500">{header || `Spalte ${idx + 1}`}</label>
                <select
                  value={Object.entries(csvMapping).find(([_, v]) => v === idx)?.[0] || ""}
                  onChange={(e) => {
                    const field = e.target.value
                    if (field) {
                      setCsvMapping(prev => ({ ...prev, [field]: idx }))
                    } else {
                      setCsvMapping(prev => {
                        const newMapping = { ...prev }
                        Object.keys(newMapping).forEach(k => {
                          if (newMapping[k] === idx) delete newMapping[k]
                        })
                        return newMapping
                      })
                    }
                  }}
                  className="w-full bg-[#0f0f0f] border border-border rounded px-2 py-1 text-xs text-white"
                >
                  <option value="">-- ignorieren --</option>
                  <option value="name">Artikelname</option>
                  <option value="baumart">Baumart</option>
                  <option value="einheit">Einheit</option>
                  <option value="preis">Preis</option>
                  <option value="verfuegbarkeit">Verfügbarkeit</option>
                </select>
              </div>
            ))}
          </div>

          {/* Vorschau-Tabelle */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {csvPreview[0].map((h, i) => (
                    <th key={i} className="text-left py-2 px-2 text-zinc-400">{h || `Spalte ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(1, 5).map((row, ri) => (
                  <tr key={ri} className="border-b border-[#1e1e1e]">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 px-2 text-zinc-300">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleCSVImport}
              disabled={csvImporting}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors disabled:opacity-50"
            >
              {csvImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Import starten
            </button>
          </div>
        </div>
      )}

      {/* Manuelles Hinzufügen */}
      {showAddForm && (
        <div className="bg-[#161616] border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4">Neuen Artikel hinzufügen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Artikelname *</label>
              <input
                type="text"
                value={neuerArtikel.name}
                onChange={(e) => setNeuerArtikel(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Eiche Traubeneiche 1+1"
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Baumart</label>
              <input
                type="text"
                value={neuerArtikel.baumartName}
                onChange={(e) => setNeuerArtikel(prev => ({ ...prev, baumartName: e.target.value }))}
                placeholder="z.B. Quercus petraea"
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Einheit</label>
              <select
                value={neuerArtikel.einheit}
                onChange={(e) => setNeuerArtikel(prev => ({ ...prev, einheit: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="Stück">Stück</option>
                <option value="kg">kg</option>
                <option value="Bündel">Bündel</option>
                <option value="Palette">Palette</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Preis (€) *</label>
              <input
                type="text"
                value={neuerArtikel.preis}
                onChange={(e) => setNeuerArtikel(prev => ({ ...prev, preis: e.target.value }))}
                placeholder="0,00"
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Verfügbarkeit</label>
              <select
                value={neuerArtikel.verfuegbarkeit}
                onChange={(e) => setNeuerArtikel(prev => ({ ...prev, verfuegbarkeit: e.target.value as "vorhanden" | "ausverkauft" | "auf_anfrage" }))}
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="vorhanden">Vorhanden</option>
                <option value="ausverkauft">Ausverkauft</option>
                <option value="auf_anfrage">Auf Anfrage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Gültig bis</label>
              <input
                type="date"
                value={neuerArtikel.gueltigBis}
                onChange={(e) => setNeuerArtikel(prev => ({ ...prev, gueltigBis: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-border rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAddArtikel}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-[#d4b86b] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Artikel-Liste */}
      <div className="bg-[#161616] border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-white">
            {artikel.length} Artikel in der Preisliste
          </h3>
        </div>
        
        {artikel.length === 0 ? (
          <div className="p-8 text-center">
            <FileSpreadsheet className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">Noch keine Artikel vorhanden</p>
            <p className="text-zinc-600 text-sm mt-1">Füge Artikel manuell hinzu oder importiere eine CSV</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e1e]">
            {artikel.map((a) => (
              <div 
                key={a.id}
                className="p-4 hover:bg-[#1c1c1c] transition-colors flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span>{a.kategorie}</span>
                    <span>·</span>
                    <span>{a.einheit}</span>
                    {a.lieferantBestellnummer && (
                      <>
                        <span>·</span>
                        <span>Art.-Nr: {a.lieferantBestellnummer}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gold">
                    {a.lieferantPreis?.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) || 
                     a.einkaufspreis?.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) ||
                     "–"}
                  </p>
                  {istPreisAlt(a.updatedAt) && (
                    <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      Preis vom {new Date(a.updatedAt).toLocaleDateString("de-DE")} — bitte prüfen
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteArtikel(a.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
