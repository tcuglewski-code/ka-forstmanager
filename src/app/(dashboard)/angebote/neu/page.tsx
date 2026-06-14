"use client"

/**
 * A1 — KI-Angebot erstellen (ANG-027)
 * Freitext/Wizard/E-Mail → POST /api/angebote/generieren → Weiterleitung
 * zum Entwurf. Kill-Switch (503) wird als Hinweis angezeigt.
 */
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, Loader2, AlertTriangle } from "lucide-react"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

type InputTyp = "freitext" | "wizard" | "email"

export default function NeuesKiAngebotPage() {
  const router = useRouter()
  const [inputTyp, setInputTyp] = useState<InputTyp>("freitext")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [killSwitch, setKillSwitch] = useState(false)

  async function generieren() {
    if (!text.trim()) {
      toast.error("Bitte Anfragetext eingeben")
      return
    }
    setLoading(true)
    setKillSwitch(false)
    try {
      const res = await fetch("/api/angebote/generieren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roheAnfrage: text, inputTyp }),
      })
      if (res.status === 503) {
        setKillSwitch(true)
        toast.error("KI-Angebotsgenerierung ist deaktiviert")
        return
      }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error ?? "Fehler bei der Generierung")
        return
      }
      const data = await res.json()
      toast.success("KI-Entwurf erstellt")
      router.push(`/angebote/${data.angebotId}`)
    } catch {
      toast.error("Netzwerkfehler")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Breadcrumb items={[{ label: "Angebote", href: "/angebote" }, { label: "KI-Angebot" }]} />

      <div className="flex items-center gap-3">
        <Sparkles className="w-7 h-7" style={{ color: "#C5A55A" }} />
        <h1 className="text-2xl font-bold" style={{ color: "#2C3A1C" }}>
          KI-Angebot erstellen
        </h1>
      </div>

      {killSwitch && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">KI-Angebotsgenerierung ist deaktiviert</p>
            <p className="text-sm">
              Ein Administrator kann sie unter <span className="font-mono">/admin/preisbuch → Einstellungen</span> aktivieren.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Eingabeart</label>
        <div className="flex gap-2">
          {(["freitext", "wizard", "email"] as InputTyp[]).map((t) => (
            <button
              key={t}
              onClick={() => setInputTyp(t)}
              className={`px-4 py-2 rounded-lg text-sm border transition ${
                inputTyp === t ? "text-white border-transparent" : "bg-white text-gray-700 border-gray-300"
              }`}
              style={inputTyp === t ? { backgroundColor: "#2C3A1C" } : undefined}
            >
              {t === "freitext" ? "Freitext" : t === "wizard" ? "Wizard-JSON" : "E-Mail"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Anfrage</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="z.B. Erstaufforstung von 3 ha mit Stiel-Eiche und Buche im Raum Kassel, hängiges Gelände, Wildschutzzaun gewünscht…"
          className="w-full rounded-lg border border-gray-300 p-3 text-sm font-mono focus:outline-none focus:ring-2"
          style={{ ["--tw-ring-color" as string]: "#C5A55A" }}
        />
      </div>

      <button
        onClick={generieren}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium disabled:opacity-60"
        style={{ backgroundColor: "#2C3A1C" }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {loading ? "Generiere…" : "Angebot generieren"}
      </button>

      <p className="text-xs text-gray-500">
        Der Entwurf wird automatisch berechnet und muss von einem GF/Admin geprüft und freigegeben
        werden, bevor er versendet werden kann.
      </p>
    </div>
  )
}
