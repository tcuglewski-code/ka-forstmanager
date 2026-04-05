"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Euro,
  MapPin,
  ExternalLink,
  X,
  ChevronDown,
  Building2,
  Loader2,
  TreePine,
  BookOpen,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react"
import { BeratungsErgebnis } from "@/components/foerderung/BeratungsErgebnis"
import KiDisclaimer from "@/components/ui/KiDisclaimer"

// ─────────────── Types ───────────────

interface Foerderprogramm {
  id: number
  name: string
  ebene: string | null
  bundesland: string | null
  kategorie: string | null
  foerderart: string | null
  traeger: string | null
  bewilligungsstelle: string | null
  zielgruppe: string | null
  foerdergegenstand: string | null
  foerderkulisse: string | null
  foerdersatz: string | null
  antragsfrist: string | null
  antragsweg: string | null
  foerdergrundlage: string | null
  url: string | null
  status: string | null
  geprueft: boolean | null
}

// ─────────────── Konstanten ───────────────

const BUNDESLAENDER = [
  "Bundesweit",
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
]

const FOERDERTYPEN = [
  { value: "", label: "Alle Typen" },
  { value: "aufforstung", label: "Aufforstung / Wiederbewaldung" },
  { value: "waldumbau", label: "Waldumbau" },
  { value: "naturverjuengung", label: "Naturverjüngung / Waldpflege" },
  { value: "sonstiges", label: "Sonstiges" },
]

const KATEGORIE_LABELS: Record<string, string> = {
  erstaufforstung: "Erstaufforstung",
  wiederbewaldung: "Wiederbewaldung",
  waldschutz: "Waldschutz",
  waldumbau: "Waldumbau",
  waldpflege: "Waldpflege",
  foerderung_allgemein: "Allgemein",
  forschung: "Forschung",
  klimaanpassung: "Klimaanpassung",
  zaunbau: "Zaunbau",
}

const STATUS_FARBEN: Record<string, string> = {
  OFFEN: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  UNKLAR: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  GESCHLOSSEN: "bg-red-500/20 text-red-400 border border-red-500/30",
}

// ─────────────── Hilfsfunktionen ───────────────

function getBadgeLabel(prog: Foerderprogramm): string {
  if (prog.ebene === "bund") return "Bundesweit"
  return prog.bundesland || "Unbekannt"
}

function parseKategorien(kat: string | null): string[] {
  if (!kat) return []
  return kat
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
}

function KategorieBadge({ kat }: { kat: string }) {
  const label = KATEGORIE_LABELS[kat] || kat
  return (
    <span className="px-2 py-0.5 bg-[#2C3A1C]/60 text-emerald-300 rounded text-xs border border-emerald-900/40">
      {label}
    </span>
  )
}

// ─────────────── Detail Modal ───────────────

