"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Map, X, MapPin, ChevronUp, ChevronDown, AlertTriangle, ArrowLeft } from "lucide-react"

interface Flaeche {
  id: string
  registerNr: string
  baumart: string
  bundesland: string
  flaecheHa: number | null
  forstamt: string | null
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
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestNeighborTSP(points: { id: string; lat: number; lon: number }[]): string[] {
  if (points.length <= 1) return points.map((p) => p.id)
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
      if (d < minDist) { minDist = d; nearest = p }
    }
    if (!nearest) break
    visited.add(nearest.id)
    result.push(nearest.id)
    current = nearest
  }
  return result
}

function totalDistKm(flaechen: Flaeche[]): number {
  let total = 0
  for (let i = 1; i < flaechen.length; i++) {
    const a = flaechen[i - 1], b = flaechen[i]
    if (a.latDez && a.lonDez && b.latDez && b.lonDez) {
      total += haversineKm(a.latDez, a.lonDez, b.latDez, b.lonDez)
    }
  }
  return total
}

function PlanungPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlIds = searchParams.get("flaechenIds")?.split(",").filter(Boolean) ?? []

  const [planungFlaechen, setPlanungFlaechen] = useState<Flaeche[]>([])
  const [loading, setLoading] = useState(urlIds.length > 0)
  const [mapsWarning, setMapsWarning] = useState(false)

  // Beim Laden: URL-IDs direkt als Planungsflächen laden
  useEffect(() => {
    if (urlIds.length === 0) {
      setLoading(false)
      return
    }
    fetch(`/api/saatguternte/flaechen-by-ids?ids=${urlIds.join(",")}`)
      .then((r) => r.json())
      .then((data: Flaeche[]) => {
        // Reihenfolge der URL-IDs beibehalten
        const ordered = urlIds
          .map((id) => data.find((f) => f.id === id))
          .filter(Boolean) as Flaeche[]
        setPlanungFlaechen(ordered)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remove = (id: string) => setPlanungFlaechen((prev) => prev.filter((f) => f.id !== id))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setPlanungFlaechen((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    if (idx === planungFlaechen.length - 1) return
    setPlanungFlaechen((prev) => {
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
    const withoutCoords = planungFlaechen.filter((f) => !f.latDez).map((f) => f.id)
    const allIds = [...optimized, ...withoutCoords]
    setPlanungFlaechen(allIds.map((id) => planungFlaechen.find((f) => f.id === id)!).filter(Boolean))
  }

  const openGoogleMaps = () => {
    const pts = planungFlaechen.filter((f) => f.latDez && f.lonDez)
    if (pts.length === 0) return
    if (pts.length > 10) { setMapsWarning(true); setTimeout(() => setMapsWarning(false), 5000) }
    const waypoints = pts.slice(0, 10).map((f) => `${f.latDez},${f.lonDez}`).join("/")
    window.open(`https://maps.google.com/maps/dir/${waypoints}/`, "_blank")
  }

  const exportEinsatzliste = () => {
    if (planungFlaechen.length === 0) return
    window.open(`/api/saatguternte/einsatzliste?ids=${planungFlaechen.map((f) => f.id).join(",")}`, "_blank")
  }

  const gesKm = totalDistKm(planungFlaechen)
  const mitKoords = planungFlaechen.filter((f) => f.latDez).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/saatguternte/register")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Register-Übersicht
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Map className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Flächenplanung</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {planungFlaechen.length} Fläche{planungFlaechen.length !== 1 ? "n" : ""}
              {mitKoords > 0 && ` · ${mitKoords} mit Koordinaten`}
              {gesKm > 0 && ` · ${gesKm.toFixed(0)} km Gesamtstrecke`}
            </p>
          </div>
        </div>
        {planungFlaechen.length > 0 && (
          <button
            onClick={() => setPlanungFlaechen([])}
            className="text-xs text-zinc-600 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" /> Alle entfernen
          </button>
        )}
      </div>

      {/* Info-Banner */}
      {urlIds.length > 0 && !loading && (
        <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-600/30 rounded-lg flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">
            {planungFlaechen.length} Fläche{planungFlaechen.length !== 1 ? "n" : ""} aus der Register-Übersicht übernommen.
            Weitere Flächen kannst du jederzeit über{" "}
            <button onClick={() => router.push("/saatguternte/register")} className="underline hover:text-emerald-200">
              Register → Flächen auswählen
            </button>{" "}
            hinzufügen.
          </p>
        </div>
      )}

      {/* Google Maps Warning */}
      {mapsWarning && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-300">Google Maps unterstützt max. 10 Wegpunkte. Erste 10 Flächen werden angezeigt.</p>
        </div>
      )}

      {/* Leer-Zustand */}
      {!loading && planungFlaechen.length === 0 && (
        <div className="bg-[#161616] border border-border rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <MapPin className="w-12 h-12 text-zinc-800 mb-4" />
          <p className="text-zinc-400 font-medium mb-2">Keine Flächen in der Planung</p>
          <p className="text-zinc-600 text-sm mb-6">Wähle Flächen in der Register-Übersicht aus und klicke auf „Zur Planung →"</p>
          <button
            onClick={() => router.push("/saatguternte/register")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zur Register-Übersicht
          </button>
        </div>
      )}

      {/* Laden */}
      {loading && (
        <div className="bg-[#161616] border border-border rounded-xl p-16 text-center text-zinc-600">
          Lade Flächen...
        </div>
      )}

      {/* Planungs-Liste */}
      {!loading && planungFlaechen.length > 0 && (
        <div className="bg-[#161616] border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-[#1e1e1e]">
            {planungFlaechen.map((f, idx) => {
              const prev = idx > 0 ? planungFlaechen[idx - 1] : null
              let distKm: number | null = null
              if (prev?.latDez && prev?.lonDez && f.latDez && f.lonDez) {
                distKm = haversineKm(prev.latDez, prev.lonDez, f.latDez, f.lonDez)
              }

              return (
                <div key={f.id} className="flex items-start gap-4 px-4 py-4 hover:bg-[#1a1a1a] transition-colors">
                  {/* Rang + Pfeile */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5 min-w-[28px]">
                    <span className="text-xs font-mono text-zinc-600 text-center">{idx + 1}</span>
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === planungFlaechen.length - 1} className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* MapPin */}
                  <MapPin className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-sm text-zinc-200">{f.registerNr}</span>
                      <span className="text-sm text-zinc-400">{f.baumart}</span>
                      {f.flaecheHa && (
                        <span className="text-xs text-zinc-600">{f.flaecheHa.toFixed(1)} ha</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-zinc-500">{f.bundesland}</span>
                      {f.forstamt && <span className="text-xs text-zinc-600">{f.forstamt}</span>}
                    </div>
                    {f.latDez != null && (
                      <div className="text-[10px] font-mono text-zinc-700 mt-1">
                        {f.latDez.toFixed(5)}°N, {f.lonDez?.toFixed(5)}°O
                      </div>
                    )}
                    {distKm != null && (
                      <div className="text-xs text-blue-400 mt-1">
                        ↕ {distKm.toFixed(1)} km zur vorherigen Fläche
                      </div>
                    )}
                    {!f.latDez && (
                      <div className="text-xs text-zinc-700 mt-1 italic">Keine Koordinaten</div>
                    )}
                  </div>

                  {/* Entfernen */}
                  <button onClick={() => remove(f.id)} className="text-zinc-700 hover:text-red-400 transition-colors mt-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Aktionen */}
          <div className="p-4 border-t border-border space-y-3">
            <button
              onClick={optimizeRoute}
              disabled={mitKoords < 2}
              className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-border hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-emerald-400 rounded-lg text-sm font-medium transition-all"
            >
              🗺️ Optimale Route berechnen (TSP)
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={exportEinsatzliste}
                className="px-4 py-2.5 bg-[#1e1e1e] border border-border hover:border-blue-500 text-zinc-300 hover:text-blue-400 rounded-lg text-sm font-medium transition-all"
              >
                📋 Einsatzliste exportieren
              </button>
              <button
                onClick={openGoogleMaps}
                disabled={mitKoords === 0}
                className="px-4 py-2.5 bg-[#1e1e1e] border border-border hover:border-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-orange-400 rounded-lg text-sm font-medium transition-all"
              >
                🌍 Google Maps öffnen
              </button>
            </div>
            <button
              onClick={() => {
                const ids = planungFlaechen.map((f) => f.id).join(",")
                router.push(`/saatguternte/vertrag?flaechenIds=${ids}`)
              }}
              disabled={planungFlaechen.length === 0}
              className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-border hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-emerald-400 rounded-lg text-sm font-medium transition-all"
            >
              📄 Vertrag generieren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlanungPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Lade Planung...</div>}>
      <PlanungPageInner />
    </Suspense>
  )
}
