"use client"

import { useState, useEffect, useCallback } from "react"
import { Smartphone, Monitor, Tablet, TreePine, Loader2, Trash2, RefreshCw, Shield } from "lucide-react"
import { toast } from "sonner"

interface Session {
  id: string
  deviceType: string
  deviceName: string
  deviceIcon: string
  ipAddress: string
  lastActiveAt: string
  createdAt: string
  isCurrent: boolean
}

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  app: TreePine,
}

export function DeviceList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/sessions")
      const data = await res.json()
      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch {
      toast.error("Fehler beim Laden der Geräte")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        toast.success("Sitzung beendet")
        await fetchSessions()
      } else {
        toast.error(data.error || "Fehler beim Beenden der Sitzung")
      }
    } catch {
      toast.error("Fehler beim Beenden der Sitzung")
    }
    setRevoking(null)
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Gerade eben"
    if (minutes < 60) return `vor ${minutes} Min.`
    if (hours < 24) return `vor ${hours} Std.`
    if (days < 7) return `vor ${days} Tag${days > 1 ? "en" : ""}`
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Shield className="w-4 h-4" />
          <span>{sessions.length} aktive Sitzung{sessions.length !== 1 ? "en" : ""}</span>
        </div>
        <button
          onClick={fetchSessions}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Aktualisieren
        </button>
      </div>

      {/* Info */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-sm text-zinc-400">
        <p>
          Hier sehen Sie alle Geräte, auf denen Sie derzeit angemeldet sind. 
          Sie können einzelne Sitzungen beenden, um den Zugriff auf Ihr Konto zu widerrufen.
        </p>
      </div>

      {/* Session List */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden divide-y divide-[#2a2a2a]">
        {sessions.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-600">
            Keine aktiven Sitzungen gefunden
          </div>
        ) : (
          sessions.map((session) => {
            const Icon = deviceIcons[session.deviceType] || Monitor
            return (
              <div
                key={session.id}
                className={`flex items-center justify-between px-6 py-4 hover:bg-[#1c1c1c] ${
                  session.isCurrent ? "bg-[#1f2a1a]" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${session.isCurrent ? "bg-emerald-500/20" : "bg-[#2a2a2a]"}`}>
                    <Icon className={`w-5 h-5 ${session.isCurrent ? "text-emerald-400" : "text-zinc-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{session.deviceName}</span>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                          Dieses Gerät
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      IP: {session.ipAddress} · Zuletzt aktiv: {formatDate(session.lastActiveAt)}
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {revoking === session.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Beenden
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-[#1a1a1a] border border-amber-500/20 rounded-lg p-4 text-sm">
        <p className="text-amber-400 font-medium mb-1">🔒 Sicherheitstipp</p>
        <p className="text-zinc-400 text-xs">
          Wenn Sie ein Gerät nicht erkennen, beenden Sie die Sitzung sofort und ändern Sie Ihr Passwort.
          Aktivieren Sie die Zwei-Faktor-Authentifizierung für zusätzliche Sicherheit.
        </p>
      </div>
    </div>
  )
}
