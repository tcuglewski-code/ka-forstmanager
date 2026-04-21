"use client"

import { useState, useEffect } from "react"
import { 
  History, ChevronDown, ChevronUp, User, Clock, 
  FileEdit, Trash2, Lock, AlertTriangle, Plus,
  Loader2, Shield
} from "lucide-react"

interface AuditEntry {
  id: string
  action: string
  field: string | null
  oldValue: any
  newValue: any
  userId: string | null
  userName: string | null
  ip: string | null
  userAgent: string | null
  timestamp: string
}

interface AuditLogResponse {
  rechnungId: string
  rechnungNummer: string
  entries: AuditEntry[]
  totalEntries: number
}

interface AuditLogSectionProps {
  rechnungId: string
}

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'CREATE': { label: 'Erstellt', icon: Plus, color: 'text-emerald-400' },
  'UPDATE': { label: 'Geändert', icon: FileEdit, color: 'text-blue-400' },
  'DELETE': { label: 'Gelöscht', icon: Trash2, color: 'text-red-400' },
  'LOCK': { label: 'Gesperrt', icon: Lock, color: 'text-amber-400' },
  'UNLOCK_ATTEMPT': { label: 'Entsperr-Versuch', icon: AlertTriangle, color: 'text-red-400' },
  'UPDATE_ATTEMPT_BLOCKED': { label: 'Änderung blockiert', icon: Shield, color: 'text-red-400' },
  'DELETE_ATTEMPT_BLOCKED': { label: 'Löschung blockiert', icon: Shield, color: 'text-red-400' },
}

const fieldLabels: Record<string, string> = {
  'status': 'Status',
  'notizen': 'Notizen',
  'betrag': 'Betrag',
  'rabatt': 'Rabatt (%)',
  'rabattBetrag': 'Rabattbetrag',
  'rabattGrund': 'Rabattgrund',
  'faelligAm': 'Fällig am',
  'pdfUrl': 'PDF-Link',
  'zahlungsBedingung': 'Zahlungsbedingung',
  'mwst': 'MwSt.-Satz',
}

function formatValue(value: any, field: string | null): string {
  if (value === null || value === undefined) return '–'
  
  if (field === 'faelligAm' && typeof value === 'string') {
    try {
      return new Date(value).toLocaleDateString('de-DE')
    } catch { return value }
  }
  
  if (field === 'betrag' || field === 'rabattBetrag') {
    return typeof value === 'number' ? `${value.toFixed(2)} €` : value
  }
  
  if (field === 'rabatt' || field === 'mwst') {
    return typeof value === 'number' ? `${value}%` : value
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  
  return String(value)
}

export default function AuditLogSection({ rechnungId }: AuditLogSectionProps) {
  const [data, setData] = useState<AuditLogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function fetchAuditLog() {
      setLoading(true)
      try {
        const res = await fetch(`/api/rechnungen/${rechnungId}/audit`)
        if (!res.ok) {
          if (res.status === 403) {
            setError('Keine Berechtigung für das Audit-Log')
          } else {
            throw new Error('Fehler beim Laden')
          }
          return
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError('Fehler beim Laden des Audit-Logs')
      } finally {
        setLoading(false)
      }
    }
    fetchAuditLog()
  }, [rechnungId])

  if (loading) {
    return (
      <div className="bg-[#161616] border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Lade Änderungsprotokoll...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#161616] border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 text-zinc-500">
          <Shield className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="bg-[#161616] border border-border rounded-xl p-6">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-zinc-500" />
          <h3 className="text-sm text-zinc-500 uppercase tracking-wider">Änderungsprotokoll</h3>
        </div>
        <p className="text-zinc-500 text-sm mt-3">Keine Änderungen protokolliert.</p>
      </div>
    )
  }

  const displayEntries = expanded ? data.entries : data.entries.slice(0, 5)

  return (
    <div className="bg-[#161616] border border-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm text-zinc-500 uppercase tracking-wider">
            Änderungsprotokoll
          </h3>
          <span className="px-2 py-0.5 bg-[#222] border border-[#333] text-zinc-400 text-xs rounded-full">
            {data.totalEntries} Einträge
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs">
          <Shield className="w-3 h-3" />
          GoBD-konform
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {displayEntries.map((entry) => {
          const config = actionConfig[entry.action] || { 
            label: entry.action, 
            icon: FileEdit, 
            color: 'text-zinc-400' 
          }
          const ActionIcon = config.icon
          
          return (
            <div 
              key={entry.id}
              className="flex items-start gap-3 p-3 bg-[#1a1a1a] border border-[#252525] rounded-lg"
            >
              {/* Icon */}
              <div className={`mt-0.5 ${config.color}`}>
                <ActionIcon className="w-4 h-4" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${config.color}`}>{config.label}</span>
                  {entry.field && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400 text-sm">
                        {fieldLabels[entry.field] || entry.field}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Value Changes */}
                {entry.field && (entry.oldValue !== null || entry.newValue !== null) && (
                  <div className="mt-1 text-sm">
                    {entry.oldValue !== null && (
                      <span className="text-red-400/80 line-through mr-2">
                        {formatValue(entry.oldValue, entry.field)}
                      </span>
                    )}
                    {entry.newValue !== null && (
                      <span className="text-emerald-400">
                        → {formatValue(entry.newValue, entry.field)}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Meta Info */}
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {entry.userName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.userName}
                    </span>
                  )}
                  {entry.ip && (
                    <span className="hidden sm:inline text-zinc-600">
                      IP: {entry.ip.split(',')[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More / Less */}
      {data.entries.length > 5 && (
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
              Alle {data.totalEntries} Einträge anzeigen
            </>
          )}
        </button>
      )}
    </div>
  )
}
