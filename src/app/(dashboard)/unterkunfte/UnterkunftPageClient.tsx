"use client"

// KH-2 + KR-3: Unterkunftsplanung mit KI-Analyse

import { useState, useEffect } from "react"
import { Search, MapPin, Hotel, Loader2, AlertCircle, Sparkles, Mail, Copy, Check, X } from "lucide-react"
import dynamic from "next/dynamic"

// Leaflet dynamisch laden (SSR-Problem vermeiden)
const UnterkunftKarte = dynamic(
  () => import("@/components/unterkunft/UnterkunftKarte").then(m => m.UnterkunftKarte),
  { 
    ssr: false,
    loading: () => (
      <div className="flex gap-4 h-[600px]">
        <div className="flex-1 rounded-xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
        <div className="w-80 bg-[#161616] border border-[#2a2a2a] rounded-xl" />
      </div>
    ),
  }
)

interface Auftrag {
  id: string
  titel: string
  nummer: string | null
  standort: string | null
  waldbesitzer: string | null
  lat: number | null
  lng: number | null
  status: string
  startDatum: Date | null
  endDatum: Date | null
}

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

// KR-1: KI-Empfehlung Interface
interface KIEmpfehlung {
  name: string
  distanzKm: number
  empfehlungsScore: number
  begruendung: string
  geeignetFuerPersonen: number
  geschaetzteKosten: string
  buchungsHinweis: string
  lat: number
  lng: number
  typ: string
}

interface Props {
  auftraege: Auftrag[]
}

