"use client"

import { useState } from "react"
import { Star, Save, MapPin, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Flaeche {
  id: string
  registerNr: string
  baumart: string
  forstamt: string | null
  revier: string | null
  bundesland: string
  latDez: number | null
  lonDez: number | null
  flaecheHa: number | null
  hoeheVon: number | null
  hoeheBis: number | null
  profil: {
    status: string
    bewertung: number | null
    notizen: string | null
  } | null
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-3 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i === value ? 0 : i)}
          className="transition-transform active:scale-90"
        >
          <Star
            className={`w-10 h-10 ${
              i <= (hover || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-zinc-700"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: "geeignet", label: "🟢 Geeignet", bg: "bg-emerald-600 hover:bg-emerald-500", active: "ring-emerald-400" },
  { value: "ungeprüft", label: "🟡 Prüfen", bg: "bg-yellow-600 hover:bg-yellow-500", active: "ring-yellow-400" },
  { value: "verworfen", label: "🔴 Ungeeignet", bg: "bg-red-700 hover:bg-red-600", active: "ring-red-400" },
]

export function ScoutClient({ flaeche }: { flaeche: Flaeche }) {
  const [status, setStatus] = useState(flaeche.profil?.status ?? "ungeprüft")
  const [bewertung, setBewertung] = useState(flaeche.profil?.bewertung ?? 0)
  const [notizen, setNotizen] = useState(flaeche.profil?.notizen ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  const hasKoord = flaeche.latDez != null && flaeche.lonDez != null

  async function handleSave() {
    setSaving(true)
    setError(false)
    try {
      const res = await fetch(`/api/saatguternte/register/${flaeche.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          bewertung: bewertung > 0 ? bewertung : null,
          notizen: notizen || null,
        }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError(true)
      setTimeout(() => setError(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Top Bar */}
      <div className="bg-[#161616] border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/saatguternte/register/${flaeche.id}`} className="text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm font-bold text-white truncate">{flaeche.registerNr}</div>
          <div className="text-xs text-zinc-500 truncate">{flaeche.baumart} · {flaeche.bundesland}</div>
        </div>
        {hasKoord && (
          <a
            href={`https://maps.google.com/?q=${flaeche.latDez},${flaeche.lonDez}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>GPS</span>
          </a>
        )}
      </div>

      {/* Flächen-Info */}
      <div className="bg-[#1a1a1a] border-b border-border px-4 py-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Forstamt", flaeche.forstamt ?? "–"],
            ["Revier", flaeche.revier ?? "–"],
            ["Fläche", flaeche.flaecheHa != null ? `${flaeche.flaecheHa.toFixed(2)} ha` : "–"],
            ["Höhe", flaeche.hoeheVon != null ? `${flaeche.hoeheVon}–${flaeche.hoeheBis ?? "?"} m` : "–"],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div className="text-[11px] text-zinc-600 uppercase tracking-wide">{label}</div>
              <div className="text-zinc-300 mt-0.5">{value}</div>
            </div>
          ))}
        </div>
        {hasKoord && (
          <div className="mt-2 text-[11px] font-mono text-zinc-700">
            {flaeche.latDez?.toFixed(5)}°N, {flaeche.lonDez?.toFixed(5)}°O
          </div>
        )}
      </div>

      {/* Scout Form */}
      <div className="flex-1 px-4 py-5 space-y-6">
        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-3">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`py-3 px-2 rounded-xl text-sm font-semibold text-white transition-all ${opt.bg} ${
                  status === opt.value ? `ring-2 ${opt.active} ring-offset-2 ring-offset-[#0f0f0f]` : "opacity-70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bewertung */}
        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-3 text-center">Bewertung</label>
          <StarInput value={bewertung} onChange={setBewertung} />
          {bewertung > 0 && (
            <p className="text-center text-xs text-zinc-600 mt-2">
              {bewertung} von 5 Sternen
              <button
                type="button"
                onClick={() => setBewertung(0)}
                className="ml-2 text-zinc-700 underline"
              >
                zurücksetzen
              </button>
            </p>
          )}
        </div>

        {/* Notizen */}
        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">
            Notizen / Beobachtungen
          </label>
          <textarea
            value={notizen}
            onChange={(e) => setNotizen(e.target.value)}
            rows={6}
            placeholder="z.B. Reife des Saatguts, Zugangssituation, Wetterbeobachtung, Besonderheiten..."
            className="w-full bg-[#1e1e1e] border border-border rounded-xl px-4 py-3 text-base text-zinc-300 focus:outline-none focus:border-emerald-500 resize-none"
            style={{ fontSize: 16 }}
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 bg-[#161616] border-t border-border px-4 py-4 space-y-3">
        {/* Toast messages */}
        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/50 border border-emerald-600/30 rounded-xl text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Profil erfolgreich gespeichert!
          </div>
        )}
        {error && (
          <div className="px-4 py-3 bg-red-900/50 border border-red-600/30 rounded-xl text-red-400 text-sm">
            ❌ Fehler beim Speichern. Bitte erneut versuchen.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Save className="w-5 h-5" />
          {saving ? "Wird gespeichert..." : "💾 Speichern"}
        </button>
      </div>
    </div>
  )
}
