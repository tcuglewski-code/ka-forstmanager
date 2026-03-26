"use client"

import { useState, useCallback } from "react"
import { Cloud, RefreshCw, AlertTriangle } from "lucide-react"
import { weatherCodeToSymbol, type MonatsAggregat } from "@/lib/open-meteo"

interface WetterSnapshot {
  id: string
  flaecheId: string
  datum: string
  jahr: number | null
  tempMinAvgC: number | null
  tempMaxAvgC: number | null
  niederschlagMm: number | null
  frosttage: number | null
  hitzetage: number | null
  regentage: number | null
  monatlichDaten: MonatsAggregat[] | null
  datenQuelle: string
}

interface AktuelleDaten {
  current: {
    temperature_2m: number
    precipitation: number
    wind_speed_10m: number
    weather_code: number
    time: string
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
  }
}

interface WetterTabProps {
  flaecheId: string
  latDez: number | null
  lonDez: number | null
}

const VERFUEGBARE_JAHRE = [
  new Date().getFullYear() - 1,
  new Date().getFullYear() - 2,
  new Date().getFullYear() - 3,
]

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
    </div>
  )
}

function formatDatum(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

function n(val: number | null | undefined, unit = "") {
  if (val == null) return "–"
  return `${val}${unit}`
}

export function WetterTab({ flaecheId, latDez, lonDez }: WetterTabProps) {
  const hasKoord = latDez != null && lonDez != null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<WetterSnapshot[]>([])
  const [aktuell, setAktuell] = useState<AktuelleDaten | null>(null)
  const [geladen, setGeladen] = useState(false)
  const [aktivesJahr, setAktivesJahr] = useState<number>(VERFUEGBARE_JAHRE[0])
  const [ladeJahr, setLadeJahr] = useState<number | null>(null)

  // Wetterdaten laden: POST + GET
  const ladeWetterdaten = useCallback(async (year?: number) => {
    setLoading(true)
    setError(null)
    const targetYear = year ?? aktivesJahr
    try {
      // Historische Daten für gewähltes Jahr speichern
      const postRes = await fetch("/api/saatguternte/wetter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flaecheId, year: targetYear }),
      })
      const postData = await postRes.json()
      if (!postRes.ok) throw new Error(postData.error ?? "Fehler beim Laden")

      // Alle Snapshots + aktuelle Vorschau holen
      const getRes = await fetch(`/api/saatguternte/wetter?flaecheId=${flaecheId}`)
      const getData = await getRes.json()
      if (!getRes.ok) throw new Error(getData.error ?? "Fehler beim Abrufen")

      setSnapshots(getData.snapshots ?? [])
      setAktuell(getData.aktuell ?? null)
      setGeladen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
      setLadeJahr(null)
    }
  }, [flaecheId, aktivesJahr])

  // Nur GET (bereits gespeicherte Daten laden)
  const ladeGespeicherte = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/saatguternte/wetter?flaecheId=${flaecheId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Fehler")
      setSnapshots(data.snapshots ?? [])
      setAktuell(data.aktuell ?? null)
      setGeladen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler")
    } finally {
      setLoading(false)
    }
  }, [flaecheId])

  const aktuellerSnapshot = snapshots.find((s) => s.jahr === aktivesJahr) ?? null
  const monatsDaten: MonatsAggregat[] = (aktuellerSnapshot?.monatlichDaten as MonatsAggregat[] | null) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            🌤️ Wetterdaten für diese Fläche
          </h2>
          {hasKoord && (
            <span className="text-xs text-zinc-600 font-mono">
              {latDez!.toFixed(4)}°N, {lonDez!.toFixed(4)}°O
            </span>
          )}
        </div>

        {!hasKoord ? (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Keine Koordinaten für diese Fläche — Wetterdaten nicht verfügbar
            </p>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => ladeWetterdaten()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {geladen ? "Wetterdaten aktualisieren" : "Wetterdaten laden"}
            </button>
            {!geladen && (
              <button
                onClick={ladeGespeicherte}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] disabled:opacity-50 text-zinc-300 rounded-lg text-sm font-medium transition-all"
              >
                <Cloud className="w-4 h-4" />
                Gespeicherte anzeigen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fehler */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <Spinner />}

      {/* Content */}
      {!loading && geladen && (
        <>
          {/* Aktuelle 7-Tage-Vorschau */}
          {aktuell && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                  📅 Aktuelle 7-Tage-Vorschau
                </h3>
                <span className="text-xs text-zinc-600">
                  Aktuell: {aktuell.current.temperature_2m}°C{" "}
                  {weatherCodeToSymbol(aktuell.current.weather_code)}{" "}
                  · Wind {aktuell.current.wind_speed_10m} km/h
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] text-xs text-zinc-500 uppercase">
                      <th className="px-4 py-3 text-left">Datum</th>
                      <th className="px-4 py-3 text-center">Symbol</th>
                      <th className="px-4 py-3 text-right">Min °C</th>
                      <th className="px-4 py-3 text-right">Max °C</th>
                      <th className="px-4 py-3 text-right">Niederschlag mm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aktuell.daily.time.map((t, i) => (
                      <tr key={t} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                        <td className="px-4 py-2.5 text-zinc-300">{formatDatum(t)}</td>
                        <td className="px-4 py-2.5 text-center text-lg">
                          {/* Kein weather_code pro Tag in archive, verwende simplen Indikator */}
                          {(aktuell.daily.precipitation_sum[i] ?? 0) > 5
                            ? "🌧️"
                            : (aktuell.daily.precipitation_sum[i] ?? 0) > 1
                            ? "🌦️"
                            : aktuell.daily.temperature_2m_max[i] > 25
                            ? "☀️"
                            : "⛅"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-400 font-mono text-xs">
                          {aktuell.daily.temperature_2m_min[i]?.toFixed(1) ?? "–"}°
                        </td>
                        <td className="px-4 py-2.5 text-right text-orange-400 font-mono text-xs">
                          {aktuell.daily.temperature_2m_max[i]?.toFixed(1) ?? "–"}°
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-400 font-mono text-xs">
                          {(aktuell.daily.precipitation_sum[i] ?? 0).toFixed(1)} mm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Jahres-Statistik */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                📊 Jahres-Statistik
              </h3>
              {/* Jahr-Auswahl */}
              <div className="flex gap-2">
                {VERFUEGBARE_JAHRE.map((jahr) => (
                  <button
                    key={jahr}
                    onClick={async () => {
                      setAktivesJahr(jahr)
                      // Falls noch kein Snapshot für dieses Jahr vorhanden: laden
                      const exists = snapshots.some((s) => s.jahr === jahr)
                      if (!exists) {
                        setLadeJahr(jahr)
                        setLoading(true)
                        setError(null)
                        try {
                          const postRes = await fetch("/api/saatguternte/wetter", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ flaecheId, year: jahr }),
                          })
                          const postData = await postRes.json()
                          if (!postRes.ok) throw new Error(postData.error)
                          const getRes = await fetch(`/api/saatguternte/wetter?flaecheId=${flaecheId}`)
                          const getData = await getRes.json()
                          setSnapshots(getData.snapshots ?? [])
                          setAktuell(getData.aktuell ?? null)
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Fehler")
                        } finally {
                          setLoading(false)
                          setLadeJahr(null)
                        }
                      }
                    }}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      aktivesJahr === jahr
                        ? "bg-emerald-600 text-white"
                        : "bg-[#2a2a2a] text-zinc-400 hover:bg-[#333] hover:text-zinc-200"
                    }`}
                  >
                    {ladeJahr === jahr ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : jahr}
                  </button>
                ))}
              </div>
            </div>

            {aktuellerSnapshot ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                  <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🌡️</div>
                    <div className="text-xs text-zinc-500 mb-1">Ø Temperatur</div>
                    <div className="text-sm font-semibold text-zinc-200">
                      {n(aktuellerSnapshot.tempMaxAvgC, "°C")}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      Min: {n(aktuellerSnapshot.tempMinAvgC, "°")} | Max: {n(aktuellerSnapshot.tempMaxAvgC, "°")}
                    </div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🌧️</div>
                    <div className="text-xs text-zinc-500 mb-1">Niederschlag</div>
                    <div className="text-sm font-semibold text-zinc-200">
                      {n(aktuellerSnapshot.niederschlagMm, " mm")}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">Jahressumme</div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">❄️</div>
                    <div className="text-xs text-zinc-500 mb-1">Frosttage</div>
                    <div className="text-sm font-semibold text-zinc-200">
                      {n(aktuellerSnapshot.frosttage, " Tage")}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">Min &lt; 0°C</div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">☀️</div>
                    <div className="text-xs text-zinc-500 mb-1">Hitzetage</div>
                    <div className="text-sm font-semibold text-zinc-200">
                      {n(aktuellerSnapshot.hitzetage, " Tage")}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">Max &gt; 30°C</div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🌧️</div>
                    <div className="text-xs text-zinc-500 mb-1">Regentage</div>
                    <div className="text-sm font-semibold text-zinc-200">
                      {n(aktuellerSnapshot.regentage, " Tage")}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">&gt; 1mm Niederschlag</div>
                  </div>
                </div>

                {/* Monatlicher Verlauf */}
                {monatsDaten.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                      Monatlicher Verlauf Jan–Dez {aktivesJahr}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a2a2a] text-xs text-zinc-500 uppercase">
                            <th className="px-3 py-2 text-left">Monat</th>
                            <th className="px-3 py-2 text-right">Ø Min °C</th>
                            <th className="px-3 py-2 text-right">Ø Max °C</th>
                            <th className="px-3 py-2 text-right">Niederschlag mm</th>
                            <th className="px-3 py-2 text-right">Frosttage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monatsDaten.map((m) => (
                            <tr
                              key={m.monat}
                              className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors"
                            >
                              <td className="px-3 py-2 text-zinc-300 font-medium">{m.label}</td>
                              <td className="px-3 py-2 text-right text-blue-400 font-mono text-xs">
                                {m.tempMinAvg != null ? `${m.tempMinAvg}°` : "–"}
                              </td>
                              <td className="px-3 py-2 text-right text-orange-400 font-mono text-xs">
                                {m.tempMaxAvg != null ? `${m.tempMaxAvg}°` : "–"}
                              </td>
                              <td className="px-3 py-2 text-right text-zinc-400 font-mono text-xs">
                                {m.niederschlagSumme} mm
                              </td>
                              <td className="px-3 py-2 text-right text-zinc-500 font-mono text-xs">
                                {m.frosttage > 0 ? (
                                  <span className="text-blue-400">{m.frosttage}</span>
                                ) : (
                                  "–"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Cloud className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">
                  Noch keine Daten für {aktivesJahr} geladen.
                </p>
                <button
                  onClick={() => ladeWetterdaten(aktivesJahr)}
                  disabled={loading}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
                >
                  Jetzt laden
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
