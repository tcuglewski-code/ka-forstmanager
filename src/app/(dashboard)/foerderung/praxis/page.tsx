"use client"

import { useState, useEffect } from "react"
import { Plus, RefreshCw, CheckCircle, XCircle, Clock, Pencil, Euro } from "lucide-react"
import { PraxisFormular } from "@/components/foerderung/PraxisFormular"
import KiDisclaimer from "@/components/ui/KiDisclaimer"

interface PraxisEintrag {
  id: number
  programm_id: number
  programm_name: string | null
  bundesland: string | null
  bewilligungsdauer_wochen: number | null
  beantragter_betrag_eur: number | null
  bewilligter_betrag_eur: number | null
  hinweis: string | null
  fallstricke: string | null
  erfolgreich: boolean
  antrag_datum: string | null
  bewilligung_datum: string | null
  erstellt_von: string | null
  created_at: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("de-DE")
  } catch {
    return "—"
  }
}

function formatEuro(amount: number | null): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function FoerderungPraxisPage() {
  const [eintraege, setEintraege] = useState<PraxisEintrag[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormular, setShowFormular] = useState(false)
  const [editData, setEditData] = useState<PraxisEintrag | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch("/api/foerderung/praxis")
      const data = await res.json()
      setEintraege(data.eintraege || [])
    } catch (err) {
      console.error("Fehler beim Laden:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleEdit(eintrag: PraxisEintrag) {
    setEditData(eintrag)
    setShowFormular(true)
  }

  function handleCloseFormular() {
    setShowFormular(false)
    setEditData(null)
  }

  // Statistiken
  const stats = {
    gesamt: eintraege.length,
    erfolgreich: eintraege.filter((e) => e.erfolgreich).length,
    laufend: eintraege.filter((e) => !e.bewilligung_datum && e.erfolgreich !== false).length,
    abgelehnt: eintraege.filter((e) => e.erfolgreich === false).length,
  }

  return (
    <div className="p-6 space-y-6">
      <KiDisclaimer />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Unsere Erfahrungen</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Dokumentierte Förderanträge und Praxis-Hinweise
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowFormular(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Neuen Antrag dokumentieren
          </button>
        </div>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-zinc-500 text-sm">Gesamt</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.gesamt}</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <p className="text-zinc-500 text-sm">Erfolgreich</p>
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.erfolgreich}</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <p className="text-zinc-500 text-sm">Laufend</p>
          </div>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.laufend}</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-zinc-500 text-sm">Abgelehnt</p>
          </div>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.abgelehnt}</p>
        </div>
      </div>

      {/* Tabelle */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-left">
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Programm
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  BL
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Antrag
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Dauer
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Beantragt
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Bewilligt
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    Lade Daten...
                  </td>
                </tr>
              ) : eintraege.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    Noch keine Erfahrungen dokumentiert. Starte jetzt!
                  </td>
                </tr>
              ) : (
                eintraege.map((e) => (
                  <tr key={e.id} className="hover:bg-[#1e1e1e] transition">
                    <td className="px-4 py-3">
                      {e.erfolgreich === false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Abgelehnt
                        </span>
                      ) : e.bewilligung_datum ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Bewilligt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Laufend
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium truncate max-w-[200px]">
                        {e.programm_name || `Programm #${e.programm_id}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">
                      {e.bundesland || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">
                      {formatDate(e.antrag_datum)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">
                      {e.bewilligungsdauer_wochen ? `${e.bewilligungsdauer_wochen} Wo.` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">
                      {formatEuro(e.beantragter_betrag_eur)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          e.bewilligter_betrag_eur
                            ? "text-emerald-400 font-medium"
                            : "text-zinc-500"
                        }
                      >
                        {formatEuro(e.bewilligter_betrag_eur)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(e)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition"
                        title="Bearbeiten"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formular Modal */}
      {showFormular && (
        <PraxisFormular
          onClose={handleCloseFormular}
          onSuccess={loadData}
          editData={editData}
        />
      )}
    </div>
  )
}
