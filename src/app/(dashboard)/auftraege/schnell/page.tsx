"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Check, Zap, User, Wrench, FileCheck } from "lucide-react"
import { toast } from "sonner"

const DIENSTLEISTUNGEN = [
  { key: "pflanzung", label: "Pflanzung", emoji: "🌱" },
  { key: "kulturschutz", label: "Kulturschutz / Zaunbau", emoji: "🦌" },
  { key: "flaechenvorbereitung", label: "Flächenvorbereitung", emoji: "🏗️" },
  { key: "pflege", label: "Pflege", emoji: "✂️" },
  { key: "saatguternte", label: "Saatguternte", emoji: "🌰" },
]

interface WaldbesitzerSuggestion {
  waldbesitzer: string | null
  waldbesitzerEmail: string | null
  waldbesitzerTelefon: string | null
}

export default function SchnellAuftragPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Step 1: Waldbesitzer
  const [waldbesitzerName, setWaldbesitzerName] = useState("")
  const [flaecheHa, setFlaecheHa] = useState("")
  const [suggestions, setSuggestions] = useState<WaldbesitzerSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)

  // Step 2: Dienstleistungen
  const [selectedDl, setSelectedDl] = useState<string[]>([])

  // Autosuggest
  useEffect(() => {
    if (waldbesitzerName.length < 2) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/waldbesitzer-suggest?name=${encodeURIComponent(waldbesitzerName)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
          setShowSuggestions(data.length > 0)
        }
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(t)
  }, [waldbesitzerName])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const toggleDl = (key: string) => {
    setSelectedDl((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]))
  }

  const canNext = () => {
    if (step === 0) return waldbesitzerName.trim().length > 0 && parseFloat(flaecheHa) > 0
    if (step === 1) return selectedDl.length > 0
    return true
  }

  const submit = async () => {
    setLoading(true)
    try {
      const dlLabel = selectedDl.map((k) => DIENSTLEISTUNGEN.find((d) => d.key === k)?.label || k).join(", ")
      const res = await fetch("/api/auftraege", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: `${dlLabel} — ${waldbesitzerName}`,
          typ: selectedDl[0] || "pflanzung",
          waldbesitzer: waldbesitzerName,
          flaeche_ha: parseFloat(flaecheHa),
          status: "neu",
          beschreibung: `Quick-Auftrag: ${dlLabel}`,
          wizardDaten: { dienstleistungen: selectedDl, quickAuftrag: true },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Fehler")
      }
      const auftrag = await res.json()
      toast.success(`Auftrag ${auftrag.nummer || ""} erstellt!`)
      router.push(`/auftraege/${auftrag.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Erstellen")
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    "w-full border border-border rounded-lg px-4 py-3 text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]"

  const steps = [
    { icon: User, label: "Waldbesitzer" },
    { icon: Wrench, label: "Dienstleistung" },
    { icon: FileCheck, label: "Zusammenfassung" },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]" style={{ fontFamily: "var(--font-display)" }}>
            Schnell-Auftrag
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Auftrag in 3 Schritten erfassen</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon
          const done = i < step
          const active = i === step
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done ? "bg-green-600 text-white" : active ? "bg-amber-600 text-white" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs hidden sm:inline ${active ? "text-[var(--color-on-surface)] font-medium" : "text-[var(--color-on-surface-variant)]"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-[var(--color-surface-container)] rounded-2xl border border-border p-6 min-h-[280px]">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Waldbesitzer & Fläche</h2>
            <div className="relative" ref={suggestRef}>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Waldbesitzer *</label>
              <input
                className={inputCls}
                value={waldbesitzerName}
                onChange={(e) => setWaldbesitzerName(e.target.value)}
                placeholder="Name des Waldbesitzers"
                autoFocus
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface)] border-b border-border/50 last:border-0"
                      onClick={() => {
                        setWaldbesitzerName(s.waldbesitzer || "")
                        setShowSuggestions(false)
                      }}
                    >
                      {s.waldbesitzer}
                      {s.waldbesitzerEmail && <span className="text-xs text-[var(--color-on-surface-variant)] ml-2">{s.waldbesitzerEmail}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Fläche (ha) *</label>
              <input className={inputCls} type="number" step="0.1" min="0.1" value={flaecheHa} onChange={(e) => setFlaecheHa(e.target.value)} placeholder="z.B. 2.5" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Dienstleistungen auswählen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIENSTLEISTUNGEN.map((dl) => {
                const active = selectedDl.includes(dl.key)
                return (
                  <button
                    key={dl.key}
                    onClick={() => toggleDl(dl.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      active
                        ? "border-green-600 bg-green-600/10"
                        : "border-border hover:border-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-highest)]"
                    }`}
                  >
                    <span className="text-2xl">{dl.emoji}</span>
                    <div>
                      <span className={`text-sm font-medium ${active ? "text-green-400" : "text-[var(--color-on-surface)]"}`}>
                        {dl.label}
                      </span>
                      {active && <Check className="w-4 h-4 text-green-500 inline ml-2" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Zusammenfassung</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-[var(--color-on-surface-variant)]">Waldbesitzer</span>
                <span className="text-sm font-medium text-[var(--color-on-surface)]">{waldbesitzerName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-[var(--color-on-surface-variant)]">Fläche</span>
                <span className="text-sm font-medium text-[var(--color-on-surface)]">{flaecheHa} ha</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-[var(--color-on-surface-variant)]">Dienstleistungen</span>
                <span className="text-sm font-medium text-[var(--color-on-surface)]">
                  {selectedDl.map((k) => DIENSTLEISTUNGEN.find((d) => d.key === k)?.label).join(", ")}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-[var(--color-on-surface-variant)]">Datum</span>
                <span className="text-sm font-medium text-[var(--color-on-surface)]">{new Date().toLocaleDateString("de-DE")}</span>
              </div>
            </div>
            <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-3 text-sm text-amber-400">
              Nach dem Anlegen können Sie den Auftrag mit allen Details bearbeiten.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-border text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Zurück
        </button>

        {step < 2 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
          >
            Weiter <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? "Erstelle..." : "Sofort anlegen"} <Zap className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
