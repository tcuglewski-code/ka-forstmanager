"use client"

// KH-2: Unterkunft-Karte mit Leaflet und Hotel-Pins

import { useEffect, useRef, useState } from "react"
import { Hotel, ExternalLink, Phone, MapPin, Star, Loader2 } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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
  zentrum: { lat: number; lng: number }
  unterkuenfte: Unterkunft[]
  auftragsName?: string
}

// Custom Marker Icons
const createIcon = (typ: string) => {
  const colors: Record<string, string> = {
    hotel: "#C5A55A", // Gold
    guest_house: "#2C3A1C", // Waldgrün
    hostel: "#3b82f6", // Blau
    motel: "#8b5cf6", // Violett
    apartment: "#22c55e", // Grün
  }
  const color = colors[typ] || "#C5A55A"
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 14h18v7H3z"></path>
          <path d="M3 7v7h18V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"></path>
          <path d="M7 14v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"></path>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Zielort-Marker (Auftrag)
const targetIcon = L.divIcon({
  className: "target-marker",
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
})

export function UnterkunftKarte({ zentrum, unterkuenfte, auftragsName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const [selectedUnterkunft, setSelectedUnterkunft] = useState<Unterkunft | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Karte initialisieren
    const map = L.map(mapRef.current, {
      center: [zentrum.lat, zentrum.lng],
      zoom: 11,
      scrollWheelZoom: true,
    })

    // OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Zielort-Marker (Auftrag)
    L.marker([zentrum.lat, zentrum.lng], { icon: targetIcon })
      .addTo(map)
      .bindPopup(`<b>📍 Auftragsfläche</b>${auftragsName ? `<br/>${auftragsName}` : ""}`)

    // Unterkunft-Marker
    unterkuenfte.forEach((u) => {
      const marker = L.marker([u.lat, u.lng], { icon: createIcon(u.typ) })
        .addTo(map)
        .on("click", () => setSelectedUnterkunft(u))
      
      marker.bindPopup(`
        <div style="min-width: 180px;">
          <b>${u.name}</b>
          <br/><small>${u.typ === "hotel" ? "🏨 Hotel" : u.typ === "guest_house" ? "🏠 Pension" : u.typ === "hostel" ? "🛏️ Hostel" : u.typ}</small>
          ${u.entfernung ? `<br/><small>📏 ${u.entfernung} km entfernt</small>` : ""}
        </div>
      `)
    })

    // Bounds setzen wenn Unterkünfte vorhanden
    if (unterkuenfte.length > 0) {
      const bounds = L.latLngBounds([
        [zentrum.lat, zentrum.lng],
        ...unterkuenfte.map((u) => [u.lat, u.lng] as [number, number]),
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [zentrum, unterkuenfte, auftragsName])

  const typLabels: Record<string, string> = {
    hotel: "Hotel",
    guest_house: "Pension",
    hostel: "Hostel",
    motel: "Motel",
    apartment: "Ferienwohnung",
  }

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Karte */}
      <div ref={mapRef} className="flex-1 rounded-xl overflow-hidden border border-[#2a2a2a]" />
      
      {/* Seitenleiste */}
      <div className="w-80 bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Hotel className="w-4 h-4" />
            {unterkuenfte.length} Unterkünfte gefunden
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e1e]">
          {unterkuenfte.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUnterkunft(u)
                mapInstance.current?.setView([u.lat, u.lng], 14)
              }}
              className={`w-full p-3 text-left hover:bg-[#1c1c1c] transition-colors ${
                selectedUnterkunft?.id === u.id ? "bg-[#1c1c1c] border-l-2 border-[#C5A55A]" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {typLabels[u.typ] || u.typ}
                    {u.sterne && (
                      <span className="ml-2">
                        {Array(u.sterne).fill("⭐").join("")}
                      </span>
                    )}
                  </p>
                  {u.adresse && (
                    <p className="text-xs text-zinc-600 mt-1 truncate">{u.adresse}</p>
                  )}
                </div>
                <span className="text-xs text-[#C5A55A] font-medium whitespace-nowrap ml-2">
                  {u.entfernung} km
                </span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Detail-Panel */}
        {selectedUnterkunft && (
          <div className="p-4 border-t border-[#2a2a2a] bg-[#0f0f0f]">
            <h4 className="text-sm font-medium text-white mb-2">{selectedUnterkunft.name}</h4>
            <div className="space-y-2 text-xs">
              {selectedUnterkunft.adresse && (
                <p className="flex items-start gap-2 text-zinc-400">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {selectedUnterkunft.adresse}
                </p>
              )}
              {selectedUnterkunft.telefon && (
                <a
                  href={`tel:${selectedUnterkunft.telefon}`}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white"
                >
                  <Phone className="w-3 h-3" />
                  {selectedUnterkunft.telefon}
                </a>
              )}
              {selectedUnterkunft.sterne && (
                <p className="flex items-center gap-2 text-zinc-400">
                  <Star className="w-3 h-3" />
                  {selectedUnterkunft.sterne} Sterne
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              {selectedUnterkunft.website && (
                <a
                  href={selectedUnterkunft.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#C5A55A] text-[#0f0f0f] rounded text-xs font-medium hover:bg-[#d4b86b] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Website
                </a>
              )}
              <a
                href={selectedUnterkunft.osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#2a2a2a] text-zinc-300 rounded text-xs hover:bg-[#3a3a3a] transition-colors"
              >
                <MapPin className="w-3 h-3" />
                OpenStreetMap
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading State Komponente
export function UnterkunftKarteSkeleton() {
  return (
    <div className="flex gap-4 h-[600px]">
      <div className="flex-1 rounded-xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
      <div className="w-80 bg-[#161616] border border-[#2a2a2a] rounded-xl" />
    </div>
  )
}
