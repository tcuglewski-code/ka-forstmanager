"use client"

import { useState, useEffect } from "react"
import { 
  GitBranch, ChevronDown, ChevronUp, User, Clock, 
  FileText, Loader2, ArrowRight, Eye, EyeOff,
  DollarSign, Percent, Hash, Calendar, MessageSquare
} from "lucide-react"

interface VersionPosition {
  id: string
  beschreibung: string
  menge: number
  einheit: string
  preisProEinheit: number
  gesamt: number
  typ: string
}

interface Version {
  id: string
  versionNummer: number
  createdAt: string
  erstelltVon: string
  aenderungsgrund: string | null
  nummer: string
  betrag: number
  mwst: number
  status: string
  rechnungsDatum: string
  faelligAm: string | null
  nettoBetrag: number | null
  bruttoBetrag: number | null
  rabatt: number | null
  rabattBetrag: number | null
  rabattGrund: string | null
  zahlungsBedingung: string | null
  notizen: string | null
  positionen: VersionPosition[] | null
}

interface VersionsResponse {
  rechnungId: string
  rechnungNummer: string
  currentVersion: number
  totalVersions: number
  versions: Version[]
}

interface VersionsSectionProps {
  rechnungId: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  'entwurf': { label: 'Entwurf', color: 'text-zinc-400' },
  'offen': { label: 'Offen', color: 'text-amber-400' },
  'versendet': { label: 'Versendet', color: 'text-blue-400' },
  'freigegeben': { label: 'Freigegeben', color: 'text-emerald-400' },
  'bezahlt': { label: 'Bezahlt', color: 'text-emerald-400' },
  'storniert': { label: 'Storniert', color: 'text-red-400' },
  'ueberfaellig': { label: 'Überfällig', color: 'text-red-400' },
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '–'
  try {
    return new Date(value).toLocaleDateString('de-DE')
  } catch {
    return value
  }
}

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

// Diff-Berechnung zwischen zwei Versionen
function calculateDiff(current: Version, previous: Version | null): Array<{
  field: string
  label: string
  oldValue: string
  newValue: string
}> {
  if (!previous) return []
  
  const diffs: Array<{ field: string; label: string; oldValue: string; newValue: string }> = []
  
  const fields: Array<{ key: keyof Version; label: string; format?: (v: any) => string }> = [
    { key: 'status', label: 'Status', format: (v) => statusLabels[v]?.label || v },
    { key: 'betrag', label: 'Betrag', format: formatCurrency },
    { key: 'nettoBetrag', label: 'Netto', format: formatCurrency },
    { key: 'bruttoBetrag', label: 'Brutto', format: formatCurrency },
    { key: 'rabatt', label: 'Rabatt (%)', format: (v) => v ? `${v}%` : '–' },
    { key: 'rabattBetrag', label: 'Rabattbetrag', format: formatCurrency },
    { key: 'rabattGrund', label: 'Rabattgrund' },
    { key: 'faelligAm', label: 'Fällig am', format: formatDate },
    { key: 'zahlungsBedingung', label: 'Zahlungsbedingung' },
    { key: 'notizen', label: 'Notizen' },
    { key: 'mwst', label: 'MwSt.', format: (v) => `${v}%` },
  ]
  
  for (const f of fields) {
    const oldVal = previous[f.key]
    const newVal = current[f.key]
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({
        field: f.key,
        label: f.label,
        oldValue: f.format ? f.format(oldVal) : String(oldVal ?? '–'),
        newValue: f.format ? f.format(newVal) : String(newVal ?? '–'),
      })
    }
  }
  
  // Positionen-Diff (vereinfacht: Anzahl und Summe)
  const prevPositionen = previous.positionen || []
  const currPositionen = current.positionen || []
  
  if (prevPositionen.length !== currPositionen.length) {
    diffs.push({
      field: 'positionen',
      label: 'Positionen',
      oldValue: `${prevPositionen.length} Positionen`,
      newValue: `${currPositionen.length} Positionen`,
    })
  }
  
  return diffs
}

