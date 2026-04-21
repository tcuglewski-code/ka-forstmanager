// @ts-nocheck
"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  MapPin, Phone, Mail, ExternalLink, Database, Star,
  Calendar, ClipboardList, Cloud, Eye, Leaf, Video
} from "lucide-react"
import { WetterTab } from "./WetterTab"
import { MediaViewer } from "@/components/saatguternte/MediaViewer"

interface Ernte {
  id: string
  saison: number
  datum: string
  baumart: string
  mengeKgGesamt: number | null
  positionen: { sammlerName: string }[]
}

interface FlaechenProfil {
  id: string
  status: string
  bewertung: number | null
  notizen: string | null
  letzteInspektion: string | null
  naechsteErnte: string | null
}

interface Flaeche {
  id: string
  registerNr: string
  bundesland: string
  baumart: string
  baumartWiss: string | null
  baumartCode: string | null
  kategorie: string | null
  ausgangsmaterial: string | null
  herkunftsgebiet: string | null
  flaecheHa: number | null
  flaecheRedHa: number | null
  hoeheVon: number | null
  hoeheBis: number | null
  zulassungVon: string | null
  zulassungBis: string | null
  zulassungBisText: string | null
  erstesJahr: number | null
  alter: string | null
  forstamt: string | null
  revier: string | null
  landkreis: string | null
  wuchsbezirk: string | null
  besitzart: string | null
  eigentumsart: string | null
  latDez: number | null
  lonDez: number | null
  koordinatenRaw: string | null
  ansprechpartner: string | null
  ansprechpartnerTel: string | null
  ansprechpartnerEmail: string | null
  hoheitlicheStelle: string | null
  verwendungszweck: string | null
  genetischUntersucht: boolean
  verkehrsbeschraenkung: boolean
  zulaessigeFlaechen: string | null
  zugelassen: boolean
  datenstand: string | null
  letzteAktualisierung: string | null
  quelleUrl: string | null
  rohdaten: unknown
  quelle: {
    name: string
    kuerzel: string
    bundeslaender: string[]
    baseUrl: string | null
  }
  profil: FlaechenProfil | null
  ernten: Ernte[]
  osmUrl: string | null
}

type Tab = "uebersicht" | "profil" | "erntehistorie" | "wetter" | "medien"

