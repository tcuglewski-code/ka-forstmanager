"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { TeamMemberLive } from "@/app/api/team/live-status/route"

interface TeamLiveMapProps {
  team: TeamMemberLive[]
  selectedMemberId?: string
  onSelectMember: (memberId: string) => void
  showOnlyActive?: boolean // Nur MA mit GPS anzeigen
}

// Status-abhängige Marker-Icons
const createStatusIcon = (status: TeamMemberLive["status"], hasAlleinarbeit: boolean) => {
  const colors = {
    sos: "#DC2626", // Rot
    overdue: "#F59E0B", // Gelb/Orange
    ok: "#22C55E", // Grün
    offline: "#9CA3AF", // Grau
  }
  
  const emojis = {
    sos: "🚨",
    overdue: "⚠️",
    ok: "✅",
    offline: "📴",
  }
  
  const color = colors[status]
  const emoji = emojis[status]
  const isUrgent = status === "sos" || status === "overdue"
  
  return L.divIcon({
    className: "team-marker",
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isUrgent ? `
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            background: ${color};
            border-radius: 50%;
            opacity: 0.3;
            animation: pulse-ring 1.5s infinite;
          "></div>
        ` : ""}
        <div style="
          width: 36px;
          height: 36px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 2;
          ${isUrgent ? "animation: pulse 1.5s infinite;" : ""}
        ">
          <span style="font-size: 16px;">${emoji}</span>
        </div>
        ${hasAlleinarbeit ? `
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 16px;
            height: 16px;
            background: #3B82F6;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            z-index: 3;
          ">👤</div>
        ` : ""}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      </style>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  })
}

// Formatiere Zeit relativ
function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return "—"
  const date = new Date(isoString)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  
  if (diffMin < 1) return "gerade eben"
  if (diffMin < 60) return `vor ${diffMin} Min.`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `vor ${diffHours} Std.`
  return date.toLocaleDateString("de-DE")
}

export default function TeamLiveMap({
  team,
  selectedMemberId,
  onSelectMember,
  showOnlyActive = false,
}: TeamLiveMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [48.8, 9.2], // Baden-Württemberg
      zoom: 9,
      zoomControl: true,
    })

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when team changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Filter: Nur MA mit GPS (wenn showOnlyActive)
    const visibleTeam = showOnlyActive
      ? team.filter((m) => m.latitude && m.longitude)
      : team.filter((m) => m.latitude && m.longitude)

    // Entferne nicht mehr vorhandene Marker
    const currentIds = new Set(visibleTeam.map((m) => m.id))
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker)
        markersRef.current.delete(id)
      }
    })

    // Update oder erstelle Marker
    visibleTeam.forEach((member) => {
      if (!member.latitude || !member.longitude) return

      const position: L.LatLngExpression = [member.latitude, member.longitude]
      let marker = markersRef.current.get(member.id)

      // Popup-Inhalt
      const statusLabel = {
        sos: "🚨 SOS-ALARM",
        overdue: "⚠️ Überfällig",
        ok: "✅ OK",
        offline: "📴 Offline",
      }[member.status]

      const popupContent = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <strong style="font-size: 15px;">${member.name}</strong>
            <span style="
              font-size: 11px;
              padding: 2px 8px;
              border-radius: 12px;
              background: ${member.status === "sos" ? "#DC2626" : member.status === "overdue" ? "#F59E0B" : member.status === "ok" ? "#22C55E" : "#9CA3AF"};
              color: white;
            ">${statusLabel}</span>
          </div>
          
          <div style="font-size: 13px; color: #4B5563; margin-bottom: 6px;">
            <strong>Rolle:</strong> ${member.rolle}
          </div>
          
          ${member.aktiverEinsatzName ? `
            <div style="font-size: 13px; color: #4B5563; margin-bottom: 6px;">
              <strong>Einsatz:</strong> ${member.aktiverEinsatzName}
            </div>
          ` : ""}
          
          ${member.alleinarbeitAktiv ? `
            <div style="
              background: #EFF6FF;
              border: 1px solid #BFDBFE;
              border-radius: 6px;
              padding: 8px;
              margin: 8px 0;
              font-size: 12px;
            ">
              <strong style="color: #1D4ED8;">👤 Alleinarbeit aktiv</strong><br/>
              Check-In: alle ${member.checkIntervalMin} Min.<br/>
              Letzter Check: ${formatTimeAgo(member.lastCheckIn)}
              ${member.nextCheckDue ? `<br/>Nächster fällig: ${new Date(member.nextCheckDue).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </div>
          ` : ""}
          
          ${member.sosAusgeloestAt ? `
            <div style="
              background: #FEF2F2;
              border: 1px solid #FECACA;
              border-radius: 6px;
              padding: 8px;
              margin: 8px 0;
              font-size: 12px;
              color: #DC2626;
            ">
              <strong>🚨 SOS seit:</strong> ${formatTimeAgo(member.sosAusgeloestAt)}
            </div>
          ` : ""}
          
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 8px;">
            GPS: ${formatTimeAgo(member.gpsTimestamp)}
            ${member.gpsAccuracy ? ` (±${Math.round(member.gpsAccuracy)}m)` : ""}
          </div>
          
          ${member.telefon ? `
            <a href="tel:${member.telefon}" style="
              display: block;
              text-align: center;
              background: #22C55E;
              color: white;
              padding: 8px;
              border-radius: 6px;
              margin-top: 10px;
              text-decoration: none;
              font-weight: 600;
            ">📞 ${member.telefon}</a>
          ` : ""}
        </div>
      `

      if (marker) {
        // Update existierenden Marker
        marker.setLatLng(position)
        marker.setIcon(createStatusIcon(member.status, member.alleinarbeitAktiv))
        marker.getPopup()?.setContent(popupContent)
      } else {
        // Neuen Marker erstellen
        marker = L.marker(position, {
          icon: createStatusIcon(member.status, member.alleinarbeitAktiv),
        })
        marker.bindPopup(popupContent)
        marker.on("click", () => {
          onSelectMember(member.id)
        })
        marker.addTo(map)
        markersRef.current.set(member.id, marker)
      }
    })

    // Fit bounds wenn Marker vorhanden
    if (visibleTeam.length > 0) {
      const bounds = L.latLngBounds(
        visibleTeam
          .filter((m) => m.latitude && m.longitude)
          .map((m) => [m.latitude!, m.longitude!])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    }
  }, [team, showOnlyActive, onSelectMember])

  // Focus auf ausgewählten Mitarbeiter
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedMemberId) return

    const marker = markersRef.current.get(selectedMemberId)
    if (marker) {
      map.setView(marker.getLatLng(), 15, { animate: true })
      marker.openPopup()
    }
  }, [selectedMemberId])

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg"
      style={{ minHeight: "500px" }}
    />
  )
}
