"use client"

/**
 * DOK-033/034: Einstellungen Dokumenten-KI (admin-only).
 * Kill-Switch (NEVER #21) + Routing-Schwellen. Server-seitig erzwingt
 * /api/settings/dokumente-ki die Admin-Rolle.
 */
import { useState, useEffect } from "react"
import { ShieldAlert, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface Settings {
  dok_ki_auto_buchung_aktiv: string
  dok_ki_threshold_high: string
  dok_ki_threshold_low: string
  dok_ki_vier_augen_betrag: string
}

export default function DokumenteKiEinstellungenPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verboten, setVerboten] = useState(false)

  useEffect(() => {
    fetch("/api/settings/dokumente-ki")
      .then(async (res) => {
        if (res.status === 403) {
          setVerboten(true)
          return
        }
        if (!res.ok) throw new Error()
        setSettings(await res.json())
      })
      .catch(() => toast.error("Einstellungen konnten nicht geladen werden"))
      .finally(() => setLoading(false))
  }, [])

  async function speichern() {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings/dokumente-ki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen")
      toast.success("Gespeichert")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-on-surface-variant)]" />
      </div>
    )
  }
  if (verboten || !settings) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-sm text-red-600">
        Keine Berechtigung — diese Seite ist Administratoren vorbehalten.
      </div>
    )
  }

  const autoAktiv = settings.dok_ki_auto_buchung_aktiv === "true"

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
          Dokumenten-KI Einstellungen
        </h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          Kill-Switch und Routing-Schwellen der automatischen Dokumentenverarbeitung
        </p>
      </div>

      {/* Kill-Switch */}
      <div
        className={`border rounded-lg p-4 ${autoAktiv ? "border-amber-300 bg-amber-50" : "bg-card"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--color-on-surface)" }}>
              <ShieldAlert className="w-4 h-4" />
              Automatische Buchung (Kill-Switch)
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
              Standard: <strong>AUS</strong> (Shadow-Mode — alles geht in den Review).
              Nur aktivieren, wenn die Pipeline nachweislich zuverlässig läuft.
              Deaktivierung wirkt sofort, ohne Deploy.
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, dok_ki_auto_buchung_aktiv: autoAktiv ? "false" : "true" })
            }
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
              autoAktiv ? "bg-amber-500" : "bg-slate-300"
            }`}
            aria-label="Auto-Buchung umschalten"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                autoAktiv ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {autoAktiv && (
          <p className="text-xs text-amber-800 mt-2 font-medium">
            ⚠ Auto-Buchung wird nach dem Speichern aktiv. Dokumente mit hoher Konfidenz werden ohne
            manuellen Review gebucht.
          </p>
        )}
      </div>

      {/* Schwellen */}
      <div className="border rounded-lg bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
          Routing-Schwellen
        </h2>
        {[
          {
            key: "dok_ki_threshold_high" as const,
            label: "Auto-Buchung ab Konfidenz",
            hint: "Dokumente ab dieser Gesamt-Konfidenz qualifizieren für Auto-Buchung (Default 0.85)",
            min: 0.5,
            max: 1,
            step: 0.01,
          },
          {
            key: "dok_ki_threshold_low" as const,
            label: "Ablehnung unter Konfidenz",
            hint: "Darunter wird das Dokument als unzuverlässig markiert (Default 0.60)",
            min: 0,
            max: 0.85,
            step: 0.01,
          },
          {
            key: "dok_ki_vier_augen_betrag" as const,
            label: "Vier-Augen-Grenze (€ brutto)",
            hint: "Ab diesem Betrag immer manueller Review, unabhängig von der Konfidenz (Default 500)",
            min: 0,
            max: 1000000,
            step: 50,
          },
        ].map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium" style={{ color: "var(--color-on-surface)" }}>
              {f.label}
            </label>
            <input
              type="number"
              min={f.min}
              max={f.max}
              step={f.step}
              value={settings[f.key]}
              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-transparent"
            />
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <button
        onClick={speichern}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Speichern
      </button>
    </div>
  )
}
