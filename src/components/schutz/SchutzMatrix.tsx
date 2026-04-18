"use client"

import { useState, useEffect } from "react"
import { Shield, Sun, Snowflake, AlertTriangle, Check, X, Info } from "lucide-react"

// KF-1: Schutzmaßnahmen-Matrix saisonabhängig
// Zeigt Schutzmaßnahmen pro Fläche mit Saison-Empfehlungen

interface Flaeche {
  id: string
  standort?: string
  flaeche_ha?: string
  forstamt?: string
  revier?: string
}

interface SchutzMassnahme {
  id: string
  typ: "verbissschutz" | "fegeschutz" | "wuchshuellen" | "drahthosen" | "zaun" | "einzelschutz"
  status: "geplant" | "aktiv" | "abgeschlossen" | "nicht_erforderlich"
  details?: {
    anzahl?: number
    hoehe?: string
    material?: string
    zustand?: "gut" | "beschaedigt" | "erneuerung_noetig"
  }
}

interface SchutzMatrixProps {
  flaechen: Flaeche[]
  schutzMassnahmen?: Record<string, SchutzMassnahme[]> // flaecheId -> Massnahmen
  onChange?: (flaecheId: string, massnahmen: SchutzMassnahme[]) => void
  readOnly?: boolean
}

// Schutztypen mit Saisonempfehlungen
const SCHUTZ_TYPEN = [
  {
    id: "verbissschutz",
    label: "Verbissschutz",
    icon: "🦌",
    sommerPrio: "mittel",
    winterPrio: "hoch",
    beschreibung: "Schutz vor Wildverbiss an Trieben",
  },
  {
    id: "fegeschutz",
    label: "Fegeschutz",
    icon: "🌲",
    sommerPrio: "hoch",
    winterPrio: "niedrig",
    beschreibung: "Schutz vor Schäden durch fegendes Wild",
  },
  {
    id: "wuchshuellen",
    label: "Wuchshüllen",
    icon: "🛡️",
    sommerPrio: "hoch",
    winterPrio: "mittel",
    beschreibung: "Röhren zum Schutz junger Pflanzen",
  },
  {
    id: "drahthosen",
    label: "Drahthosen",
    icon: "🔗",
    sommerPrio: "mittel",
    winterPrio: "hoch",
    beschreibung: "Drahtschutz gegen Nager und Wild",
  },
  {
    id: "zaun",
    label: "Wildschutzzaun",
    icon: "🚧",
    sommerPrio: "mittel",
    winterPrio: "mittel",
    beschreibung: "Flächenschutz durch Einzäunung",
  },
  {
    id: "einzelschutz",
    label: "Einzelbaumschutz",
    icon: "🌱",
    sommerPrio: "niedrig",
    winterPrio: "hoch",
    beschreibung: "Individueller Schutz wertvoller Bäume",
  },
] as const

// Bestimme aktuelle Saison
function getCurrentSeason(): "sommer" | "winter" {
  const month = new Date().getMonth() + 1 // 1-12
  // Sommerhalbjahr: April - September (4-9)
  // Winterhalbjahr: Oktober - März (10-12, 1-3)
  return month >= 4 && month <= 9 ? "sommer" : "winter"
}

// Prio-Farben
const PRIO_COLORS = {
  hoch: "text-red-700 bg-red-100",
  mittel: "text-amber-800 bg-amber-100",
  niedrig: "text-emerald-700 bg-emerald-100",
}

// Status-Farben
const STATUS_COLORS = {
  geplant: "bg-blue-100 text-blue-800",
  aktiv: "bg-emerald-100 text-emerald-800",
  abgeschlossen: "bg-gray-100 text-gray-700",
  nicht_erforderlich: "bg-zinc-700/20 text-zinc-500",
}

const STATUS_LABELS = {
  geplant: "Geplant",
  aktiv: "Aktiv",
  abgeschlossen: "Abgeschlossen",
  nicht_erforderlich: "Nicht erforderlich",
}

