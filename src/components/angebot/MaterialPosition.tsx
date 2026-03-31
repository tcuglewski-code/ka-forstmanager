"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Package } from "lucide-react"

interface LagerArtikel {
  id: string
  name: string
  kategorie: string
  einheit: string
  verkaufspreis?: number | null
  bestand: number
}

interface MaterialPositionItem {
  artikelId: string
  artikelName: string
  menge: number
  einzelpreis: number
  einheit: string
  gesamt: number
}

interface MaterialPositionProps {
  positionen: MaterialPositionItem[]
  onChange: (positionen: MaterialPositionItem[]) => void
  readOnly?: boolean
}

export function MaterialPosition({ positionen, onChange, readOnly = false }: MaterialPositionProps) {
  const [artikel, setArtikel] = useState<LagerArtikel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/lager")
      .then(res => res.json())
      .then(data => {
        setArtikel(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const addPosition = () => {
    onChange([
      ...positionen,
      {
        artikelId: "",
        artikelName: "",
        menge: 1,
        einzelpreis: 0,
        einheit: "Stück",
        gesamt: 0
      }
    ])
  }

  const updatePosition = (index: number, updates: Partial<MaterialPositionItem>) => {
    const updated = [...positionen]
    updated[index] = { ...updated[index], ...updates }
    
    // Gesamt berechnen
    updated[index].gesamt = updated[index].menge * updated[index].einzelpreis
    
    onChange(updated)
  }

  const handleArtikelChange = (index: number, artikelId: string) => {
    const selectedArtikel = artikel.find(a => a.id === artikelId)
    if (selectedArtikel) {
      updatePosition(index, {
        artikelId,
        artikelName: selectedArtikel.name,
        einzelpreis: selectedArtikel.verkaufspreis ?? 0,
        einheit: selectedArtikel.einheit
      })
    }
  }

  const removePosition = (index: number) => {
    onChange(positionen.filter((_, i) => i !== index))
  }

  const gesamtSumme = positionen.reduce((sum, p) => sum + p.gesamt, 0)

  if (loading) {
    return <div className="text-zinc-500 text-sm py-4">Lade Artikel...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#C5A55A]" />
          <h3 className="text-sm font-medium text-white">Materialien</h3>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={addPosition}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#C5A55A]/20 text-[#C5A55A] hover:bg-[#C5A55A]/30 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Material hinzufügen
          </button>
        )}
      </div>

      {positionen.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 text-sm border border-dashed border-[#2a2a2a] rounded-lg">
          Keine Materialien hinzugefügt
        </div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Artikel</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium w-24">Menge</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium w-32">Einzelpreis</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium w-32">Gesamt</th>
                {!readOnly && <th className="w-12"></th>}
              </tr>
            </thead>
            <tbody>
              {positionen.map((pos, index) => (
                <tr key={index} className="border-b border-[#1e1e1e]">
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="text-white">{pos.artikelName}</span>
                    ) : (
                      <select
                        value={pos.artikelId}
                        onChange={e => handleArtikelChange(index, e.target.value)}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C5A55A]"
                      >
                        <option value="">Artikel wählen...</option>
                        {artikel.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.bestand} {a.einheit} verfügbar)
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="text-white text-right block">{pos.menge} {pos.einheit}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={pos.menge}
                          onChange={e => updatePosition(index, { menge: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-[#C5A55A]"
                        />
                        <span className="text-xs text-zinc-500">{pos.einheit}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="text-white text-right block">{pos.einzelpreis.toFixed(2)} €</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pos.einzelpreis}
                        onChange={e => updatePosition(index, { einzelpreis: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-[#C5A55A]"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {pos.gesamt.toFixed(2)} €
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removePosition(index)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#1e1e1e]">
                <td colSpan={readOnly ? 3 : 3} className="px-4 py-3 text-right text-zinc-400 font-medium">
                  Materialkosten Gesamt:
                </td>
                <td className="px-4 py-3 text-right text-[#C5A55A] font-bold">
                  {gesamtSumme.toFixed(2)} €
                </td>
                {!readOnly && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default MaterialPosition
