"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface SOSEvent {
  eventId: string
  mitarbeiterName: string
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  status: "pending" | "sent" | "acknowledged" | "resolved"
  aktiverEinsatzName: string | null
  ausgeloestAt: string
}

interface SOSMapProps {
  events: SOSEvent[]
  selectedEventId?: string
  onSelectEvent: (eventId: string) => void
}

// Custom SOS Marker Icon
const createSOSIcon = (status: string) => {
  const isActive = status === "pending" || status === "sent"
  const isAcknowledged = status === "acknowledged"
  
  return L.divIcon({
    className: "sos-marker",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${isActive ? "#DC2626" : isAcknowledged ? "#F59E0B" : "#22C55E"};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${isActive ? "animation: pulse 1.5s infinite;" : ""}
      ">
        <span style="color: white; font-size: 18px;">🚨</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

export default function SOSMap({ events, selectedEventId, onSelectEvent }: SOSMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Default center: Germany (Baden-Württemberg)
    const map = L.map(containerRef.current, {
      center: [48.5, 9.5],
      zoom: 8,
      zoomControl: true,
    })

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when events change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker)
    })
    markersRef.current = {}

    // Add new markers for events with GPS
    const eventsWithGPS = events.filter((e) => e.gpsLatitude && e.gpsLongitude)

    eventsWithGPS.forEach((event) => {
      if (!event.gpsLatitude || !event.gpsLongitude) return

      const marker = L.marker([event.gpsLatitude, event.gpsLongitude], {
        icon: createSOSIcon(event.status),
      })

      // Popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <strong style="font-size: 14px; color: #DC2626;">🚨 ${event.mitarbeiterName}</strong>
          <br/>
          ${event.aktiverEinsatzName ? `<span style="font-size: 12px;">📍 ${event.aktiverEinsatzName}</span><br/>` : ""}
          <span style="font-size: 11px; color: #666;">
            ${new Date(event.ausgeloestAt).toLocaleString("de-DE")}
          </span>
          <br/>
          <span style="font-size: 11px; color: #666;">
            ${event.gpsLatitude.toFixed(5)}, ${event.gpsLongitude.toFixed(5)}
            ${event.gpsAccuracy ? ` (±${Math.round(event.gpsAccuracy)}m)` : ""}
          </span>
        </div>
      `
      marker.bindPopup(popupContent)

      marker.on("click", () => {
        onSelectEvent(event.eventId)
      })

      marker.addTo(map)
      markersRef.current[event.eventId] = marker

      // Add accuracy circle for active events
      if ((event.status === "pending" || event.status === "sent") && event.gpsAccuracy) {
        L.circle([event.gpsLatitude, event.gpsLongitude], {
          radius: event.gpsAccuracy,
          color: "#DC2626",
          fillColor: "#DC2626",
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map)
      }
    })

    // Fit bounds to show all markers
    if (eventsWithGPS.length > 0) {
      const bounds = L.latLngBounds(
        eventsWithGPS.map((e) => [e.gpsLatitude!, e.gpsLongitude!])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [events, onSelectEvent])

  // Focus on selected event
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedEventId) return

    const marker = markersRef.current[selectedEventId]
    if (marker) {
      map.setView(marker.getLatLng(), 15, { animate: true })
      marker.openPopup()
    }
  }, [selectedEventId])

  return (
    <div
      ref={containerRef}
      className="h-[400px] w-full"
      style={{ minHeight: "400px" }}
    />
  )
}
