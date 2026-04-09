"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Check, X, AlertCircle, ArrowRight, ArrowLeft, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SyncLog {
  id: string
  entityType: string
  entityId: string
  direction: string
  status: string
  error: string | null
  timestamp: string
}

interface SyncStats {
  total: number
  ok: number
  error: number
  lastSync: string | null
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === "WP_TO_FM") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
        <ArrowRight className="w-3 h-3" />
        WP → FM
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
      <ArrowLeft className="w-3 h-3" />
      FM → WP
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "OK") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
        <Check className="w-3 h-3" />
        OK
      </span>
    )
  }
  if (status === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
        <X className="w-3 h-3" />
        Fehler
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
      <AlertCircle className="w-3 h-3" />
      {status}
    </span>
  )
}

export default function SyncSettingsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [stats, setStats] = useState<SyncStats>({ total: 0, ok: 0, error: 0, lastSync: null })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<"alle" | "OK" | "ERROR">("alle")

  const loadLogs = async () => {
    try {
      const res = await fetch("/api/sync/logs")
      const data = await res.json()
      
      const logArray = Array.isArray(data) ? data : (data.logs || [])
      setLogs(logArray)
      
      // Stats berechnen
      const ok = logArray.filter((l: SyncLog) => l.status === "OK").length
      const error = logArray.filter((l: SyncLog) => l.status === "ERROR").length
      const lastSync = logArray.length > 0 ? logArray[0].timestamp : null
      
      setStats({
        total: logArray.length,
        ok,
        error,
        lastSync
      })
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => { loadLogs() }, [])

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/sync/wp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_all" })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        toast.success(`Sync abgeschlossen: ${result.synced || 0} Aufträge synchronisiert`)
        loadLogs()
      } else {
        toast.error(result.error || "Sync fehlgeschlagen")
      }
    } catch (error) {
      toast.error("Fehler bei der Synchronisation")
    }
    setSyncing(false)
  }

  const filteredLogs = logs.filter(l => {
    if (filter === "alle") return true
    return l.status === filter
  })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Synchronisation</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            WordPress ↔ ForstManager Datenabgleich
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A55A] hover:bg-[#D4B56A] text-[#2C3A1C] rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {syncing ? "Synchronisiere..." : "Alles synchronisieren"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Gesamt</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Erfolgreich</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.ok}</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Fehler</p>
          <p className="text-2xl font-bold text-red-400">{stats.error}</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Letzte Sync</p>
          <p className="text-sm font-medium text-white">
            {stats.lastSync 
              ? new Date(stats.lastSync).toLocaleString("de-DE", { 
                  day: "2-digit", 
                  month: "2-digit", 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })
              : "–"
            }
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["alle", "OK", "ERROR"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f 
                ? "bg-[#C5A55A]/20 text-[#C5A55A]" 
                : "bg-[#1e1e1e] text-zinc-400 hover:text-white"
            }`}
          >
            {f === "alle" ? "Alle" : f}
          </button>
        ))}
      </div>

      {/* Log-Tabelle */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Laden...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Keine Sync-Logs vorhanden</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Zeitpunkt</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Typ</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Richtung</th>
                <th className="text-center px-4 py-3 text-zinc-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fehler</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 50).map(log => (
                <tr key={log.id} className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors">
                  <td className="px-4 py-3 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white">{log.entityType}</span>
                    <span className="text-zinc-500 text-xs ml-2">#{log.entityId.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DirectionBadge direction={log.direction} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-3 text-red-400 text-xs max-w-xs truncate">
                    {log.error || "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info-Box */}
      <div className="mt-6 p-4 rounded-xl bg-[#161616] border border-[#2a2a2a]">
        <h3 className="text-sm font-medium text-white mb-2">Sync-Konfiguration</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">WordPress URL:</span>
            <span className="text-white ml-2">peru-otter-113714.hostingersite.com</span>
          </div>
          <div>
            <span className="text-zinc-500">Sync-Intervall:</span>
            <span className="text-white ml-2">15 Minuten (Cron)</span>
          </div>
          <div>
            <span className="text-zinc-500">Konflikt-Strategie:</span>
            <span className="text-white ml-2">Last-Write-Wins</span>
          </div>
          <div>
            <span className="text-zinc-500">Rate-Limit:</span>
            <span className="text-white ml-2">100 Requests/Minute</span>
          </div>
        </div>
      </div>
    </div>
  )
}