function DetailModal({
  prog,
  onClose,
}: {
  prog: Foerderprogramm
  onClose: () => void
}) {
  const [auftraege, setAuftraege] = useState<{ id: string; titel: string }[]>([])
  const [selectedAuftrag, setSelectedAuftrag] = useState("")
  const [gespeichert, setGespeichert] = useState(false)
  const [speichernLaeuft, setSpeichernLaeuft] = useState(false)

  useEffect(() => {
    fetch("/api/auftraege?limit=50")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || []
        setAuftraege(list.map((a: any) => ({ id: a.id, titel: a.titel })))
      })
      .catch((err) => { console.error("Aufträge Ladefehler:", err) })
  }, [])

  async function handleSpeichern() {
    if (!selectedAuftrag) return
    setSpeichernLaeuft(true)
    try {
      const notiz = `📋 Förderprogramm-Empfehlung: ${prog.name}\n🏛️ Träger: ${prog.traeger || "–"}\n💶 Fördersatz: ${prog.foerdersatz || "–"}\n🔗 ${prog.url || "kein Link"}`
      await fetch(`/api/auftraege/${selectedAuftrag}/notizen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notiz, typ: "foerderempfehlung" }),
      })
      setGespeichert(true)
    } catch {
      // Fallback: Notiz wurde möglicherweise trotzdem gespeichert
      setGespeichert(true)
    } finally {
      setSpeichernLaeuft(false)
    }
  }

  const kategorien = parseKategorien(prog.kategorie)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#111111] border-b border-[#2a2a2a] px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  STATUS_FARBEN[prog.status || ""] || "bg-zinc-700/50 text-zinc-400"
                }`}
              >
                {prog.status || "Unbekannt"}
              </span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                {getBadgeLabel(prog)}
              </span>
              {prog.geprueft && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                  <CheckCircle className="w-3 h-3" /> Geprüft
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">{prog.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg text-zinc-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Kategorien */}
          {kategorien.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {kategorien.map((k) => (
                <KategorieBadge key={k} kat={k} />
              ))}
            </div>
          )}

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Förderträger" value={prog.traeger} icon={<Building2 className="w-4 h-4" />} />
            <InfoField label="Fördersatz" value={prog.foerdersatz} icon={<Euro className="w-4 h-4" />} highlight />
            <InfoField label="Bewilligungsstelle" value={prog.bewilligungsstelle} icon={<MapPin className="w-4 h-4" />} />
            <InfoField label="Förderart" value={prog.foerderart} icon={<Info className="w-4 h-4" />} />
          </div>

          {/* Beschreibungen */}
          {prog.foerdergegenstand && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Fördergegenstand</h3>
              <p className="text-sm text-zinc-300 leading-relaxed bg-[#161616] rounded-lg p-3 border border-[#2a2a2a]">
                {prog.foerdergegenstand}
              </p>
            </div>
          )}

          {prog.zielgruppe && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Zielgruppe / Voraussetzungen</h3>
              <p className="text-sm text-zinc-300 leading-relaxed bg-[#161616] rounded-lg p-3 border border-[#2a2a2a]">
                {prog.zielgruppe}
              </p>
            </div>
          )}

          {prog.foerderkulisse && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Förderkulisse</h3>
              <p className="text-sm text-zinc-300 leading-relaxed bg-[#161616] rounded-lg p-3 border border-[#2a2a2a]">
                {prog.foerderkulisse}
              </p>
            </div>
          )}

          {/* Antragsinfos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prog.antragsfrist && (
              <div>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Antragsfrist</h3>
                <p className="text-sm text-zinc-300">{prog.antragsfrist}</p>
              </div>
            )}
            {prog.antragsweg && (
              <div>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Antragsweg</h3>
                <p className="text-sm text-zinc-300">{prog.antragsweg}</p>
              </div>
            )}
            {prog.foerdergrundlage && (
              <div className="sm:col-span-2">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Rechtsgrundlage</h3>
                <p className="text-sm text-zinc-400">{prog.foerdergrundlage}</p>
              </div>
            )}
          </div>

          {/* Link */}
          {prog.url && (
            <a
              href={prog.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Zur offiziellen Seite der Behörde</span>
            </a>
          )}

          {/* Empfehlung in Kundenakte */}
          <div className="border-t border-[#2a2a2a] pt-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Save className="w-4 h-4 text-emerald-400" />
              Als Empfehlung in Kundenakte speichern
            </h3>
            {gespeichert ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                Erfolgreich in Kundenakte gespeichert!
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedAuftrag}
                  onChange={(e) => setSelectedAuftrag(e.target.value)}
                  className="flex-1 bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Auftrag auswählen…</option>
                  {auftraege.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.titel}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSpeichern}
                  disabled={!selectedAuftrag || speichernLaeuft}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  {speichernLaeuft ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Speichern
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string | null
  icon?: React.ReactNode
  highlight?: boolean
}) {
  if (!value) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
        {icon && <span className="text-zinc-600">{icon}</span>}
        {label}
      </div>
      <p className={`text-sm leading-snug ${highlight ? "text-emerald-300 font-medium" : "text-zinc-300"}`}>
        {value}
      </p>
    </div>
  )
}

// ─────────────── Programm-Karte ───────────────

