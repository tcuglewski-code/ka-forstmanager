"use client"

// KH-2: Unterkunftsplanung Client-Komponente

import { useState, useEffect } from "react"
import { Search, MapPin, Hotel, Loader2, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"

// Leaflet dynamisch laden (SSR-Problem vermeiden)
const UnterkunftKarte = dynamic(
  () => import("@/components/unterkunft/UnterkunftKarte").then(m => m.UnterkunftKarte),
  { 
    ssr: false,
    loading: () => (
      <div className="flex gap-4 h-[600px]">
        <div className="flex-1 rounded-xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
        <div className="w-80 bg-[#161616] border border-[#2a2a2a] rounded-xl" />
      </div>
    ),
  }
)

interface Auftrag {
  id: string
  titel: string
  nummer: string | null
  standort: string | null
  waldbesitzer: string | null
  lat: number | null
  lng: number | null
  status: string
  startDatum: Date | null
  endDatum: Date | null
}

interface Unterkunft {
  id: string
  name: string
  lat: number
  lng: number
  typ: string
  website?: string
  telefon?: string
  adresse?: string
  sterne?: number
  entfernung?: number
  osmUrl: string
}

interface Props {
  auftraege: Auftrag[]
}

export default function UnterkunftPageClient({ auftraege }: Props) {
  const [selectedAuftrag, setSelectedAuftrag] = useState<Auftrag | null>(null)
  const [radius, setRadius] = useState(20) // km
  const [unterkuenfte, setUnterkuenfte] = useState<Unterkunft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Unterkunft-Suche durchführen
  useEffect(() => {
    if (!selectedAuftrag?.lat || !selectedAuftrag?.lng) {
      setUnterkuenfte([])
      return
    }

    const searchUnterkunft = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await fetch(
          `/api/unterkunft?lat=${selectedAuftrag.lat}&lng=${selectedAuftrag.lng}&radius=${radius * 1000}`
        )
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data.error || "Suche fehlgeschlagen")
        }
        
        setUnterkuenfte(data.unterkuenfte)
      } catch (err) {
        console.error("Unterkunft-Suche Fehler:", err)
        setError(err instanceof Error ? err.message : "Unbekannter Fehler")
        setUnterkuenfte([])
      } finally {
        setLoading(false)
      }
    }

    searchUnterkunft()
  }, [selectedAuftrag, radius])

  const statusLabels: Record<string, string> = {
    anfrage: "Anfrage",
    geplant: "Geplant",
    aktiv: "Aktiv",
    geprueft: "Geprüft",
    angebot: "Angebot",
    bestaetigt: "Bestätigt",
    in_ausfuehrung: "In Ausführung",
  }

  return (
    <div className="space-y-6">
      {/* Auftrag-Auswahl */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
        <label className="block text-sm font-medium text-zinc-400 mb-3">
          Auftrag auswählen
        </label>
        
        {auftraege.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-amber-300">
              Keine Aufträge mit GPS-Koordinaten gefunden. GPS-Position bei Aufträgen hinzufügen um Unterkünfte zu suchen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {auftraege.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAuftrag(a)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedAuftrag?.id === a.id
                    ? "border-[#C5A55A] bg-[#C5A55A]/10"
                    : "border-[#2a2a2a] hover:border-zinc-600 bg-[#0f0f0f]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {a.titel}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {a.nummer && <span className="mr-2">{a.nummer}</span>}
                      {a.waldbesitzer}
                    </p>
                    {a.standort && (
                      <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.standort}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
                    {statusLabels[a.status] || a.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Radius-Einstellung + Suche */}
      {selectedAuftrag && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-zinc-400">Suchradius:</label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Hotel className="w-4 h-4" />
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Suche läuft...
                </span>
              ) : (
                <span>{unterkuenfte.length} Unterkünfte</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fehler-Anzeige */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Karte */}
      {selectedAuftrag?.lat && selectedAuftrag?.lng && !loading && (
        <UnterkunftKarte
          zentrum={{ lat: selectedAuftrag.lat, lng: selectedAuftrag.lng }}
          unterkuenfte={unterkuenfte}
          auftragsName={selectedAuftrag.titel}
        />
      )}

      {/* Leere State */}
      {selectedAuftrag && !loading && unterkuenfte.length === 0 && !error && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Keine Unterkünfte im Umkreis von {radius} km gefunden</p>
          <p className="text-zinc-600 text-sm mt-1">Versuche einen größeren Suchradius</p>
        </div>
      )}

      {/* Initial State */}
      {!selectedAuftrag && auftraege.length > 0 && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <MapPin className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Wähle einen Auftrag aus um Unterkünfte in der Nähe zu suchen</p>
        </div>
      )}
    </div>
  )
}
