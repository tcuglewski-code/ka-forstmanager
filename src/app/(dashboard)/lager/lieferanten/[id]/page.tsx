"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, Phone, Globe, MapPin, Package, ShoppingCart, Pencil, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { BestandsAmpel } from "@/components/lager/BestandsAmpel"

interface Lieferant {
  id: string
  name: string
  email: string | null
  telefon: string | null
  website: string | null
  adresse: string | null
  plz: string | null
  ort: string | null
  land: string | null
  notizen: string | null
  aktiv: boolean
}

interface LagerArtikel {
  id: string
  name: string
  kategorie: string
  einheit: string
  bestand: number
  mindestbestand: number
  einkaufspreis: number | null
  verkaufspreis: number | null
  lieferantPreis: number | null
  lieferantBestellnummer: string | null
}

export default function LieferantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [lieferant, setLieferant] = useState<Lieferant | null>(null)
  const [artikel, setArtikel] = useState<LagerArtikel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/lager/lieferanten/${id}`).then(r => r.json()),
      fetch(`/api/lager?lieferantId=${id}`).then(r => r.json())
    ]).then(([lieferantData, artikelData]) => {
      setLieferant(lieferantData)
      setArtikel(Array.isArray(artikelData) ? artikelData : [])
      setLoading(false)
    }).catch(err => {
      console.error(err)
      toast.error("Fehler beim Laden")
      setLoading(false)
    })
  }, [id])

  const generateBestellEmail = () => {
    if (!lieferant?.email) {
      toast.error("Keine E-Mail-Adresse hinterlegt")
      return
    }

    const kritischeArtikel = artikel.filter(a => a.bestand <= a.mindestbestand)
    
    if (kritischeArtikel.length === 0) {
      toast.info("Alle Artikel haben ausreichend Bestand")
      return
    }

    const bestellListe = kritischeArtikel.map(a => {
      const bestellNr = a.lieferantBestellnummer ? ` (Art.-Nr.: ${a.lieferantBestellnummer})` : ""
      const preis = a.lieferantPreis ? ` à ${a.lieferantPreis.toFixed(2)} €` : ""
      return `- ${a.name}${bestellNr}: ${a.mindestbestand * 2 - a.bestand} ${a.einheit}${preis}`
    }).join("\n")

    const subject = encodeURIComponent(`Bestellung Koch Aufforstung GmbH`)
    const body = encodeURIComponent(
`Sehr geehrte Damen und Herren,

wir möchten folgende Artikel bestellen:

${bestellListe}

Bitte senden Sie uns eine Auftragsbestätigung mit Liefertermin.

Mit freundlichen Grüßen
Koch Aufforstung GmbH`
    )

    window.open(`mailto:${lieferant.email}?subject=${subject}&body=${body}`, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!lieferant) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Lieferant nicht gefunden</p>
        <button onClick={() => router.back()} className="mt-4 text-emerald-400 hover:underline">
          Zurück
        </button>
      </div>
    )
  }

  const kritischeArtikel = artikel.filter(a => a.bestand <= a.mindestbestand)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-[#1e1e1e] hover:bg-[#2a2a2a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{lieferant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs ${lieferant.aktiv ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
                {lieferant.aktiv ? "Aktiv" : "Inaktiv"}
              </span>
              <span className="text-zinc-500 text-sm">{artikel.length} Artikel</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={generateBestellEmail}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A55A] hover:bg-[#D4B56A] text-[#2C3A1C] rounded-lg text-sm font-medium transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          Neu bestellen
        </button>
      </div>

      {/* Kontaktdaten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Kontakt</h2>
          <div className="space-y-3">
            {lieferant.email && (
              <a href={`mailto:${lieferant.email}`} className="flex items-center gap-3 text-white hover:text-emerald-400 transition-colors">
                <Mail className="w-4 h-4 text-zinc-500" />
                {lieferant.email}
              </a>
            )}
            {lieferant.telefon && (
              <a href={`tel:${lieferant.telefon}`} className="flex items-center gap-3 text-white hover:text-emerald-400 transition-colors">
                <Phone className="w-4 h-4 text-zinc-500" />
                {lieferant.telefon}
              </a>
            )}
            {lieferant.website && (
              <a href={lieferant.website.startsWith("http") ? lieferant.website : `https://${lieferant.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white hover:text-emerald-400 transition-colors">
                <Globe className="w-4 h-4 text-zinc-500" />
                {lieferant.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Adresse</h2>
          {lieferant.adresse || lieferant.plz || lieferant.ort ? (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-zinc-500 mt-0.5" />
              <div className="text-white">
                {lieferant.adresse && <p>{lieferant.adresse}</p>}
                {(lieferant.plz || lieferant.ort) && (
                  <p>{[lieferant.plz, lieferant.ort].filter(Boolean).join(" ")}</p>
                )}
                {lieferant.land && <p className="text-zinc-500">{lieferant.land}</p>}
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Keine Adresse hinterlegt</p>
          )}
        </div>
      </div>

      {/* Kritische Bestände Warnung */}
      {kritischeArtikel.length > 0 && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">{kritischeArtikel.length} Artikel unter Mindestbestand</span>
            </div>
            <button
              onClick={generateBestellEmail}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Bestellung erstellen →
            </button>
          </div>
        </div>
      )}

      {/* Artikel-Liste */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            Artikel von diesem Lieferanten
          </h2>
        </div>
        
        {artikel.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Keine Artikel zugeordnet
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-5 py-3 text-zinc-500 font-medium"></th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Artikel</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Lieferant-Nr.</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Bestand</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">EK-Preis</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">VK-Preis</th>
              </tr>
            </thead>
            <tbody>
              {artikel.map(a => (
                <tr key={a.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                  <td className="px-5 py-3">
                    <BestandsAmpel bestand={a.bestand} mindestbestand={a.mindestbestand} />
                  </td>
                  <td className="px-5 py-3">
                    <a href={`/lager?item=${a.id}`} className="text-white hover:text-emerald-400 transition-colors">
                      {a.name}
                    </a>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-[#2a2a2a] text-zinc-500">
                      {a.kategorie}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {a.lieferantBestellnummer || "–"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={a.bestand <= a.mindestbestand ? "text-amber-400" : "text-white"}>
                      {a.bestand}
                    </span>
                    <span className="text-zinc-500">/{a.mindestbestand} {a.einheit}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-white">
                    {(a.lieferantPreis ?? a.einkaufspreis)?.toFixed(2) ?? "–"} €
                  </td>
                  <td className="px-5 py-3 text-right text-emerald-400">
                    {a.verkaufspreis?.toFixed(2) ?? "–"} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Notizen */}
      {lieferant.notizen && (
        <div className="mt-6 bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-2">Notizen</h2>
          <p className="text-white whitespace-pre-wrap">{lieferant.notizen}</p>
        </div>
      )}
    </div>
  )
}