function ProgrammKarte({
  prog,
  onKlick,
}: {
  prog: Foerderprogramm
  onKlick: () => void
}) {
  const kategorien = parseKategorien(prog.kategorie)
  const istBundesweit = prog.ebene === "bund"

  return (
    <button
      onClick={onKlick}
      className="w-full text-left bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 hover:border-emerald-900/60 hover:bg-[#1a1a1a] transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-emerald-100 transition-colors">
          {prog.name}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              STATUS_FARBEN[prog.status || ""] || "bg-zinc-700/50 text-zinc-400"
            }`}
          >
            {prog.status || "–"}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs border ${
            istBundesweit
              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
              : "bg-violet-500/20 text-violet-400 border-violet-500/30"
          }`}
        >
          {istBundesweit ? "🇩🇪 Bundesweit" : `📍 ${prog.bundesland}`}
        </span>
        {kategorien.slice(0, 2).map((k) => (
          <KategorieBadge key={k} kat={k} />
        ))}
        {kategorien.length > 2 && (
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
            +{kategorien.length - 2}
          </span>
        )}
      </div>

      {/* Förderstelle + Betrag */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 min-w-0">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{prog.traeger || "–"}</span>
        </div>
        {prog.foerdersatz && (
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium flex-shrink-0">
            <Euro className="w-3.5 h-3.5" />
            <span className="max-w-[140px] text-right leading-tight line-clamp-2">{prog.foerdersatz}</span>
          </div>
        )}
      </div>

      {/* Beschreibung */}
      {prog.foerdergegenstand && (
        <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
          {prog.foerdergegenstand}
        </p>
      )}
    </button>
  )
}

// ─────────────── Hauptseite ───────────────

