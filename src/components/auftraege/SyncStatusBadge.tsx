"use client"

// KI-1: SyncStatus-Badge für WP-Sync Merge-Strategie
// Zeigt: "Synchronisiert" / "Lokale Änderungen" / "Konflikt"

import { Cloud, CloudOff, AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  syncStatus?: string | null
  wpProjektId?: string | null
  wpSyncedAt?: string | null
  localUpdatedAt?: string | null
  className?: string
}

export function SyncStatusBadge({ 
  syncStatus, 
  wpProjektId, 
  wpSyncedAt, 
  localUpdatedAt,
  className = "" 
}: Props) {
  // Nur anzeigen wenn Auftrag von WP kommt
  if (!wpProjektId) return null

  const statusConfig = {
    synced: {
      icon: Cloud,
      label: "Synchronisiert",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description: "Daten stimmen mit WordPress überein",
    },
    local_changes: {
      icon: CloudOff,
      label: "Lokale Änderungen",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      description: "Lokale Änderungen noch nicht zu WP gepusht",
    },
    conflict: {
      icon: AlertTriangle,
      label: "Konflikt",
      color: "bg-red-500/10 text-red-400 border-red-500/20",
      description: "Änderungen in WP und FM — manuelles Auflösen nötig",
    },
    pending: {
      icon: RefreshCw,
      label: "Wird synchronisiert",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description: "Synchronisation läuft...",
    },
  }

  const status = statusConfig[syncStatus as keyof typeof statusConfig] || statusConfig.synced
  const Icon = status.icon

  const formatDate = (date?: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={`group relative ${className}`}>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${status.color}`}
      >
        <Icon className="w-3 h-3" />
        <span>{status.label}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <p className="text-xs text-zinc-400 mb-2">{status.description}</p>
        <div className="space-y-1 text-xs">
          {wpSyncedAt && (
            <p className="text-zinc-500">
              <span className="text-zinc-400">Letzte WP-Sync:</span> {formatDate(wpSyncedAt)}
            </p>
          )}
          {localUpdatedAt && (
            <p className="text-zinc-500">
              <span className="text-zinc-400">Lokal geändert:</span> {formatDate(localUpdatedAt)}
            </p>
          )}
          <p className="text-zinc-600 mt-2">
            WP-ID: {wpProjektId}
          </p>
        </div>
      </div>
    </div>
  )
}