export default function VersionsSection({ rechnungId }: VersionsSectionProps) {
  const [data, setData] = useState<VersionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(true)

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true)
      try {
        const res = await fetch(`/api/rechnungen/${rechnungId}/versions`)
        if (!res.ok) {
          throw new Error('Fehler beim Laden')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError('Fehler beim Laden der Versionen')
      } finally {
        setLoading(false)
      }
    }
    fetchVersions()
  }, [rechnungId])

  if (loading) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Lade Versionshistorie...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center gap-3 text-red-400">
          <GitBranch className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!data || data.versions.length === 0) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-zinc-500" />
          <h3 className="text-sm text-zinc-500 uppercase tracking-wider">Versionshistorie</h3>
        </div>
        <p className="text-zinc-500 text-sm mt-3">
          Noch keine Versionen. Versionen werden bei Änderungen automatisch erstellt.
        </p>
      </div>
    )
  }

  const displayVersions = expanded ? data.versions : data.versions.slice(0, 3)
  const selectedVersionData = selectedVersion 
    ? data.versions.find(v => v.id === selectedVersion) 
    : null

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm text-zinc-500 uppercase tracking-wider">
            Versionshistorie
          </h3>
          <span className="px-2 py-0.5 bg-[#222] border border-[#333] text-zinc-400 text-xs rounded-full">
            {data.totalVersions} Versionen
          </span>
        </div>
        <button
          onClick={() => setShowDiff(!showDiff)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            showDiff 
              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
              : 'bg-[#222] border border-[#333] text-zinc-400 hover:text-white'
          }`}
        >
          {showDiff ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Diff {showDiff ? 'an' : 'aus'}
        </button>
      </div>

      {/* Version Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-[#2a2a2a]" />
        
        <div className="space-y-4">
          {displayVersions.map((version, index) => {
            const previousVersion = data.versions[index + 1] || null
            const diffs = showDiff ? calculateDiff(version, previousVersion) : []
            const statusConfig = statusLabels[version.status] || { label: version.status, color: 'text-zinc-400' }
            const isSelected = selectedVersion === version.id
            
            return (
              <div key={version.id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  index === 0 
                    ? 'bg-blue-500/20 border-2 border-blue-500' 
                    : 'bg-[#222] border border-[#333]'
                }`}>
                  <span className="text-xs font-medium text-zinc-300">
                    {version.versionNummer}
                  </span>
                </div>
                
                {/* Version Card */}
                <div 
                  className={`p-4 rounded-lg transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-[#1f1f1f] border border-blue-500/30' 
                      : 'bg-[#1a1a1a] border border-[#252525] hover:border-[#333]'
                  }`}
                  onClick={() => setSelectedVersion(isSelected ? null : version.id)}
                >
                  {/* Version Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">Version {version.versionNummer}</span>
                      <span className={`text-sm ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <span className="text-blue-400 font-medium">
                      {formatCurrency(version.bruttoBetrag || version.betrag)}
                    </span>
                  </div>
                  
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(version.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.erstelltVon}
                    </span>
                  </div>
                  
                  {/* Änderungsgrund */}
                  {version.aenderungsgrund && (
                    <div className="flex items-start gap-2 text-sm text-zinc-400 mb-2">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="italic">"{version.aenderungsgrund}"</span>
                    </div>
                  )}
                  
                  {/* Diff Anzeige */}
                  {showDiff && diffs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                      <div className="text-xs text-zinc-500 mb-2">Änderungen:</div>
                      <div className="space-y-1.5">
                        {diffs.map((diff, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500 min-w-[100px]">{diff.label}:</span>
                            <span className="text-red-400/70 line-through">{diff.oldValue}</span>
                            <ArrowRight className="w-3 h-3 text-zinc-600" />
                            <span className="text-emerald-400">{diff.newValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-zinc-500">Rechnungsnr.:</span>
                          <span className="ml-2 text-white">{version.nummer}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">MwSt.:</span>
                          <span className="ml-2 text-white">{version.mwst}%</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Netto:</span>
                          <span className="ml-2 text-white">{formatCurrency(version.nettoBetrag)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Brutto:</span>
                          <span className="ml-2 text-white">{formatCurrency(version.bruttoBetrag)}</span>
                        </div>
                        {version.rabatt && version.rabatt > 0 && (
                          <>
                            <div>
                              <span className="text-zinc-500">Rabatt:</span>
                              <span className="ml-2 text-emerald-400">{version.rabatt}%</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Rabattbetrag:</span>
                              <span className="ml-2 text-emerald-400">{formatCurrency(version.rabattBetrag)}</span>
                            </div>
                          </>
                        )}
                        <div>
                          <span className="text-zinc-500">Fällig am:</span>
                          <span className="ml-2 text-white">{formatDate(version.faelligAm)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Rechnungsdatum:</span>
                          <span className="ml-2 text-white">{formatDate(version.rechnungsDatum)}</span>
                        </div>
                      </div>
                      
                      {/* Positionen */}
                      {version.positionen && version.positionen.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs text-zinc-500 mb-2">
                            Positionen ({version.positionen.length}):
                          </div>
                          <div className="space-y-1">
                            {version.positionen.map((pos, i) => (
                              <div key={i} className="flex justify-between text-sm py-1 border-b border-[#252525] last:border-0">
                                <span className="text-zinc-400">{pos.beschreibung}</span>
                                <span className="text-white">
                                  {pos.menge} {pos.einheit} × {formatCurrency(pos.preisProEinheit)} = {formatCurrency(pos.gesamt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Show More / Less */}
      {data.versions.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full mt-4 px-3 py-2 bg-[#1a1a1a] border border-[#252525] text-zinc-400 rounded-lg hover:bg-[#222] hover:text-white transition-colors text-sm"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Alle {data.totalVersions} Versionen anzeigen
            </>
          )}
        </button>
      )}
    </div>
  )
}