export default function FoerderungPage() {
  // ── KI-Förderberater State ──
  const [beratungsFrage, setBeratungsFrage] = useState("")
  const [beratungsBundesland, setBeratungsBundesland] = useState("")
  const [beratungsFlaeche, setBeratungsFlaeche] = useState("")
  const [beratungsKalamitaet, setBeratungsKalamitaet] = useState(false)
  const [beratungsLaeuft, setBeratungsLaeuft] = useState(false)
  const [beratungsErgebnis, setBeratungsErgebnis] = useState<{
    synthese: string
    programme: unknown[]
    kombinationen: unknown[]
    ki_synthese: boolean
  } | null>(null)
  const [beratungsFehler, setBeratungsFehler] = useState<string | null>(null)

  async function starteBeratung() {
    if (!beratungsFrage.trim()) return
    setBeratungsLaeuft(true)
    setBeratungsErgebnis(null)
    setBeratungsFehler(null)
    try {
      const res = await fetch("/api/betriebs-assistent/beraten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frage: beratungsFrage,
          bundesland: beratungsBundesland || undefined,
          waldtyp: "privatwald",
          flaeche_ha: beratungsFlaeche ? parseFloat(beratungsFlaeche) : undefined,
          kalamitaet: beratungsKalamitaet ? "schaden" : undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBeratungsErgebnis(data)
    } catch (e: unknown) {
      setBeratungsFehler(e instanceof Error ? e.message : "Fehler bei der Beratung")
    } finally {
      setBeratungsLaeuft(false)
    }
  }

  // ── Filter State ──
  const [suche, setSuche] = useState("")
  const [bundesland, setBundesland] = useState("")
  const [typ, setTyp] = useState("")
  const [ergebnisse, setErgebnisse] = useState<Foerderprogramm[]>([])
  const [loading, setLoading] = useState(false)
  const [gestartet, setGestartet] = useState(false)
  const [ausgewaehlt, setAusgewaehlt] = useState<Foerderprogramm | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const suchen = useCallback(
    async (q: string, bl: string, t: string) => {
      setLoading(true)
      setGestartet(true)
      try {
        const params = new URLSearchParams()
        if (q) params.set("q", q)
        if (bl) params.set("bundesland", bl)
        if (t) params.set("typ", t)

        const res = await fetch(`/api/foerderung/suche?${params.toString()}`)
        const data = await res.json()
        setErgebnisse(data.data || [])
      } catch (err) {
        console.error("Suchfehler:", err)
        setErgebnisse([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Initial alle laden
  useEffect(() => {
    suchen("", "", "")
  }, [suchen])

  // Debounce bei Texteingabe
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(() => {
      suchen(suche, bundesland, typ)
    }, 400)
    setDebounceTimer(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suche, bundesland, typ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <KiDisclaimer />
      {/* Titel */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-900/40 flex items-center justify-center">
          <TreePine className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Förder-Intelligence</h1>
          <p className="text-sm text-zinc-500">
            {ergebnisse.length > 0 && gestartet
              ? `${ergebnisse.length} Förderprogramme gefunden`
              : "Suche nach passenden Förderprogrammen für Ihre Projekte"}
          </p>
        </div>
      </div>

      {/* KI-Förderberater Block */}
      <div className="bg-gradient-to-br from-[#1a2412] to-[#161616] border border-emerald-900/40 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <TreePine className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Betriebs-Assistent</h2>
            <p className="text-zinc-400 text-xs">Stellen Sie eine Frage zu Fördermöglichkeiten — KI durchsucht 255 Programme</p>
          </div>
        </div>

        {/* Eingabe */}
        <div className="space-y-3">
          <textarea
            value={beratungsFrage}
            onChange={(e) => setBeratungsFrage(e.target.value)}
            placeholder="z.B. Welche Förderung gibt es für Wiederbewaldung nach Borkenkäfer in Bayern? Oder: Wie kombiniere ich GAK und ELER-Förderung?"
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-700/60 resize-none"
            rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) starteBeratung() }}
          />

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-zinc-500 mb-1 block">Bundesland (optional)</label>
              <select
                value={beratungsBundesland}
                onChange={(e) => setBeratungsBundesland(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-700/60"
              >
                <option value="">Alle Bundesländer</option>
                {BUNDESLAENDER.map((bl) => (
                  <option key={bl} value={bl}>{bl}</option>
                ))}
              </select>
            </div>

            <div className="w-32">
              <label className="text-xs text-zinc-500 mb-1 block">Fläche (ha)</label>
              <input
                type="number"
                value={beratungsFlaeche}
                onChange={(e) => setBeratungsFlaeche(e.target.value)}
                placeholder="z.B. 5.5"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-700/60"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pb-1">
              <input
                type="checkbox"
                checked={beratungsKalamitaet}
                onChange={(e) => setBeratungsKalamitaet(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500"
              />
              <span className="text-sm text-zinc-300">Kalamität / Schaden</span>
            </label>

            <button
              onClick={starteBeratung}
              disabled={beratungsLaeuft || !beratungsFrage.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {beratungsLaeuft ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analysiere...</>
              ) : (
                <><Search className="w-4 h-4" /> Beraten lassen</>
              )}
            </button>
          </div>
        </div>

        {/* Fehler */}
        {beratungsFehler && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {beratungsFehler}
          </div>
        )}

        {/* Ergebnis mit Markdown-Rendering + PDF-Export */}
        {beratungsErgebnis && (
          <BeratungsErgebnis
            ergebnis={beratungsErgebnis as {
              synthese: string
              programme: Array<{
                id: number
                name: string
                bundesland: string
                foerdersatz: string
                antragsfrist: string
                url: string
                traeger?: string
                foerdergegenstand?: string
              }>
              kombinationen: Array<{
                prog_a_name: string
                prog_b_name: string
                bedingung: string
              }>
              ki_synthese: boolean
            }}
            frage={beratungsFrage}
            bundesland={beratungsBundesland}
            flaeche={beratungsFlaeche}
            kalamitaet={beratungsKalamitaet}
          />
        )}
      </div>

      {/* Suchleiste + Filter */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 mb-6 space-y-3">
        {/* Suchfeld */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Suche nach Programmen, Bundesland, Fördergegenstand…"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
          )}
        </div>

        {/* Filter-Zeile */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Bundesland */}
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <select
              value={bundesland}
              onChange={(e) => setBundesland(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600 appearance-none transition-colors"
            >
              <option value="">Alle Bundesländer</option>
              {BUNDESLAENDER.map((bl) => (
                <option key={bl} value={bl}>
                  {bl}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>

          {/* Fördertyp */}
          <div className="relative flex-1">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <select
              value={typ}
              onChange={(e) => setTyp(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600 appearance-none transition-colors"
            >
              {FOERDERTYPEN.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>

          {/* Reset */}
          {(suche || bundesland || typ) && (
            <button
              onClick={() => {
                setSuche("")
                setBundesland("")
                setTyp("")
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Ergebnisse */}
      {loading && ergebnisse.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          <span>Lade Förderprogramme…</span>
        </div>
      ) : ergebnisse.length === 0 && gestartet ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">Keine Förderprogramme gefunden</p>
          <p className="text-zinc-600 text-sm mt-1">Versuche andere Suchbegriffe oder entferne Filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ergebnisse.map((prog) => (
            <ProgrammKarte
              key={prog.id}
              prog={prog}
              onKlick={() => setAusgewaehlt(prog)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {ausgewaehlt && (
        <DetailModal prog={ausgewaehlt} onClose={() => setAusgewaehlt(null)} />
      )}
    </div>
  )
}
