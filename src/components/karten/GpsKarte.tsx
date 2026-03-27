"use client"

// Sprint AH: GPS-Karte für Arbeitseinsätze
// Verwendet Leaflet.js via CDN (kein npm-Paket nötig)

import { useEffect, useRef, useState } from "react"

interface GpsPunkt {
  lat: number
  lon: number
  timestamp: string
}

interface GpsKarteProps {
  /** ID des Einsatzes für API-Aufruf */
  einsatzId: string
  /** Bearbeitungsmodus: Erlaubt neue GPS-Punkte hinzuzufügen */
  bearbeitbar?: boolean
  /** Höhe der Karte in Pixeln (Standard: 400) */
  hoehe?: number
}

declare global {
  interface Window {
    L: {
      map: (el: HTMLElement, opts?: object) => LeafletMap
      tileLayer: (url: string, opts?: object) => { addTo: (map: LeafletMap) => void }
      polyline: (coords: [number, number][], opts?: object) => LeafletLayer
      marker: (coords: [number, number], opts?: object) => LeafletLayer
      divIcon: (opts: object) => object
      circleMarker: (coords: [number, number], opts?: object) => LeafletLayer
    }
  }
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap
  fitBounds: (bounds: [number, number][]) => void
  remove: () => void
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void
}

interface LeafletLayer {
  addTo: (map: LeafletMap) => LeafletLayer
  bindPopup: (content: string) => LeafletLayer
}

export function GpsKarte({ einsatzId, bearbeitbar = false, hoehe = 400 }: GpsKarteProps) {
  const karteRef = useRef<HTMLDivElement>(null)
  const karteInstanz = useRef<LeafletMap | null>(null)
  const [punkte, setPunkte] = useState<GpsPunkt[]>([])
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState<string | null>(null)
  const [aufzeichnen, setAufzeichnen] = useState(false)
  const watchRef = useRef<number | null>(null)

  // GPS-Track laden
  useEffect(() => {
    async function trackLaden() {
      try {
        const res = await fetch(`/api/einsaetze/${einsatzId}/gps`)
        if (!res.ok) throw new Error("GPS-Daten konnten nicht geladen werden")
        const daten = await res.json()
        setPunkte(daten.gpsTrack ?? [])
      } catch (err) {
        setFehler(err instanceof Error ? err.message : "Unbekannter Fehler")
      } finally {
        setLaden(false)
      }
    }
    trackLaden()
  }, [einsatzId])

  // Leaflet CSS laden
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }
  }, [])

  // Karte initialisieren
  useEffect(() => {
    if (laden || !karteRef.current || typeof window === "undefined") return

    async function karteInitialisieren() {
      // Leaflet via CDN laden
      if (!window.L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }

      if (!karteRef.current) return

      // Alte Karte entfernen
      if (karteInstanz.current) {
        karteInstanz.current.remove()
        karteInstanz.current = null
      }

      // Standardzentrum: Deutschland
      const zentrum: [number, number] =
        punkte.length > 0
          ? [punkte[0].lat, punkte[0].lon]
          : [51.1657, 10.4515]

      const karte = window.L.map(karteRef.current, {}).setView(zentrum, punkte.length > 0 ? 14 : 6)
      karteInstanz.current = karte

      // OpenStreetMap Kacheln
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Mitwirkende',
        maxZoom: 19,
      }).addTo(karte)

      // GPS-Track zeichnen
      if (punkte.length > 0) {
        const koordinaten: [number, number][] = punkte.map((p) => [p.lat, p.lon])

        // Linie zeichnen
        window.L.polyline(koordinaten, {
          color: "#2C3A1C",
          weight: 3,
          opacity: 0.8,
        }).addTo(karte)

        // Start-Marker (grün)
        window.L.circleMarker(koordinaten[0], {
          radius: 8,
          fillColor: "#22c55e",
          color: "#fff",
          weight: 2,
          fillOpacity: 0.9,
        })
          .addTo(karte)
          .bindPopup(
            `<strong>Start</strong><br>${new Date(punkte[0].timestamp).toLocaleString("de-DE")}`
          )

        // End-Marker (rot) — nur wenn mehr als 1 Punkt
        if (koordinaten.length > 1) {
          const letzterIdx = koordinaten.length - 1
          window.L.circleMarker(koordinaten[letzterIdx], {
            radius: 8,
            fillColor: "#ef4444",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9,
          })
            .addTo(karte)
            .bindPopup(
              `<strong>Ende</strong><br>${new Date(punkte[letzterIdx].timestamp).toLocaleString("de-DE")}`
            )
        }

        // Karte auf Track zoomen
        karte.fitBounds(koordinaten)
      }

      // Im Bearbeitungsmodus: Klick-Handler für manuelle Punkt-Eingabe
      if (bearbeitbar) {
        karte.on("click", async (e) => {
          const neuerPunkt: GpsPunkt = {
            lat: e.latlng.lat,
            lon: e.latlng.lng,
            timestamp: new Date().toISOString(),
          }
          try {
            await fetch(`/api/einsaetze/${einsatzId}/gps`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(neuerPunkt),
            })
            setPunkte((prev) => [...prev, neuerPunkt])
          } catch {
            console.error("GPS-Punkt konnte nicht gespeichert werden")
          }
        })
      }
    }

    karteInitialisieren()

    return () => {
      if (karteInstanz.current) {
        karteInstanz.current.remove()
        karteInstanz.current = null
      }
    }
  }, [laden, punkte.length, einsatzId, bearbeitbar])

  // Live-GPS-Aufzeichnung (Geolocation API)
  const aufzeichnungStarten = () => {
    if (!navigator.geolocation) {
      alert("Geolocation wird von diesem Browser nicht unterstützt")
      return
    }
    setAufzeichnen(true)
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const punkt: GpsPunkt = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          timestamp: new Date().toISOString(),
        }
        try {
          await fetch(`/api/einsaetze/${einsatzId}/gps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(punkt),
          })
          setPunkte((prev) => [...prev, punkt])
        } catch {
          console.error("GPS-Punkt konnte nicht gespeichert werden")
        }
      },
      (err) => console.error("GPS-Fehler:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
  }

  const aufzeichnungStoppen = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    setAufzeichnen(false)
  }

  if (laden) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400">
        GPS-Daten werden geladen...
      </div>
    )
  }

  if (fehler) {
    return (
      <div className="flex items-center justify-center h-40 text-red-400 text-sm">
        Fehler: {fehler}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Steuerleiste */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {punkte.length} GPS-Punkt{punkte.length !== 1 ? "e" : ""} aufgezeichnet
        </span>
        {bearbeitbar && (
          <div className="flex gap-2">
            {!aufzeichnen ? (
              <button
                onClick={aufzeichnungStarten}
                className="px-3 py-1 bg-green-700 text-white rounded-md hover:bg-green-600 text-xs"
              >
                📍 GPS-Aufzeichnung starten
              </button>
            ) : (
              <button
                onClick={aufzeichnungStoppen}
                className="px-3 py-1 bg-red-700 text-white rounded-md hover:bg-red-600 text-xs animate-pulse"
              >
                ⏹ Aufzeichnung stoppen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Karte */}
      <div
        ref={karteRef}
        style={{ height: `${hoehe}px` }}
        className="w-full rounded-lg border border-zinc-700 overflow-hidden"
      />

      {bearbeitbar && (
        <p className="text-xs text-zinc-500">
          💡 Tipp: Klicke auf die Karte um manuell einen GPS-Punkt hinzuzufügen
        </p>
      )}
    </div>
  )
}