function formatDatum(d: string | null): string {
  if (!d) return "–"
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="text-xl transition-colors"
        >
          <Star
            className={`w-6 h-6 ${
              i <= (hover || value) ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function ProfilTab({
  flaecheId,
  initialProfil,
}: {
  flaecheId: string
  initialProfil: FlaechenProfil | null
}) {
  const [status, setStatus] = useState(initialProfil?.status ?? "ungeprüft")
  const [bewertung, setBewertung] = useState(initialProfil?.bewertung ?? 0)
  const [notizen, setNotizen] = useState(initialProfil?.notizen ?? "")
  const [letzteInspektion, setLetzteInspektion] = useState(
    initialProfil?.letzteInspektion
      ? new Date(initialProfil.letzteInspektion).toISOString().split("T")[0]
      : ""
  )
  const [naechsteErnte, setNaechsteErnte] = useState(
    initialProfil?.naechsteErnte
      ? new Date(initialProfil.naechsteErnte).toISOString().split("T")[0]
      : ""
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/saatguternte/register/${flaecheId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          bewertung: bewertung > 0 ? bewertung : null,
          notizen: notizen || null,
          letzteInspektion: letzteInspektion || null,
          naechsteErnte: naechsteErnte || null,
        }),
      })
      if (!res.ok) throw new Error("Speichern fehlgeschlagen")
      toast.success("Profil gespeichert")
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  const statusOptions = [
    { value: "ungeprüft", label: "Ungeprüft", color: "text-zinc-400" },
    { value: "geeignet", label: "Geeignet", color: "text-emerald-400" },
    { value: "geprüft", label: "Geprüft", color: "text-blue-400" },
    { value: "verworfen", label: "Verworfen", color: "text-red-400" },
    { value: "interessant", label: "Interessant", color: "text-yellow-400" },
    { value: "geplant", label: "Geplant", color: "text-purple-400" },
    { value: "aktiv", label: "Aktiv", color: "text-green-400" },
    { value: "nicht_geeignet", label: "Nicht geeignet", color: "text-red-400" },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-[#161616] border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-5">
          Profil & Scout-Bewertung
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Status */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-border rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bewertung */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Bewertung</label>
            <StarRating value={bewertung} onChange={setBewertung} />
            {bewertung > 0 && (
              <button
                type="button"
                onClick={() => setBewertung(0)}
                className="mt-1 text-xs text-zinc-600 hover:text-zinc-400"
              >
                Zurücksetzen
              </button>
            )}
          </div>

          {/* Letzte Inspektion */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Letzte Inspektion</label>
            <input
              type="date"
              value={letzteInspektion}
              onChange={(e) => setLetzteInspektion(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-border rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Nächste Ernte */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Nächste geplante Ernte</label>
            <input
              type="date"
              value={naechsteErnte}
              onChange={(e) => setNaechsteErnte(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-border rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Notizen */}
        <div className="mt-5">
          <label className="block text-xs text-zinc-500 mb-2">Interne Notizen</label>
          <textarea
            value={notizen}
            onChange={(e) => setNotizen(e.target.value)}
            rows={5}
            placeholder="Beobachtungen, Hinweise, Scout-Notizen..."
            className="w-full bg-[#1e1e1e] border border-border rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
        >
          {saving ? "Speichern..." : "💾 Profil speichern"}
        </button>
      </div>
    </div>
  )
}

function ErntehistorieTab({ ernten }: { ernten: Ernte[] }) {
  if (ernten.length === 0) {
    return (
      <div className="bg-[#161616] border border-border rounded-xl p-10 flex flex-col items-center justify-center text-center">
        <ClipboardList className="w-10 h-10 text-zinc-700 mb-3" />
        <p className="text-zinc-500">Noch keine Ernten für diese Fläche erfasst.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#161616] border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          Erntehistorie ({ernten.length} Einträge)
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-zinc-500 uppercase">
              <th className="px-4 py-3 text-left">Saison</th>
              <th className="px-4 py-3 text-left">Datum</th>
              <th className="px-4 py-3 text-left">Baumart</th>
              <th className="px-4 py-3 text-right">kg gesamt</th>
              <th className="px-4 py-3 text-left">Sammler</th>
            </tr>
          </thead>
          <tbody>
            {ernten.map((ernte) => (
              <tr key={ernte.id} className="border-b border-border hover:bg-[#1a1a1a] transition-colors">
                <td className="px-4 py-3 text-zinc-300 font-mono">{ernte.saison}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDatum(ernte.datum)}</td>
                <td className="px-4 py-3 text-zinc-300">{ernte.baumart}</td>
                <td className="px-4 py-3 text-right text-zinc-300">
                  {ernte.mengeKgGesamt != null ? `${ernte.mengeKgGesamt.toFixed(1)} kg` : "–"}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {ernte.positionen.length > 0
                    ? ernte.positionen.map((p) => p.sammlerName).join(", ")
                    : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AnsprechpartnerBlock({ flaeche }: { flaeche: Flaeche }) {
  const hasContact =
    flaeche.ansprechpartner != null ||
    flaeche.ansprechpartnerTel != null ||
    flaeche.ansprechpartnerEmail != null
  if (!hasContact) return null
  return (
    <div className="bg-[#161616] border border-border rounded-xl p-4">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Ansprechpartner</h2>
      <div className="space-y-2 text-sm">
        {flaeche.ansprechpartner != null && (
          <div className="text-zinc-300">{flaeche.ansprechpartner}</div>
        )}
        {flaeche.hoheitlicheStelle != null && (
          <div className="text-zinc-500 text-xs">{flaeche.hoheitlicheStelle}</div>
        )}
        {flaeche.ansprechpartnerTel != null && (
          <a
            href={`tel:${flaeche.ansprechpartnerTel}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {flaeche.ansprechpartnerTel}
          </a>
        )}
        {flaeche.ansprechpartnerEmail != null && (
          <a
            href={`mailto:${flaeche.ansprechpartnerEmail}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            {flaeche.ansprechpartnerEmail}
          </a>
        )}
      </div>
    </div>
  )
}

export function FlaecheDetailTabs({ flaeche, initialTab }: { flaeche: Flaeche; initialTab?: string }) {
  const validTabs: Tab[] = ["uebersicht", "profil", "erntehistorie", "wetter", "medien"]
  const startTab: Tab = validTabs.includes(initialTab as Tab) ? (initialTab as Tab) : "uebersicht"
  const [activeTab, setActiveTab] = useState<Tab>(startTab)

  const lat = flaeche.latDez
  const lon = flaeche.lonDez
  const hasKoord = lat != null && lon != null

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "uebersicht", label: "Übersicht", icon: <Eye className="w-3.5 h-3.5" /> },
    { id: "profil", label: "Profil & Scout", icon: <Leaf className="w-3.5 h-3.5" /> },
    { id: "erntehistorie", label: "Erntehistorie", icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: "wetter", label: "Wetter", icon: <Cloud className="w-3.5 h-3.5" /> },
    { id: "medien", label: "🎥 Medien", icon: <Video className="w-3.5 h-3.5" /> },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-[#161616] border border-border rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1e1e1e]"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "uebersicht" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Linke Spalte */}
          <div className="space-y-6">
            {/* Grunddaten */}
            <div className="bg-[#161616] border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Grunddaten</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ["Register-Nr", flaeche.registerNr],
                  ["Bundesland", flaeche.bundesland],
                  ["Baumart", flaeche.baumart],
                  ["Baumart wiss.", flaeche.baumartWiss ?? "–"],
                  ["Baumart-Code", flaeche.baumartCode ?? "–"],
                  ["Kategorie", flaeche.kategorie ?? "–"],
                  ["Ausgangsmaterial", flaeche.ausgangsmaterial ?? "–"],
                  ["Herkunftsgebiet", flaeche.herkunftsgebiet ?? "–"],
                  ["Fläche gesamt (ha)", flaeche.flaecheHa?.toFixed(2) ?? "–"],
                  ["Fläche reduziert (ha)", flaeche.flaecheRedHa?.toFixed(2) ?? "–"],
                  ["Höhe von", flaeche.hoeheVon ? `${flaeche.hoeheVon} m` : "–"],
                  ["Höhe bis", flaeche.hoeheBis ? `${flaeche.hoeheBis} m` : "–"],
                  ["Zulassung von", formatDatum(flaeche.zulassungVon)],
                  ["Zulassung bis", flaeche.zulassungBisText ?? formatDatum(flaeche.zulassungBis)],
                  ["Erstes Jahr", flaeche.erstesJahr?.toString() ?? "–"],
                  ["Alter", flaeche.alter ?? "–"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-zinc-600 text-xs">{label}</dt>
                    <dd className="text-zinc-300 mt-0.5">{value}</dd>
                  </div>
                ))}
              </div>
            </div>

            {/* Standort */}
            <div className="bg-[#161616] border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Standort</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                {[
                  ["Forstamt", flaeche.forstamt ?? "–"],
                  ["Revier", flaeche.revier ?? "–"],
                  ["Landkreis", flaeche.landkreis ?? "–"],
                  ["Wuchsbezirk", flaeche.wuchsbezirk ?? "–"],
                  ["Besitzart", flaeche.besitzart ?? "–"],
                  ["Eigentumsart", flaeche.eigentumsart ?? "–"],
                  ["Koordinaten", hasKoord ? `${lat?.toFixed(4)}°N, ${lon?.toFixed(4)}°O` : "–"],
                  ["Koordinaten (roh)", flaeche.koordinatenRaw ?? "–"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-zinc-600 text-xs">{label}</dt>
                    <dd className="text-zinc-300 mt-0.5">{value}</dd>
                  </div>
                ))}
              </div>

              {flaeche.osmUrl && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">OpenStreetMap</span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                    >
                      Vollbild <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <iframe
                    src={flaeche.osmUrl}
                    className="w-full h-64 rounded-lg border border-border"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Rechte Spalte */}
          <div className="space-y-4">
            {/* Quelle */}
            <div className="bg-[#161616] border border-border rounded-xl p-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Registerquelle</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <dt className="text-zinc-600 text-xs">Name</dt>
                  <dd className="text-zinc-300">{flaeche.quelle.name}</dd>
                </div>
                <div>
                  <dt className="text-zinc-600 text-xs">Kürzel</dt>
                  <dd>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                      {flaeche.quelle.kuerzel}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-600 text-xs">Bundesländer</dt>
                  <dd className="text-zinc-300 text-xs">{flaeche.quelle.bundeslaender.join(", ")}</dd>
                </div>
                {flaeche.quelle.baseUrl && (
                  <div>
                    <a
                      href={flaeche.quelle.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                    >
                      Zur Quelle <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {flaeche.quelleUrl && (
                  <div>
                    <a
                      href={flaeche.quelleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1 break-all"
                    >
                      Direktlink <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                )}
                <div>
                  <dt className="text-zinc-600 text-xs">Datenstand</dt>
                  <dd className="text-zinc-400 text-xs">
                    {flaeche.datenstand ?? formatDatum(flaeche.letzteAktualisierung)}
                  </dd>
                </div>
              </div>
            </div>

            {/* Ansprechpartner */}
            {(flaeche.ansprechpartner != null || flaeche.ansprechpartnerTel != null || flaeche.ansprechpartnerEmail != null) ? (
              <div className="bg-[#161616] border border-border rounded-xl p-4">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Ansprechpartner</h2>
                <div className="space-y-2 text-sm">
                  {flaeche.ansprechpartner != null ? <div className="text-zinc-300">{flaeche.ansprechpartner}</div> : null}
                  {flaeche.hoheitlicheStelle != null ? <div className="text-zinc-500 text-xs">{flaeche.hoheitlicheStelle}</div> : null}
                  {flaeche.ansprechpartnerTel != null ? (
                    <a href={`tel:${flaeche.ansprechpartnerTel}`} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs">
                      <Phone className="w-3.5 h-3.5" />{flaeche.ansprechpartnerTel}
                    </a>
                  ) : null}
                  {flaeche.ansprechpartnerEmail != null ? (
                    <a href={`mailto:${flaeche.ansprechpartnerEmail}`} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs">
                      <Mail className="w-3.5 h-3.5" />{flaeche.ansprechpartnerEmail}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Weitere Angaben */}
            <div className="bg-[#161616] border border-border rounded-xl p-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Weitere Angaben</h2>
              <div className="space-y-2 text-xs">
                {[
                  ["Verwendungszweck", flaeche.verwendungszweck],
                  ["Genetisch untersucht", flaeche.genetischUntersucht ? "Ja" : "Nein"],
                  ["Verkehrsbeschränkung", flaeche.verkehrsbeschraenkung ? "Ja" : "Nein"],
                  ["Zulässige Flächen", flaeche.zulaessigeFlaechen],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label as string}>
                      <dt className="text-zinc-600">{label}</dt>
                      <dd className="text-zinc-400 mt-0.5">{value as string}</dd>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Rohdaten */}
            {flaeche.rohdaten && (
              <div className="bg-[#161616] border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-3.5 h-3.5 text-zinc-600" />
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Rohdaten (JSON)</h2>
                </div>
                <RohdatenInline data={flaeche.rohdaten} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "profil" && (
        <ProfilTab flaecheId={flaeche.id} initialProfil={flaeche.profil} />
      )}

      {activeTab === "erntehistorie" && (
        <ErntehistorieTab ernten={flaeche.ernten} />
      )}

      {activeTab === "wetter" && (
        <WetterTab
          flaecheId={flaeche.id}
          latDez={flaeche.latDez}
          lonDez={flaeche.lonDez}
        />
      )}

      {activeTab === "medien" && (
        <MediaViewer flaecheId={flaeche.id} />
      )}
    </div>
  )
}

function RohdatenInline({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        {open ? "▼ Ausblenden" : "▶ Anzeigen"}
      </button>
      {open && (
        <pre className="mt-2 text-xs text-zinc-600 overflow-x-auto bg-[#111] p-2 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