export default function UnterkunftPageClient({ auftraege }: Props) {
  const [selectedAuftrag, setSelectedAuftrag] = useState<Auftrag | null>(null)
  const [radius, setRadius] = useState(20) // km
  const [unterkuenfte, setUnterkuenfte] = useState<Unterkunft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // KI-Analyse State
  const [kiLoading, setKiLoading] = useState(false)
  const [kiEmpfehlungen, setKiEmpfehlungen] = useState<KIEmpfehlung[]>([])
  const [kiError, setKiError] = useState<string | null>(null)
  const [kiVerfuegbar, setKiVerfuegbar] = useState<boolean | null>(null)
  
  // E-Mail Modal State
  const [emailModal, setEmailModal] = useState<{ open: boolean; unterkunft: KIEmpfehlung | null; emailText: string }>({
    open: false,
    unterkunft: null,
    emailText: ""
  })
  const [emailLoading, setEmailLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // KI-Verfügbarkeit prüfen
  useEffect(() => {
    fetch("/api/ki/unterkunft-analyse")
      .then(res => res.json())
      .then(data => setKiVerfuegbar(data.verfuegbar ?? false))
      .catch(() => setKiVerfuegbar(false))
  }, [])

  // Unterkunft-Suche durchführen
  useEffect(() => {
    if (!selectedAuftrag?.lat || !selectedAuftrag?.lng) {
      setUnterkuenfte([])
      setKiEmpfehlungen([])
      return
    }

    const searchUnterkunft = async () => {
      setLoading(true)
      setError(null)
      setKiEmpfehlungen([])
      
      try {
        const res = await fetch(
          `/api/unterkunft?lat=${selectedAuftrag.lat}&lng=${selectedAuftrag.lng}&radius=${radius * 1000}`
        )
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data.error || "Suche fehlgeschlagen")
        }
        
        setUnterkuenfte(data.unterkuenfte)
      } catch (err) {
        console.error("Unterkunft-Suche Fehler:", err)
        setError(err instanceof Error ? err.message : "Unbekannter Fehler")
        setUnterkuenfte([])
      } finally {
        setLoading(false)
      }
    }

    searchUnterkunft()
  }, [selectedAuftrag, radius])

  // KR-1: KI-Analyse starten
  const starteKIAnalyse = async () => {
    if (!selectedAuftrag || unterkuenfte.length === 0) return

    setKiLoading(true)
    setKiError(null)

    try {
      const res = await fetch("/api/ki/unterkunft-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auftragId: selectedAuftrag.id,
          unterkuenfte: unterkuenfte.map(u => ({
            name: u.name,
            lat: u.lat,
            lng: u.lng,
            typ: u.typ,
            adresse: u.adresse,
            telefon: u.telefon,
            website: u.website,
            sterne: u.sterne
          }))
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || data.grund || "KI-Analyse fehlgeschlagen")
      }

      setKiEmpfehlungen(data.empfehlungen)
    } catch (err) {
      console.error("KI-Analyse Fehler:", err)
      setKiError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setKiLoading(false)
    }
  }

  // KR-2: E-Mail generieren
  const generiereEmail = async (unterkunft: KIEmpfehlung) => {
    if (!selectedAuftrag) return

    setEmailLoading(true)
    setEmailModal({ open: true, unterkunft, emailText: "" })

    try {
      const res = await fetch("/api/ki/unterkunft-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aktion: "generiereEmail",
          unterkunft: { name: unterkunft.name, adresse: "" },
          teamGroesse: unterkunft.geeignetFuerPersonen || 6,
          startDatum: selectedAuftrag.startDatum 
            ? new Date(selectedAuftrag.startDatum).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          endDatum: selectedAuftrag.endDatum
            ? new Date(selectedAuftrag.endDatum).toISOString().split("T")[0]
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          standort: selectedAuftrag.standort || "Unbekannt"
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setEmailModal(prev => ({ ...prev, emailText: data.emailText }))
    } catch (err) {
      setEmailModal(prev => ({ 
        ...prev, 
        emailText: `Fehler beim Generieren der E-Mail: ${err instanceof Error ? err.message : "Unbekannt"}` 
      }))
    } finally {
      setEmailLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(emailModal.emailText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusLabels: Record<string, string> = {
    anfrage: "Anfrage",
    geplant: "Geplant",
    aktiv: "Aktiv",
    geprueft: "Geprüft",
    angebot: "Angebot",
    bestaetigt: "Bestätigt",
    in_ausfuehrung: "In Ausführung",
  }

  return (
    <div className="space-y-6">
      {/* Auftrag-Auswahl */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
        <label className="block text-sm font-medium text-zinc-400 mb-3">
          Auftrag auswählen
        </label>
        
        {auftraege.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-amber-300">
              Keine Aufträge mit GPS-Koordinaten gefunden. GPS-Position bei Aufträgen hinzufügen um Unterkünfte zu suchen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {auftraege.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAuftrag(a)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedAuftrag?.id === a.id
                    ? "border-[#C5A55A] bg-[#C5A55A]/10"
                    : "border-[#2a2a2a] hover:border-zinc-600 bg-[#0f0f0f]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {a.titel}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {a.nummer && <span className="mr-2">{a.nummer}</span>}
                      {a.waldbesitzer}
                    </p>
                    {a.standort && (
                      <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.standort}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
                    {statusLabels[a.status] || a.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Radius-Einstellung + KI-Analyse Button */}
      {selectedAuftrag && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm text-zinc-400">Suchradius:</label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            
            <div className="flex-1" />
            
            {/* KR-3: KI-Analyse Button */}
            <button
              onClick={starteKIAnalyse}
              disabled={kiLoading || unterkuenfte.length === 0 || kiVerfuegbar === false}
              title={kiVerfuegbar === false ? "ANTHROPIC_API_KEY fehlt" : "KI analysiert Unterkünfte"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                kiVerfuegbar === false
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : kiLoading
                    ? "bg-[#C5A55A]/50 text-[#0f0f0f]"
                    : "bg-[#C5A55A] text-[#0f0f0f] hover:bg-[#d4b86b]"
              }`}
            >
              {kiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {kiLoading ? "Analysiere..." : "KI-Analyse"}
            </button>
            
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Hotel className="w-4 h-4" />
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Suche läuft...
                </span>
              ) : (
                <span>{unterkuenfte.length} Unterkünfte</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KI-Empfehlungen anzeigen */}
      {kiEmpfehlungen.length > 0 && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A55A]" />
              KI-Empfehlungen
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">
              KI-generiert
            </span>
          </div>
          <div className="space-y-3">
            {kiEmpfehlungen.map((emp, idx) => (
              <div 
                key={idx}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-white">{emp.name}</h4>
                    <p className="text-xs text-zinc-500">{emp.distanzKm} km entfernt · {emp.typ}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#C5A55A]">{emp.empfehlungsScore}</div>
                    <div className="text-xs text-zinc-500">Score</div>
                  </div>
                </div>
                
                {/* Score-Balken */}
                <div className="w-full h-2 bg-[#2a2a2a] rounded-full mb-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#C5A55A] to-[#e8d5a3] rounded-full transition-all"
                    style={{ width: `${emp.empfehlungsScore}%` }}
                  />
                </div>
                
                <p className="text-sm text-zinc-300 mb-3">{emp.begruendung}</p>
                
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex gap-4">
                    <span>👥 {emp.geeignetFuerPersonen} Pers.</span>
                    <span>💰 {emp.geschaetzteKosten}</span>
                  </div>
                  <button
                    onClick={() => generiereEmail(emp)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-zinc-300 transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    Anfrage generieren
                  </button>
                </div>
                
                {emp.buchungsHinweis && (
                  <p className="text-xs text-zinc-500 mt-2 italic">💡 {emp.buchungsHinweis}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            KI-Hinweis gem. EU AI Act Art. 50: Empfehlungen sind maschinell generiert und unverbindlich.
          </p>
        </div>
      )}

      {/* KI-Fehler */}
      {kiError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300">KI-Analyse: {kiError}</p>
        </div>
      )}

      {/* Fehler-Anzeige */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Karte */}
      {selectedAuftrag?.lat && selectedAuftrag?.lng && !loading && (
        <UnterkunftKarte
          zentrum={{ lat: selectedAuftrag.lat, lng: selectedAuftrag.lng }}
          unterkuenfte={unterkuenfte}
          auftragsName={selectedAuftrag.titel}
        />
      )}

      {/* Leere State */}
      {selectedAuftrag && !loading && unterkuenfte.length === 0 && !error && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Keine Unterkünfte im Umkreis von {radius} km gefunden</p>
          <p className="text-zinc-600 text-sm mt-1">Versuche einen größeren Suchradius</p>
        </div>
      )}

      {/* Initial State */}
      {!selectedAuftrag && auftraege.length > 0 && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <MapPin className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Wähle einen Auftrag aus um Unterkünfte in der Nähe zu suchen</p>
        </div>
      )}

      {/* E-Mail Modal */}
      {emailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                Anfrage an: {emailModal.unterkunft?.name}
              </h3>
              <button 
                onClick={() => setEmailModal({ open: false, unterkunft: null, emailText: "" })}
                className="p-1 hover:bg-[#2a2a2a] rounded"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {emailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#C5A55A] animate-spin" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans leading-relaxed">
                  {emailModal.emailText}
                </pre>
              )}
            </div>
            
            <div className="p-4 border-t border-[#2a2a2a] flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm text-zinc-300 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Kopiert!" : "Kopieren"}
              </button>
              <a
                href={`mailto:?subject=Unterkunftsanfrage Koch Aufforstung&body=${encodeURIComponent(emailModal.emailText)}`}
                className="flex items-center gap-2 px-4 py-2 bg-[#C5A55A] hover:bg-[#d4b86b] rounded-lg text-sm font-medium text-[#0f0f0f] transition-colors"
              >
                <Mail className="w-4 h-4" />
                In E-Mail-Programm öffnen
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
