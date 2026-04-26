"use client"

import { useState, useEffect } from "react"
import { TreePine, Loader2, Euro, ExternalLink, Save, CheckCircle, MapPin, Ruler, Plus } from "lucide-react"
import { toast } from "sonner"

// AUF-9: PLZ-Prefix → Bundesland Mapping (grob, deckt häufigste Fälle ab)
const PLZ_BUNDESLAND: Record<string, string> = {
  "01": "Sachsen", "02": "Sachsen", "03": "Brandenburg", "04": "Sachsen",
  "06": "Sachsen-Anhalt", "07": "Thüringen", "08": "Sachsen", "09": "Sachsen",
  "10": "Berlin", "12": "Berlin", "13": "Berlin", "14": "Brandenburg",
  "15": "Brandenburg", "16": "Brandenburg", "17": "Mecklenburg-Vorpommern",
  "18": "Mecklenburg-Vorpommern", "19": "Mecklenburg-Vorpommern",
  "20": "Hamburg", "21": "Niedersachsen", "22": "Hamburg", "23": "Schleswig-Holstein",
  "24": "Schleswig-Holstein", "25": "Schleswig-Holstein", "26": "Niedersachsen",
  "27": "Niedersachsen", "28": "Bremen", "29": "Niedersachsen",
  "30": "Niedersachsen", "31": "Niedersachsen", "32": "Nordrhein-Westfalen",
  "33": "Nordrhein-Westfalen", "34": "Hessen", "35": "Hessen", "36": "Hessen",
  "37": "Niedersachsen", "38": "Niedersachsen", "39": "Sachsen-Anhalt",
  "40": "Nordrhein-Westfalen", "41": "Nordrhein-Westfalen", "42": "Nordrhein-Westfalen",
  "44": "Nordrhein-Westfalen", "45": "Nordrhein-Westfalen", "46": "Nordrhein-Westfalen",
  "47": "Nordrhein-Westfalen", "48": "Nordrhein-Westfalen", "49": "Niedersachsen",
  "50": "Nordrhein-Westfalen", "51": "Nordrhein-Westfalen", "52": "Nordrhein-Westfalen",
  "53": "Nordrhein-Westfalen", "54": "Rheinland-Pfalz", "55": "Rheinland-Pfalz",
  "56": "Rheinland-Pfalz", "57": "Nordrhein-Westfalen", "58": "Nordrhein-Westfalen",
  "59": "Nordrhein-Westfalen",
  "60": "Hessen", "61": "Hessen", "63": "Hessen", "64": "Hessen", "65": "Hessen",
  "66": "Saarland", "67": "Rheinland-Pfalz", "68": "Baden-Württemberg",
  "69": "Baden-Württemberg",
  "70": "Baden-Württemberg", "71": "Baden-Württemberg", "72": "Baden-Württemberg",
  "73": "Baden-Württemberg", "74": "Baden-Württemberg", "75": "Baden-Württemberg",
  "76": "Baden-Württemberg", "77": "Baden-Württemberg", "78": "Baden-Württemberg",
  "79": "Baden-Württemberg",
  "80": "Bayern", "81": "Bayern", "82": "Bayern", "83": "Bayern", "84": "Bayern",
  "85": "Bayern", "86": "Bayern", "87": "Bayern", "88": "Baden-Württemberg",
  "89": "Baden-Württemberg",
  "90": "Bayern", "91": "Bayern", "92": "Bayern", "93": "Bayern", "94": "Bayern",
  "95": "Bayern", "96": "Bayern", "97": "Bayern", "98": "Thüringen", "99": "Thüringen",
}

function resolveBundeslandFromPlz(plz: string | null | undefined): string | null {
  if (!plz || plz.length < 2) return null
  return PLZ_BUNDESLAND[plz.substring(0, 2)] ?? null
}

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
  plz?: string | null
}

export function AuftragFoerderCheck({ auftragId, bundesland: bundeslandProp, flaeche_ha, waldtyp, baumarten, plz }: Props) {
  // AUF-9: PLZ-basiertes Bundesland-Fallback
  const [resolvedBundesland, setResolvedBundesland] = useState<string | null>(bundeslandProp)

  useEffect(() => {
    if (bundeslandProp) {
      // Verifiziere Bundesland gegen PLZ wenn beides vorhanden
      if (plz) {
        const plzBundesland = resolveBundeslandFromPlz(plz)
        if (plzBundesland && plzBundesland !== bundeslandProp) {
          console.warn(`[FoerderCheck] Bundesland-Mismatch: Auftrag sagt "${bundeslandProp}", PLZ ${plz} → "${plzBundesland}". Nutze PLZ-Wert.`)
          setResolvedBundesland(plzBundesland)
          return
        }
      }
      setResolvedBundesland(bundeslandProp)
    } else if (plz) {
      const plzBundesland = resolveBundeslandFromPlz(plz)
      if (plzBundesland) {
        setResolvedBundesland(plzBundesland)
      }
    }
  }, [bundeslandProp, plz])

  const bundesland = resolvedBundesland
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
      const res = await fetch("/api/betriebs-assistent/beraten", {
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-violet-100 text-violet-800 border border-violet-200">
            <MapPin className="w-3 h-3" />
            {bundesland}
          </span>
        )}
        {flaeche_ha != null && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Ruler className="w-3 h-3" />
            {flaeche_ha} ha
          </span>
        )}
        {baumarten && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
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
            className="w-full bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-emerald-500/50 resize-none"
          />

          <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] cursor-pointer hover:text-[var(--color-on-surface)] transition-colors">
            <input
              type="checkbox"
              checked={kalamitaet}
              onChange={(e) => setKalamitaet(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-[var(--color-surface-container-low)] text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
            />
            Kalamität / Schaden
          </label>

          <button
            onClick={handlePruefen}
            disabled={loading || !bundesland}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                  {result.meta.ki_synthese ? "KI-Analyse" : "Automatische Analyse"}
                </span>
              </div>
              {result.meta.ki_synthese && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200">
                  KI-generiert
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-line leading-relaxed">
              {result.synthese}
            </p>
          </div>

          {/* Programme-Liste */}
          {result.programme.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                {result.programme.length} passende Programme
              </p>
              <div className="space-y-2">
                {result.programme.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-3 p-3 bg-[var(--color-surface-container-low)] rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-on-surface)] font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-[var(--color-on-surface-variant)]">{p.bundesland || "Bund"}</span>
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
                          className="flex items-center gap-1 text-xs text-[var(--color-on-surface-variant)] hover:text-emerald-400 transition-colors"
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
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-container-highest)] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-[var(--color-on-surface-variant)] hover:text-emerald-400" />
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
                  <p key={i} className="text-xs text-[var(--color-on-surface-variant)]">
                    {k.prog_a_name} + {k.prog_b_name}
                    {k.bedingung && <span className="text-[var(--color-on-surface-variant)]"> — {k.bedingung}</span>}
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
              className="px-4 py-2.5 bg-[var(--color-surface-container-highest)] border border-border rounded-lg text-[var(--color-on-surface-variant)] text-sm hover:bg-[#252525] transition-all"
            >
              Neue Prüfung
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
