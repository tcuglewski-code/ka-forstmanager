"use client"

// Sprint Q017: Polygon-Zeichnung für Auftragsflächen mit Leaflet Draw
// Ermöglicht Admin/Gruppenführer das Einzeichnen von Flächen-Polygonen als GeoJSON

import { useEffect, useRef, useState } from "react"
import { Trash2, Save, MapPin, Maximize2 } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/useConfirm"

interface GeoJSONPolygon {
  type: "Polygon"
  coordinates: number[][][]
}

interface FlaechenPolygonProps {
  /** Auftrag-ID für API-Aufrufe */
  auftragId: string
  /** Initiales GeoJSON-Polygon (kann null sein) */
  initialGeojson?: GeoJSONPolygon | null
  /** Zentrierungs-Koordinaten (falls Polygon leer) */
  zentrum?: { lat: number; lng: number } | null
  /** Bearbeitungsmodus erlauben */
  bearbeitbar?: boolean
  /** Höhe der Karte in Pixeln */
  hoehe?: number
  /** Callback nach Speichern */
  onSave?: (geojson: GeoJSONPolygon | null) => void
}

declare global {
  interface Window {
    L: LeafletStatic
  }
}

interface LeafletStatic {
  map: (el: HTMLElement, opts?: object) => LeafletMap
  tileLayer: (url: string, opts?: object) => { addTo: (map: LeafletMap) => void }
  geoJSON: (data: object, opts?: object) => LeafletGeoJSONLayer
  polygon: (coords: [number, number][], opts?: object) => LeafletPolygonLayer
  featureGroup: (layers?: LeafletLayer[]) => LeafletFeatureGroup
  Control: {
    Draw: new (opts: object) => LeafletDrawControl
  }
  Draw: {
    Event: {
      CREATED: string
      EDITED: string
      DELETED: string
    }
  }
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap
  fitBounds: (bounds: [[number, number], [number, number]]) => void
  remove: () => void
  on: (event: string, handler: (e: DrawEvent) => void) => void
  addControl: (control: LeafletDrawControl) => void
  addLayer: (layer: LeafletLayer) => void
  removeLayer: (layer: LeafletLayer) => void
}

interface LeafletLayer {
  addTo: (map: LeafletMap) => LeafletLayer
  getBounds: () => { isValid: () => boolean; getNorthEast: () => { lat: number; lng: number }; getSouthWest: () => { lat: number; lng: number } }
}

interface LeafletGeoJSONLayer extends LeafletLayer {
  toGeoJSON: () => { type: string; features: { geometry: GeoJSONPolygon }[] }
  getLayers: () => LeafletPolygonLayer[]
}

interface LeafletPolygonLayer extends LeafletLayer {
  toGeoJSON: () => { type: string; geometry: GeoJSONPolygon }
  getLatLngs: () => { lat: number; lng: number }[][]
}

interface LeafletFeatureGroup extends LeafletLayer {
  addLayer: (layer: LeafletLayer) => void
  clearLayers: () => void
  toGeoJSON: () => { type: string; features: { geometry: GeoJSONPolygon }[] }
  getLayers: () => LeafletPolygonLayer[]
}

interface LeafletDrawControl {
  addTo: (map: LeafletMap) => void
}

interface DrawEvent {
  layer?: LeafletPolygonLayer
  layers?: LeafletFeatureGroup
}

export function FlaechenPolygon({
  auftragId,
  initialGeojson,
  zentrum,
  bearbeitbar = false,
  hoehe = 400,
  onSave,
}: FlaechenPolygonProps) {
  const { confirm, ConfirmDialogElement } = useConfirm()
  const karteRef = useRef<HTMLDivElement>(null)
  const karteInstanz = useRef<LeafletMap | null>(null)
  const drawnItems = useRef<LeafletFeatureGroup | null>(null)

  const [geojson, setGeojson] = useState<GeoJSONPolygon | null>(initialGeojson ?? null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leafletReady, setLeafletReady] = useState(false)

  // Leaflet + Leaflet Draw CSS laden
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }
    if (!document.getElementById("leaflet-draw-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-draw-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css"
      document.head.appendChild(link)
    }
  }, [])

  // Leaflet + Leaflet Draw JS laden
  useEffect(() => {
    async function loadLeaflet() {
      if (!window.L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }
      // Leaflet Draw laden
      if (!window.L.Draw) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }
      setLeafletReady(true)
    }
    loadLeaflet()
  }, [])

  // Karte initialisieren
  useEffect(() => {
    if (!leafletReady || !karteRef.current) return

    // Alte Karte entfernen
    if (karteInstanz.current) {
      karteInstanz.current.remove()
      karteInstanz.current = null
    }

    const L = window.L

    // Standard-Zentrum: Deutschland
    const defaultCenter: [number, number] = zentrum
      ? [zentrum.lat, zentrum.lng]
      : [51.1657, 10.4515]
    const defaultZoom = zentrum ? 14 : 6

    const karte = L.map(karteRef.current, {}).setView(defaultCenter, defaultZoom)
    karteInstanz.current = karte

    // OpenStreetMap Kacheln
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(karte)

    // Feature Group für gezeichnete Polygone
    const drawn = L.featureGroup()
    drawn.addTo(karte)
    drawnItems.current = drawn

    // Vorhandenes Polygon laden
    if (geojson) {
      const layer = L.geoJSON(geojson, {
        style: {
          color: "#2C3A1C",
          weight: 3,
          fillColor: "#4a7c31",
          fillOpacity: 0.3,
        },
      })
      layer.getLayers().forEach((l) => drawn.addLayer(l))

      // Auf Polygon zoomen
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        karte.fitBounds([
          [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        ])
      }
    }

    // Leaflet Draw Control (nur im Bearbeitungsmodus)
    if (bearbeitbar && L.Control.Draw) {
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawn,
          remove: true,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: "#2C3A1C",
              weight: 3,
              fillColor: "#4a7c31",
              fillOpacity: 0.3,
            },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
      })
      karte.addControl(drawControl)

      // Event: Neues Polygon gezeichnet
      karte.on(L.Draw.Event.CREATED, (e: DrawEvent) => {
        if (e.layer) {
          // Altes Polygon entfernen (nur 1 Polygon pro Auftrag)
          drawn.clearLayers()
          drawn.addLayer(e.layer)

          const geoData = e.layer.toGeoJSON()
          setGeojson(geoData.geometry as GeoJSONPolygon)
          setHasChanges(true)
        }
      })

      // Event: Polygon bearbeitet
      karte.on(L.Draw.Event.EDITED, () => {
        const layers = drawn.getLayers()
        if (layers.length > 0) {
          const geoData = layers[0].toGeoJSON()
          setGeojson(geoData.geometry as GeoJSONPolygon)
          setHasChanges(true)
        }
      })

      // Event: Polygon gelöscht
      karte.on(L.Draw.Event.DELETED, () => {
        setGeojson(null)
        setHasChanges(true)
      })
    }

    return () => {
      if (karteInstanz.current) {
        karteInstanz.current.remove()
        karteInstanz.current = null
      }
    }
  }, [leafletReady, bearbeitbar]) // eslint-disable-line react-hooks/exhaustive-deps

  // Speichern
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/auftraege/${auftragId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flaecheGeojson: geojson }),
      })

      if (res.ok) {
        setHasChanges(false)
        toast.success("Flächenpolygon gespeichert")
        onSave?.(geojson)
      } else {
        throw new Error("Speichern fehlgeschlagen")
      }
    } catch (err) {
      console.error("Fehler beim Speichern:", err)
      toast.error("Fehler beim Speichern des Polygons")
    } finally {
      setSaving(false)
    }
  }

  // Polygon löschen
  async function handleDelete() {
    const ok = await confirm({ title: "Bestätigen", message: "Flächenpolygon wirklich löschen?" })
    if (!ok) return

    drawnItems.current?.clearLayers()
    setGeojson(null)
    setHasChanges(true)
  }

  // Fläche berechnen (approximiert)
  function berechneFlaeche(): string | null {
    if (!geojson || !geojson.coordinates || !geojson.coordinates[0]) return null

    const coords = geojson.coordinates[0]
    if (coords.length < 3) return null

    // Shoelace-Formel für Fläche (vereinfacht, nimmt m² an)
    // Für genauere Berechnung: Turf.js
    let area = 0
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length
      // Umrechnung: 1 Grad ≈ 111320m (am Äquator)
      const xi = coords[i][0] * 111320 * Math.cos((coords[i][1] * Math.PI) / 180)
      const yi = coords[i][1] * 111320
      const xj = coords[j][0] * 111320 * Math.cos((coords[j][1] * Math.PI) / 180)
      const yj = coords[j][1] * 111320
      area += xi * yj - xj * yi
    }
    area = Math.abs(area) / 2

    const ha = area / 10000
    if (ha < 0.01) return `${Math.round(area)} m²`
    return `${ha.toFixed(2)} ha`
  }

  const flaeche = berechneFlaeche()

  return (
    <div className="space-y-3">
      {ConfirmDialogElement}
      {/* Toolbar */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            Auftragsfläche
          </span>
          {flaeche && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
              {flaeche}
            </span>
          )}
          {geojson && !bearbeitbar && (
            <span className="text-xs text-zinc-600">Polygon vorhanden</span>
          )}
        </div>

        {bearbeitbar && (
          <div className="flex gap-2">
            {geojson && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Löschen
              </button>
            )}
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Speichere..." : "Speichern"}
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
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3" />
          Klicke auf das Polygon-Werkzeug (links), um die Auftragsfläche einzuzeichnen
        </p>
      )}
    </div>
  )
}
