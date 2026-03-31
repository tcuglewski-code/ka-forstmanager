"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// KC-3: MapSelector Komponente für GPS-Auswahl per Klick
// Brand: Waldgrün #2C3A1C, Gold #C5A55A

interface MapSelectorProps {
  lat?: number | string | null
  lng?: number | string | null
  onChange: (coords: { lat: number; lng: number } | null) => void
  height?: number | string
  className?: string
  disabled?: boolean
}

// Custom Marker Icon mit Waldgrün
const createMarkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px; 
        height: 32px; 
        background: #2C3A1C; 
        border: 3px solid #C5A55A; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px; 
          height: 8px; 
          background: #C5A55A; 
          border-radius: 50%; 
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

export function MapSelector({
  lat,
  lng,
  onChange,
  height = 400,
  className = "",
  disabled = false,
}: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Parse coordinates
  const parsedLat = lat ? (typeof lat === "string" ? parseFloat(lat) : lat) : null
  const parsedLng = lng ? (typeof lng === "string" ? parseFloat(lng) : lng) : null
  const hasValidCoords = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Default center: Deutschland Mitte
    const defaultCenter: [number, number] = hasValidCoords 
      ? [parsedLat!, parsedLng!] 
      : [51.1657, 10.4515]
    const defaultZoom = hasValidCoords ? 14 : 6

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

    // Add initial marker if coordinates exist
    if (hasValidCoords) {
      const marker = L.marker([parsedLat!, parsedLng!], { icon: createMarkerIcon() }).addTo(map)
      markerRef.current = marker
    }

    // Click handler
    if (!disabled) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng

        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.remove()
        }

        // Add new marker
        const marker = L.marker([lat, lng], { icon: createMarkerIcon() }).addTo(map)
        markerRef.current = marker

        // Notify parent
        onChange({ lat, lng })
      })
    }

    mapInstanceRef.current = map
    setIsLoading(false)

    // Cleanup
    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update marker when coordinates change externally
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (hasValidCoords) {
      // Move or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([parsedLat!, parsedLng!])
      } else {
        const marker = L.marker([parsedLat!, parsedLng!], { icon: createMarkerIcon() }).addTo(mapInstanceRef.current)
        markerRef.current = marker
      }
      // Center map
      mapInstanceRef.current.setView([parsedLat!, parsedLng!], 14)
    } else {
      // Remove marker
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
    }
  }, [parsedLat, parsedLng, hasValidCoords])

  // Clear marker
  const handleClear = () => {
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
    onChange(null)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        className="w-full rounded-lg border border-[#2a2a2a] overflow-hidden"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0f0f0f] flex items-center justify-center rounded-lg">
          <div className="text-zinc-500 text-sm">Karte wird geladen...</div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
        {hasValidCoords && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-lg shadow-lg transition-colors"
          >
            Marker entfernen
          </button>
        )}
      </div>

      {/* Coordinates display */}
      {hasValidCoords && (
        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-[#2C3A1C]/90 text-white text-xs rounded-lg shadow-lg z-[1000] flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#C5A55A]" />
          {parsedLat!.toFixed(6)}, {parsedLng!.toFixed(6)}
        </div>
      )}

      {/* Instructions */}
      {!hasValidCoords && !disabled && (
        <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-[#161616]/90 text-zinc-400 text-xs rounded-lg shadow-lg z-[1000] text-center">
          Klicken Sie auf die Karte, um den Standort zu markieren
        </div>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/30 rounded-lg cursor-not-allowed z-[999]" />
      )}
    </div>
  )
}

export default MapSelector
