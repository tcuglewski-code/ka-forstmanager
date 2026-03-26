"use client"

import { useState, useEffect, useCallback } from "react"
import { Map, Search, X, MapPin, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react"

interface Flaeche {
  id: string
  registerNr: string
  baumart: string
  bundesland: string
  latDez: number | null
  lonDez: number | null
  profil: { status: string } | null
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestNeighborTSP(points: { id: string; lat: number; lon: number }[]): string[] {
  if (points.length === 0) return []
  if (points.length === 1) return [points[0].id]

  const visited = new Set<string>()
  const result: string[] = []
  let current = points[0]
  visited.add(current.id)
  result.push(current.id)

  while (visited.size < points.length) {
    let nearest: { id: string; lat: number; lon: number } | null = null
    let minDist = Infinity

    for (const p of points) {
      if (visited.has(p.id)) continue
      const d = haversineKm(current.lat, current.lon, p.lat, p.lon)
      if (d < minDist) {
        minDist = d
        nearest = p
      }
    }

    if (!nearest) break
    visited.add(nearest.id)
    result.push(nearest.id)
    current = nearest
  }

  return result
}

const STATUS_COLORS: Record<string, string> = {
  geeignet: "bg-emerald-500/20 text-emerald-400",
  geprüft: "bg-blue-500/20 text-blue-400",
  geplant: "bg-purple-500/20 text-purple-400",
  aktiv: "bg-green-500/20 text-green-400",
  verworfen: "bg-red-500/20 text-red-400",
  nicht_geeignet: "bg-red-500/20 text-red-400",
  ungeprüft: "bg-zinc-700/50 text-zinc-400",
  interessant: "bg-yellow-500/20 text-yellow-400",
  pausiert: "bg-orange-500/20 text-orange-400",
}

export default function PlanungPage() {
  const [flaechen, setFlaechen] = useState<Flaeche[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterBundesland, setFilterBundesland] = useState("")
  const [filterBaumart, setFilterBaumart] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [planungIds, setPlanungIds] = useState<string[]>([])
  const [googleMapsWarning, setGoogleMapsWarning] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("planung-ids")
      if (saved) setPlanungIds(JSON.parse(saved))
    } catch {}
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("planung-ids", JSON.stringify(planungIds))
  }, [planungIds])

  // Fetch Flächen
  useEffect(() => {
    fetch("/api/saatguternte/register?limit=500")
      .then((r) => r.json())
      .then((data) => {
        setFlaechen(data.flaechen ?? data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const bundeslaender = [...new Set(flaechen.map((f) => f.bundesland))].sort()
  const baumarten = [...new Set(flaechen.map((f) => f.baumart))].sort()

  const filtered = flaechen.filter((f) => {
    const matchSearch =
      !search ||
      f.registerNr.toLowerCase().includes(search.toLowerCase()) ||
      f.baumart.toLowerCase().includes(search.toLowerCase()) ||
      f.bundesland.toLowerCase().includes(search.toLowerCase())
    const matchBl = !filterBundesland || f.bundesland === filterBundesland
    const matchBa = !filterBaumart || f.baumart === filterBaumart
    const matchStatus = !filterStatus || (f.profil?.status ?? "ungeprüft") === filterStatus
    return matchSearch && matchBl && matchBa && matchStatus
  })

  const planungFlaechen = planungIds
    .map((id) => flaechen.find((f) => f.id === id))
    .filter(Boolean) as Flaeche[]

  const addToPlanung = useCallback(() => {
    setPlanungIds((prev) => {
      const next = [...prev]
      for (const id of selected) {
        if (!next.includes(id)) next.push(id)
      }
      setSelected(new Set())
      return next
    })
  }, [selected])

  const removeFromPlanung = (id: string) => {
    setPlanungIds((prev) => prev.filter((p) => p !== id))
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setPlanungIds((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    if (idx === planungIds.length - 1) return
    setPlanungIds((prev) => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const optimizeRoute = () => {
    const withCoords = planungFlaechen
      .filter((f) => f.latDez != null && f.lonDez != null)
      .map((f) => ({ id: f.id, lat: f.latDez!, lon: f.lonDez! }))

    if (withCoords.length < 2) return

    const optimized = nearestNeighborTSP(withCoords)
    // Preserve items without coords at the end
    const withoutCoords = planungFlaechen
      .filter((f) => f.latDez == null || f.lonDez == null)
      .map((f) => f.id)

    setPlanungIds([...optimized, ...withoutCoords])
  }

  const openGoogleMaps = () => {
    const withCoords = planungFlaechen.filter((f) => f.latDez != null && f.lonDez != null)
    if (withCoords.length === 0) return

    if (withCoords.length > 10) {
      setGoogleMapsWarning(true)
      setTimeout(() => setGoogleMapsWarning(false), 5000)
    }

    const waypoints = withCoords
      .slice(0, 10)
      .map((f) => `${f.latDez},${f.lonDez}`)
      .join("/")
    window.open(`https://maps.google.com/maps/dir/${waypoints}/`, "_blank")
  }

  const exportEinsatzliste = () => {
    if (planungIds.length === 0) return
    window.open(`/api/saatguternte/einsatzliste?ids=${planungIds.join(",")}`, "_blank")
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Map className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Flächenplanung</h1>
      </div>

      <div className="flex gap-4 h-[calc(100vh-160px)] min-h-[600px]">
        {/* Linkes Panel — Flächen-Auswahl (40%) */}
        <div className="w-[40%] flex flex-col bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {/* Filter-Header */}
          <div className="p-4 border-b border-[#2a2a2a] space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suchen (Nr, Baumart, Bundesland)..."
                className="w-full pl-9 pr-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={filterBundesland}
                onChange={(e) => setFilterBundesland(e.target.value)}
                className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Alle Länder</option>
                {bundeslaender.map((bl) => (
                  <option key={bl} value={bl}>{bl}</option>
                ))}
              </select>
              <select
                value={filterBaumart}
                onChange={(e) => setFilterBaumart(e.target.value)}
                className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Alle Baumarten</option>
                {baumarten.map((ba) => (
                  <option key={ba} value={ba}>{ba}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Alle Status</option>
                {["geeignet", "geprüft", "geplant", "ungeprüft", "verworfen"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Flächen-Liste */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-zinc-600">Lade Flächen...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-zinc-600">Keine Flächen gefunden</div>
            ) : (
              filtered.map((f) => {
                const isSelected = selected.has(f.id)
                const inPlanung = planungIds.includes(f.id)
                const status = f.profil?.status ?? "ungeprüft"
                return (
                  <label
                    key={f.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[#1e1e1e] cursor-pointer hover:bg-[#1a1a1a] transition-colors ${
                      isSelected ? "bg-emerald-900/20" : ""
                    } ${inPlanung ? "opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={inPlanung}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(f.id)
                          else next.delete(f.id)
                          return next
                        })
                      }}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-zinc-200">{f.registerNr}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[status] ?? "bg-zinc-700 text-zinc-400"}`}
                        >
                          {status}
                        </span>
                        {inPlanung && (
                          <span className="text-[10px] text-emerald-500">✓ in Planung</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {f.baumart} · {f.bundesland}
                      </div>
                      {f.latDez != null && (
                        <div className="text-[10px] text-zinc-700 font-mono mt-0.5">
                          {f.latDez.toFixed(4)}°N {f.lonDez?.toFixed(4)}°O
                        </div>
                      )}
                    </div>
                  </label>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#2a2a2a] flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {selected.size > 0
                ? `${selected.size} Fläche${selected.size !== 1 ? "n" : ""} ausgewählt`
                : `${filtered.length} Flächen gefunden`}
            </span>
            <button
              onClick={addToPlanung}
              disabled={selected.size === 0}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all"
            >
              Zur Planung hinzufügen →
            </button>
          </div>
        </div>

        {/* Rechtes Panel — Einsatzplan (60%) */}
        <div className="flex-1 flex flex-col bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Einsatzplan</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {planungFlaechen.length} Fläche{planungFlaechen.length !== 1 ? "n" : ""} geplant
              </p>
            </div>
            {planungIds.length > 0 && (
              <button
                onClick={() => {
                  setPlanungIds([])
                  localStorage.removeItem("planung-ids")
                }}
                className="text-xs text-zinc-600 hover:text-red-400 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Leeren
              </button>
            )}
          </div>

          {/* Google Maps Warning */}
          {googleMapsWarning && (
            <div className="mx-4 mt-3 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-300">
                Google Maps unterstützt max. 10 Wegpunkte. Es werden nur die ersten 10 Flächen angezeigt.
              </p>
            </div>
          )}

          {/* Planung-Liste */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {planungFlaechen.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600">
                <MapPin className="w-10 h-10 mb-3 text-zinc-800" />
                <p className="text-sm">Noch keine Flächen in der Planung.</p>
                <p className="text-xs mt-1">Wähle links Flächen aus und füge sie hinzu.</p>
              </div>
            ) : (
              planungFlaechen.map((f, idx) => {
                const prev = idx > 0 ? planungFlaechen[idx - 1] : null
                let distKm: number | null = null
                if (
                  prev &&
                  prev.latDez != null &&
                  prev.lonDez != null &&
                  f.latDez != null &&
                  f.lonDez != null
                ) {
                  distKm = haversineKm(prev.latDez, prev.lonDez, f.latDez, f.lonDez)
                }

                return (
                  <div
                    key={f.id}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 flex items-start gap-3"
                  >
                    <div className="flex flex-col items-center gap-0.5 mt-0.5">
                      <span className="text-xs font-mono text-zinc-600 w-5 text-center">{idx + 1}</span>
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === planungFlaechen.length - 1}
                        className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <MapPin className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-zinc-200">{f.registerNr}</span>
                        <span className="text-xs text-zinc-500">{f.baumart}</span>
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5">{f.bundesland}</div>
                      {f.latDez != null && (
                        <div className="text-[10px] font-mono text-zinc-700 mt-0.5">
                          {f.latDez.toFixed(5)}°N, {f.lonDez?.toFixed(5)}°O
                        </div>
                      )}
                      {distKm != null && (
                        <div className="text-[10px] text-blue-400 mt-1">
                          ↕ {distKm.toFixed(1)} km Luftlinie zur vorherigen Fläche
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeFromPlanung(f.id)}
                      className="text-zinc-700 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Aktions-Buttons */}
          <div className="p-4 border-t border-[#2a2a2a] space-y-2">
            <button
              onClick={optimizeRoute}
              disabled={planungFlaechen.filter((f) => f.latDez != null).length < 2}
              className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-emerald-400 rounded-lg text-sm font-medium transition-all"
            >
              🗺️ Optimale Route berechnen
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportEinsatzliste}
                disabled={planungIds.length === 0}
                className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-blue-400 rounded-lg text-sm font-medium transition-all"
              >
                📋 Einsatzliste exportieren
              </button>
              <button
                onClick={openGoogleMaps}
                disabled={planungFlaechen.filter((f) => f.latDez != null).length === 0}
                className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-orange-400 rounded-lg text-sm font-medium transition-all"
              >
                🌍 Google Maps öffnen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