export function SchutzMatrix({
  flaechen,
  schutzMassnahmen = {},
  onChange,
  readOnly = false,
}: SchutzMatrixProps) {
  const [currentSeason] = useState(getCurrentSeason())
  const [expandedFlaeche, setExpandedFlaeche] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(false)

  // Lokaler State für Massnahmen
  const [localMassnahmen, setLocalMassnahmen] = useState(schutzMassnahmen)

  useEffect(() => {
    setLocalMassnahmen(schutzMassnahmen)
  }, [schutzMassnahmen])

  const getSchutzStatus = (flaecheId: string, schutzTyp: string): SchutzMassnahme | undefined => {
    return localMassnahmen[flaecheId]?.find((m) => m.typ === schutzTyp)
  }

  const toggleSchutz = (flaecheId: string, schutzTyp: string) => {
    if (readOnly) return

    const current = getSchutzStatus(flaecheId, schutzTyp)
    const flaecheMassnahmen = localMassnahmen[flaecheId] || []

    let newMassnahmen: SchutzMassnahme[]

    if (!current) {
      // Neu hinzufügen als geplant
      newMassnahmen = [
        ...flaecheMassnahmen,
        {
          id: `${flaecheId}-${schutzTyp}`,
          typ: schutzTyp as SchutzMassnahme["typ"],
          status: "geplant",
        },
      ]
    } else if (current.status === "nicht_erforderlich") {
      // Entfernen
      newMassnahmen = flaecheMassnahmen.filter((m) => m.typ !== schutzTyp)
    } else {
      // Status rotieren: geplant -> aktiv -> abgeschlossen -> nicht_erforderlich
      const statusOrder: SchutzMassnahme["status"][] = ["geplant", "aktiv", "abgeschlossen", "nicht_erforderlich"]
      const currentIndex = statusOrder.indexOf(current.status)
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
      
      newMassnahmen = flaecheMassnahmen.map((m) =>
        m.typ === schutzTyp ? { ...m, status: nextStatus } : m
      )
    }

    const newLocalMassnahmen = { ...localMassnahmen, [flaecheId]: newMassnahmen }
    setLocalMassnahmen(newLocalMassnahmen)
    onChange?.(flaecheId, newMassnahmen)
  }

  return (
    <div className="space-y-4">
      {/* Header mit Saison-Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-medium text-white">Schutzmaßnahmen-Matrix</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Aktuelle Saison */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              currentSeason === "sommer" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
            }`}
          >
            {currentSeason === "sommer" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Snowflake className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {currentSeason === "sommer" ? "Sommerhalbjahr" : "Winterhalbjahr"}
            </span>
          </div>

          {/* Legende Toggle */}
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <Info className="w-4 h-4" />
            Legende
          </button>
        </div>
      </div>

      {/* Legende */}
      {showLegend && (
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
          <div className="text-xs text-zinc-500 font-medium">Priorität nach Saison:</div>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(PRIO_COLORS).map(([prio, color]) => (
              <div key={prio} className={`flex items-center gap-2 px-2 py-1 rounded ${color}`}>
                <span className="text-xs capitalize">{prio}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-2">Status:</div>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className={`flex items-center gap-2 px-2 py-1 rounded ${color}`}>
                <span className="text-xs">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            💡 Klicken Sie auf eine Zelle, um den Status zu ändern
          </div>
        </div>
      )}

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-3 py-2 text-zinc-500 font-medium min-w-[150px]">Fläche</th>
              {SCHUTZ_TYPEN.map((schutz) => {
                const prio = currentSeason === "sommer" ? schutz.sommerPrio : schutz.winterPrio
                return (
                  <th key={schutz.id} className="text-center px-2 py-2 min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{schutz.icon}</span>
                      <span className="text-xs text-zinc-400">{schutz.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIO_COLORS[prio]}`}>
                        {prio}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {flaechen.length === 0 ? (
              <tr>
                <td colSpan={SCHUTZ_TYPEN.length + 1} className="text-center py-8 text-zinc-600">
                  Keine Flächen vorhanden
                </td>
              </tr>
            ) : (
              flaechen.map((flaeche) => (
                <tr
                  key={flaeche.id}
                  className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors"
                >
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {flaeche.standort || `Fläche ${flaeche.id.slice(0, 6)}`}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {flaeche.flaeche_ha ? `${flaeche.flaeche_ha} ha` : ""}
                        {flaeche.forstamt && ` • ${flaeche.forstamt}`}
                      </span>
                    </div>
                  </td>
                  {SCHUTZ_TYPEN.map((schutz) => {
                    const massnahme = getSchutzStatus(flaeche.id, schutz.id)
                    const status = massnahme?.status
                    
                    return (
                      <td key={schutz.id} className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSchutz(flaeche.id, schutz.id)}
                          disabled={readOnly}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            !status
                              ? "bg-[#1e1e1e] text-zinc-600 hover:bg-[#2a2a2a]"
                              : STATUS_COLORS[status]
                          } ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                          title={status ? STATUS_LABELS[status] : "Nicht gesetzt"}
                        >
                          {status === "aktiv" && <Check className="w-4 h-4" />}
                          {status === "abgeschlossen" && <Check className="w-4 h-4" />}
                          {status === "geplant" && <span className="text-xs">📋</span>}
                          {status === "nicht_erforderlich" && <X className="w-4 h-4" />}
                          {!status && <span className="text-xs">—</span>}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Saisonale Empfehlungen */}
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-white mb-1">
              Saisonale Empfehlung ({currentSeason === "sommer" ? "April–September" : "Oktober–März"})
            </div>
            <div className="text-xs text-zinc-400 space-y-1">
              {currentSeason === "sommer" ? (
                <>
                  <p>• <strong>Fegeschutz</strong> und <strong>Wuchshüllen</strong> haben hohe Priorität</p>
                  <p>• Regelmäßige Kontrolle auf Beschädigungen durch Sommerstürme</p>
                  <p>• Verbissschäden dokumentieren für Winterplanung</p>
                </>
              ) : (
                <>
                  <p>• <strong>Verbissschutz</strong> und <strong>Einzelbaumschutz</strong> haben hohe Priorität</p>
                  <p>• Zäune auf Schneebruch kontrollieren</p>
                  <p>• Drahthosen gegen Mäuse und Feldhasen prüfen</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchutzMatrix
