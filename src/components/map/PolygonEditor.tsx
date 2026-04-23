"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Trash2, Edit3 } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw"
import "leaflet-draw/dist/leaflet.draw.css"

// KE-3: Flächen-Polygon Editor mit Leaflet Draw
// Brand: Waldgrün #2C3A1C, Gold #C5A55A

interface GeoJSONPolygon {
  type: "Polygon"
  coordinates: number[][][]
}

interface PolygonEditorProps {
  geojson?: GeoJSONPolygon | null
  onChange: (geojson: GeoJSONPolygon | null) => void
  center?: { lat: number; lng: number } | null
  height?: number | string
  className?: string
  disabled?: boolean
}

export function PolygonEditor({
  geojson,
  onChange,
  center,
  height = 400,
  className = "",
  disabled = false,
}: PolygonEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)
  const drawControlRef = useRef<L.Control.Draw | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [area, setArea] = useState<number | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Default center: Deutschland Mitte or provided center
    const defaultCenter: [number, number] = center 
      ? [center.lat, center.lng] 
      : [51.1657, 10.4515]
    const defaultZoom = center ? 14 : 6

    // Initialize map
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      scrollWheelZoom: true,
    })

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Feature group for drawn items
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems

    // Load existing GeoJSON
    if (geojson && geojson.coordinates && geojson.coordinates.length > 0) {
      try {
        const geoJsonLayer = L.geoJSON({
          type: "Feature",
          geometry: geojson,
          properties: {},
        }, {
          style: {
            color: "#2C3A1C",
            fillColor: "#2C3A1C",
            fillOpacity: 0.3,
            weight: 3,
          },
        })
        geoJsonLayer.eachLayer((layer) => {
          drawnItems.addLayer(layer)
        })
        // Fit bounds
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] })
        // Calculate area
        calculateArea(geojson)
      } catch (e) {
        console.error("Error loading GeoJSON:", e)
      }
    }

    if (!disabled) {
      // Draw control
      const drawControl = new L.Control.Draw({
        position: "topright",
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: "#e1483b",
              message: "<strong>Fehler:</strong> Polygon darf sich nicht überschneiden!",
            },
            shapeOptions: {
              color: "#2C3A1C",
              fillColor: "#2C3A1C",
              fillOpacity: 0.3,
              weight: 3,
            },
          },
          polyline: false,
          rectangle: {
            shapeOptions: {
              color: "#2C3A1C",
              fillColor: "#2C3A1C",
              fillOpacity: 0.3,
              weight: 3,
            },
          },
          circle: false,
          circlemarker: false,
          marker: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
      })
      map.addControl(drawControl)
      drawControlRef.current = drawControl

      // Draw created event
      map.on(L.Draw.Event.CREATED, (e) => {
        // Clear existing
        drawnItems.clearLayers()
        // Add new
        const layer = (e as L.DrawEvents.Created).layer
        drawnItems.addLayer(layer)
        // Convert to GeoJSON
        const geoJson = (layer as L.Polygon).toGeoJSON()
        const polygon: GeoJSONPolygon = {
          type: "Polygon",
          coordinates: (geoJson.geometry as GeoJSONPolygon).coordinates,
        }
        onChange(polygon)
        calculateArea(polygon)
      })

      // Draw edited event
      map.on(L.Draw.Event.EDITED, () => {
        const layers = drawnItems.getLayers()
        if (layers.length > 0) {
          const layer = layers[0] as L.Polygon
          const geoJson = layer.toGeoJSON()
          const polygon: GeoJSONPolygon = {
            type: "Polygon",
            coordinates: (geoJson.geometry as GeoJSONPolygon).coordinates,
          }
          onChange(polygon)
          calculateArea(polygon)
        }
      })

      // Draw deleted event
      map.on(L.Draw.Event.DELETED, () => {
        if (drawnItems.getLayers().length === 0) {
          onChange(null)
          setArea(null)
        }
      })
    }

    mapInstanceRef.current = map
    setIsLoading(false)

    // Cleanup
    return () => {
      map.remove()
      mapInstanceRef.current = null
      drawnItemsRef.current = null
      drawControlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate area in hectares
  const calculateArea = (polygon: GeoJSONPolygon) => {
    try {
      // Using L.GeometryUtil if available, otherwise estimate
      const coords = polygon.coordinates[0]
      if (coords.length < 3) {
        setArea(null)
        return
      }

      // Shoelace formula for area calculation
      let areaM2 = 0
      for (let i = 0; i < coords.length - 1; i++) {
        // Convert to approximate meters using equirectangular projection
        const lat1 = coords[i][1] * Math.PI / 180
        const lat2 = coords[i + 1][1] * Math.PI / 180
        const lng1 = coords[i][0] * Math.PI / 180
        const lng2 = coords[i + 1][0] * Math.PI / 180
        
        const x1 = 6371000 * lng1 * Math.cos((lat1 + lat2) / 2)
        const y1 = 6371000 * lat1
        const x2 = 6371000 * lng2 * Math.cos((lat1 + lat2) / 2)
        const y2 = 6371000 * lat2
        
        areaM2 += (x1 * y2 - x2 * y1)
      }
      areaM2 = Math.abs(areaM2) / 2
      
      // Convert to hectares
      const areaHa = areaM2 / 10000
      setArea(areaHa)
    } catch (e) {
      console.error("Error calculating area:", e)
      setArea(null)
    }
  }

  // Clear polygon
  const handleClear = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers()
    }
    onChange(null)
    setArea(null)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        className="w-full rounded-lg border border-border overflow-hidden"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--color-surface-container-low)] flex items-center justify-center rounded-lg">
          <div className="text-[var(--color-on-surface-variant)] text-sm">Karte wird geladen...</div>
        </div>
      )}

      {/* Area display */}
      {area !== null && (
        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-forest/90 text-white text-xs rounded-lg shadow-lg z-[1000] flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 text-gold" />
          Fläche: {area.toFixed(2)} ha
        </div>
      )}

      {/* Clear button */}
      {area !== null && !disabled && (
        <div className="absolute top-3 left-3 z-[1000]">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-lg shadow-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Fläche löschen
          </button>
        </div>
      )}

      {/* Instructions */}
      {area === null && !disabled && (
        <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-[var(--color-surface-container)]/90 text-[var(--color-on-surface-variant)] text-xs rounded-lg shadow-lg z-[1000] text-center">
          Nutzen Sie die Werkzeuge rechts oben, um die Fläche zu zeichnen
        </div>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/30 rounded-lg cursor-not-allowed z-[999]" />
      )}
    </div>
  )
}

export default PolygonEditor
