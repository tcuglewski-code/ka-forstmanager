"use client"

import { useState } from "react"
import { TreePine, Loader2, Euro, ExternalLink, Save, CheckCircle, MapPin, Ruler, Plus } from "lucide-react"
import { toast } from "sonner"

interface FoerderprogrammResult {
  id: number
  name: string
  bundesland: string | null
  beschreibung: string | null
  foerdersatz: string | null
  url: string | null
  antragsfrist: string | null
}

interface KombinationResult {
  prog_a_name: string
  prog_b_name: string
  bedingung: string | null
}

interface BeratungsResult {
  programme: FoerderprogrammResult[]
  kombinationen: KombinationResult[]
  synthese: string
  meta: {
    bundesland: string | null
    waldtyp: string | null
    flaeche_ha: number | null
    kalamitaet: string | null
    programme_gefunden: number
    ki_synthese: boolean
  }
}

interface Props {
  auftragId: string
  bundesland: string | null
  flaeche_ha: number | null
  waldtyp?: string | null
  baumarten?: string | null
}

export function AuftragFoerderCheck({ auftragId, bundesland, flaeche_ha, waldtyp, baumarten }: Props) {
  const [frage, setFrage] = useState("")
  const [kalamitaet, setKalamitaet] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<BeratungsResult | null>(null)
  const [erfassteAntraege, setErfassteAntraege] = useState<Set<number>>(new Set())

  /**
   * Erfasst einen neuen Antragsverlauf für das angegebene Förderprogramm
   */
  const erfasseAntrag = async (programmId: number) => {
    try {
      const res = await fetch("/api/foerderung/antragsverlauf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programm_id: programmId,
          auftrag_id: auftragId,
          status: "geplant",
        }),
      })

      if (!res.ok) {
        throw new Error("Fehler beim Erfassen")
      }

      setErfassteAntraege((prev) => new Set([...prev, programmId]))
      toast.success("Antrag als 'geplant' erfasst")
    } catch (err) {
      console.error("Antrag erfassen Fehler:", err)
      toast.error("Fehler beim Erfassen des Antrags")
    }
  }

  const handlePruefen = async () => {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/foerderung/beraten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frage: frage || `Förderung für ${baumarten || "Aufforstung"}`,
          bundesland: bundesland || undefined,
          flaeche_ha: flaeche_ha || undefined,
          waldtyp: waldtyp || "privatwald",
          kalamitaet: kalamitaet ? "schaden" : undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = (errData as {error?: string}).error || `Serverfehler (${res.status})`
        throw new Error(msg)
      }

      const data: BeratungsResult = await res.json()
      setResult(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler"
      console.error("Förderprüfung Fehler:", msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSpeichern = async () => {
    if (!result) return

    setSaving(true)

    try {
      // Förderempfehlung als Text formatieren
      const programmeListe = result.programme
        .map((p) => `• ${p.name} (${p.bundesland || "Bund"})${p.foerdersatz ? ` — ${p.foerdersatz}` : ""}`)
        .join("\n")

      const kombinationsHinweise = result.kombinationen.length > 0
        ? `\n\n🔗 Kombinierbar:\n${result.kombinationen.map((k) => `• ${k.prog_a_name} + ${k.prog_b_name}`).join("\n")}`
        : ""

      const empfehlungsText = `📋 Förderempfehlung (${new Date().toLocaleDateString("de-DE")}):\n\n${result.synthese}\n\n🌲 Passende Programme:\n${programmeListe}${kombinationsHinweise}`

      // Via PATCH ans notizen-Feld anhängen
      const auftragRes = await fetch(`/api/auftraege/${auftragId}`)
      if (!auftragRes.ok) throw new Error("Auftrag konnte nicht geladen werden")
      
      const auftrag = await auftragRes.json()
      const bestehendeNotizen = auftrag.notizen || ""
      const neueNotizen = bestehendeNotizen
        ? `${bestehendeNotizen}\n\n---\n\n${empfehlungsText}`
        : empfehlungsText

      const patchRes = await fetch(`/api/auftraege/${auftragId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notizen: neueNotizen }),
      })

      if (!patchRes.ok) throw new Error("Speichern fehlgeschlagen")

      toast.success("Förderempfehlung gespeichert")
      setResult(null)
      setFrage("")
      setKalamitaet(false)
    } catch (err) {
      console.error("Speichern Fehler:", err)
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Vorausgefüllte Auftragsdaten */}
      <div className="flex flex-wrap gap-2">
        {bundesland && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <MapPin className="w-3 h-3" />
            {bundesland}
          </span>
        )}
        {flaeche_ha != null && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Ruler className="w-3 h-3" />
            {flaeche_ha} ha
          </span>
        )}
        {baumarten && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <TreePine className="w-3 h-3" />
            {baumarten}
          </span>
        )}
      </div>

      {/* Freitext + Checkbox */}
      {!result && (
        <>
          <textarea
            value={frage}
            onChange={(e) => setFrage(e.target.value)}
            placeholder="z.B. Kalamitätsfläche nach Borkenkäfer"
            rows={2}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
          />

          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
            <input
              type="checkbox"
              checked={kalamitaet}
              onChange={(e) => setKalamitaet(e.target.checked)}
              className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0f0f0f] text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
            />
            Kalamität / Schaden
          </label>

          <button
            onClick={handlePruefen}
            disabled={loading || !bundesland}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Prüfe Förderprogramme...
              </>
            ) : (
              <>
                <TreePine className="w-4 h-4" />
                Förderung prüfen
              </>
            )}
          </button>

          {!bundesland && (
            <p className="text-xs text-amber-500/80">Bundesland muss im Auftrag gesetzt sein</p>
          )}
        </>
      )}

      {/* Ergebnisanzeige */}
      {result && (
        <div className="space-y-4">
          {/* KI-Synthese */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                {result.meta.ki_synthese ? "KI-Analyse" : "Automatische Analyse"}
              </span>
            </div>
            <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
              {result.synthese}
            </p>
          </div>

          {/* Programme-Liste */}
          {result.programme.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">
                {result.programme.length} passende Programme
              </p>
              <div className="space-y-2">
                {result.programme.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-3 p-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-zinc-500">{p.bundesland || "Bund"}</span>
                        {p.foerdersatz && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <Euro className="w-3 h-3" />
                            {p.foerdersatz}
                          </span>
                        )}
                        {/* Antragsfrist-Hinweis wenn vorhanden */}
                        {p.antragsfrist && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                            📅 Frist: {p.antragsfrist}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Antrag erfassen Button */}
                      {erfassteAntraege.has(p.id) ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          erfasst
                        </span>
                      ) : (
                        <button
                          onClick={() => erfasseAntrag(p.id)}
                          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-emerald-400 transition-colors"
                          title="Antrag als geplant erfassen"
                        >
                          <Plus className="w-3 h-3" />
                          Antrag erfassen
                        </button>
                      )}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-[#1e1e1e] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-zinc-500 hover:text-emerald-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kombinationshinweise */}
          {result.kombinationen.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-2">
                🔗 Kombinierbar
              </p>
              <div className="space-y-1">
                {result.kombinationen.map((k, i) => (
                  <p key={i} className="text-xs text-zinc-400">
                    {k.prog_a_name} + {k.prog_b_name}
                    {k.bedingung && <span className="text-zinc-600"> — {k.bedingung}</span>}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Aktionen */}
          <div className="flex gap-2">
            <button
              onClick={handleSpeichern}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 rounded-lg text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Als Empfehlung speichern
            </button>
            <button
              onClick={() => {
                setResult(null)
                setFrage("")
                setKalamitaet(false)
              }}
              className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-zinc-400 text-sm hover:bg-[#252525] transition-all"
            >
              Neue Prüfung
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
