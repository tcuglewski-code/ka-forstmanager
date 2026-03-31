// KH-2: API Route für Unterkunftssuche via Overpass API
// GET /api/unterkunft?lat=51.123&lng=7.456&radius=20000

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export interface Unterkunft {
  id: string
  name: string
  lat: number
  lng: number
  typ: string // hotel, guest_house, hostel, motel, apartment
  website?: string
  telefon?: string
  adresse?: string
  sterne?: number
  entfernung?: number // in km
  osmUrl: string
}

// Overpass API für OpenStreetMap
const OVERPASS_API = "https://overpass-api.de/api/interpreter"

export async function GET(req: NextRequest) {
  try {
    await auth()
    
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") || "")
    const lng = parseFloat(searchParams.get("lng") || "")
    const radius = parseInt(searchParams.get("radius") || "20000") // Default 20km

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat und lng Parameter erforderlich" },
        { status: 400 }
      )
    }

    // Overpass QL Query: Hotels, Pensionen, Hostels, Motels in Umkreis
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="hotel"](around:${radius},${lat},${lng});
        node["tourism"="guest_house"](around:${radius},${lat},${lng});
        node["tourism"="hostel"](around:${radius},${lat},${lng});
        node["tourism"="motel"](around:${radius},${lat},${lng});
        node["tourism"="apartment"](around:${radius},${lat},${lng});
        way["tourism"="hotel"](around:${radius},${lat},${lng});
        way["tourism"="guest_house"](around:${radius},${lat},${lng});
      );
      out center body;
    `

    const response = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    })

    if (!response.ok) {
      throw new Error(`Overpass API Fehler: ${response.status}`)
    }

    const data = await response.json()

    // Ergebnisse transformieren
    const unterkuenfte: Unterkunft[] = data.elements
      .filter((el: { tags?: { name?: string }; lat?: number; lon?: number; center?: { lat: number; lon: number } }) => 
        el.tags?.name && (el.lat || el.center?.lat)
      )
      .map((el: { 
        id: number; 
        lat?: number; 
        lon?: number; 
        center?: { lat: number; lon: number }; 
        tags: { 
          name: string; 
          tourism?: string; 
          website?: string; 
          phone?: string; 
          "contact:phone"?: string;
          "addr:street"?: string;
          "addr:housenumber"?: string;
          "addr:city"?: string;
          "addr:postcode"?: string;
          stars?: string;
        } 
      }) => {
        const elLat = el.lat || el.center?.lat || 0
        const elLng = el.lon || el.center?.lon || 0
        
        // Entfernung berechnen (Haversine)
        const entfernung = calculateDistance(lat, lng, elLat, elLng)
        
        // Adresse zusammenbauen
        const adressParts = []
        if (el.tags["addr:street"]) {
          adressParts.push(`${el.tags["addr:street"]} ${el.tags["addr:housenumber"] || ""}`.trim())
        }
        if (el.tags["addr:postcode"] || el.tags["addr:city"]) {
          adressParts.push(`${el.tags["addr:postcode"] || ""} ${el.tags["addr:city"] || ""}`.trim())
        }

        return {
          id: `osm-${el.id}`,
          name: el.tags.name,
          lat: elLat,
          lng: elLng,
          typ: el.tags.tourism || "hotel",
          website: el.tags.website || undefined,
          telefon: el.tags.phone || el.tags["contact:phone"] || undefined,
          adresse: adressParts.length > 0 ? adressParts.join(", ") : undefined,
          sterne: el.tags.stars ? parseInt(el.tags.stars) : undefined,
          entfernung: Math.round(entfernung * 10) / 10,
          osmUrl: `https://www.openstreetmap.org/node/${el.id}`,
        }
      })
      // Nach Entfernung sortieren
      .sort((a: Unterkunft, b: Unterkunft) => (a.entfernung || 0) - (b.entfernung || 0))
      // Auf max 50 begrenzen
      .slice(0, 50)

    return NextResponse.json({
      success: true,
      count: unterkuenfte.length,
      zentrum: { lat, lng },
      radius,
      unterkuenfte,
    })
  } catch (error) {
    console.error("[Unterkunft API] Fehler:", error)
    return NextResponse.json(
      { error: "Unterkunftssuche fehlgeschlagen" },
      { status: 500 }
    )
  }
}

// Haversine-Formel für Entfernungsberechnung
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Erdradius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
