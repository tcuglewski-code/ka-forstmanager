"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Users, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Phone, 
  RefreshCw,
  User,
  Navigation,
  Radio,
  ChevronRight
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import type { TeamMemberLive } from "@/app/api/team/live-status/route"

// Lazy load Karte (SSR incompatible)
const TeamLiveMap = dynamic(() => import("./TeamLiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
})

type ConnectionStatus = "connecting" | "connected" | "error"

export default function TeamLiveDashboard() {
  const [team, setTeam] = useState<TeamMemberLive[]>([])
  const [selectedMember, setSelectedMember] = useState<TeamMemberLive | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // SSE verbinden
  useEffect(() => {
    let eventSource: EventSource | null = null

    const connectSSE = () => {
      setConnectionStatus("connecting")
      eventSource = new EventSource("/api/team/live-status")

      eventSource.addEventListener("team-status", (event) => {
        try {
          const data = JSON.parse(event.data)
          setTeam(data.team)
          setLastUpdate(new Date())
          setLoading(false)
          setConnectionStatus("connected")
        } catch (err) {
          console.error("[TeamLive SSE] Parse error:", err)
        }
      })

      eventSource.onopen = () => {
        setConnectionStatus("connected")
      }

      eventSource.onerror = () => {
        setConnectionStatus("error")
        eventSource?.close()
        // Reconnect nach 5s
        setTimeout(connectSSE, 5000)
      }
    }

    // Initial Fetch als Fallback
    fetch("/api/team/live-status?snapshot=true")
      .then((res) => res.json())
      .then((data) => {
        setTeam(data.team || [])
        setLastUpdate(new Date())
        setLoading(false)
      })
      .catch(console.error)

    connectSSE()

    return () => {
      eventSource?.close()
    }
  }, [])

  // Stats berechnen
  const stats = {
    total: team.length,
    sos: team.filter((m) => m.status === "sos").length,
    overdue: team.filter((m) => m.status === "overdue").length,
    ok: team.filter((m) => m.status === "ok").length,
    offline: team.filter((m) => m.status === "offline").length,
    withGPS: team.filter((m) => m.latitude && m.longitude).length,
    alleinarbeit: team.filter((m) => m.alleinarbeitAktiv).length,
  }

  const hasAlerts = stats.sos > 0 || stats.overdue > 0

  // Member auswählen
  const handleSelectMember = useCallback((memberId: string) => {
    const member = team.find((m) => m.id === memberId)
    setSelectedMember(member || null)
  }, [team])

  // Status-Badge
  const StatusBadge = ({ status }: { status: TeamMemberLive["status"] }) => {
    const config = {
      sos: { bg: "bg-red-600 animate-pulse", text: "🚨 SOS" },
      overdue: { bg: "bg-yellow-500", text: "⚠️ Überfällig" },
      ok: { bg: "bg-green-500", text: "✅ OK" },
      offline: { bg: "bg-gray-400", text: "📴 Offline" },
    }
    const { bg, text } = config[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${bg}`}>
        {text}
      </span>
    )
  }

  // Zeit formatieren
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—"
    return new Date(isoString).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Banner bei SOS/Überfällig */}
      {hasAlerts && (
        <div className={`${stats.sos > 0 ? "bg-red-600" : "bg-yellow-500"} text-white py-3 px-6 animate-pulse`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-6 h-6" />
              <div>
                {stats.sos > 0 && (
                  <span className="font-bold mr-4">🚨 {stats.sos} SOS-Alarm(e)</span>
                )}
                {stats.overdue > 0 && (
                  <span className="font-bold">⚠️ {stats.overdue} überfällig</span>
                )}
              </div>
            </div>
            <Link 
              href="/sos" 
              className="flex items-center gap-1 text-white/90 hover:text-white text-sm"
            >
              Zur SOS-Zentrale <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)] flex items-center gap-3">
              <MapPin className="w-7 h-7 text-green-600" />
              Team Live-Karte
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Echtzeit-Übersicht aller Außendienstmitarbeiter
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Radio className={`w-4 h-4 ${connectionStatus === "connected" ? "text-green-500" : connectionStatus === "connecting" ? "text-yellow-500 animate-pulse" : "text-red-500"}`} />
              {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Verbinde..." : "Offline"}
            </div>
            {lastUpdate && (
              <p className="text-xs text-gray-400">
                Aktualisiert: {formatTime(lastUpdate.toISOString())}
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Users className="w-4 h-4" />
              Gesamt
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className={`rounded-lg shadow p-4 ${stats.sos > 0 ? "bg-red-50 border-2 border-red-200" : "bg-white"}`}>
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              SOS
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.sos}</p>
          </div>
          <div className={`rounded-lg shadow p-4 ${stats.overdue > 0 ? "bg-yellow-50 border-2 border-yellow-200" : "bg-white"}`}>
            <div className="flex items-center gap-2 text-yellow-600 text-sm">
              <Clock className="w-4 h-4" />
              Überfällig
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.overdue}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              OK
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Users className="w-4 h-4" />
              Offline
            </div>
            <p className="text-2xl font-bold text-gray-400">{stats.offline}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <MapPin className="w-4 h-4" />
              Mit GPS
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.withGPS}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-indigo-600 text-sm">
              <User className="w-4 h-4" />
              Alleinarbeit
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.alleinarbeit}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Karte (2/3 Breite) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Live-Karte ({stats.withGPS} Mitarbeiter)
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> OK
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Überfällig
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> SOS
                  </span>
                </div>
              </div>
              <TeamLiveMap
                team={team}
                selectedMemberId={selectedMember?.id}
                onSelectMember={handleSelectMember}
              />
            </div>

            {/* Mitarbeiter-Liste (1/3 Breite) */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold">Mitarbeiter</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {team.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Keine aktiven Mitarbeiter</p>
                  </div>
                ) : (
                  team.map((member) => (
                    <div
                      key={member.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedMember?.id === member.id
                          ? "bg-green-50 border-l-4 border-green-500"
                          : "hover:bg-gray-50"
                      } ${
                        member.status === "sos" ? "bg-red-50" : 
                        member.status === "overdue" ? "bg-yellow-50" : ""
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold">{member.name}</span>
                        </div>
                        <StatusBadge status={member.status} />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="text-xs text-gray-400">{member.rolle}</p>
                        {member.aktiverEinsatzName && (
                          <p>📍 {member.aktiverEinsatzName}</p>
                        )}
                        {member.alleinarbeitAktiv && (
                          <p className="text-blue-600 text-xs">
                            👤 Alleinarbeit • Check alle {member.checkIntervalMin} Min.
                          </p>
                        )}
                        {member.gpsTimestamp && (
                          <p className="text-xs text-gray-400">
                            GPS: {formatTime(member.gpsTimestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail-Panel bei Auswahl */}
        {selectedMember && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                  <User className="w-6 h-6 text-gray-400" />
                  {selectedMember.name}
                </h2>
                <p className="text-gray-500 text-sm">{selectedMember.rolle}</p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status */}
              <div className="space-y-3">
                <StatusBadge status={selectedMember.status} />
                
                {selectedMember.aktiverEinsatzName && (
                  <div>
                    <span className="text-gray-500 text-sm">Aktueller Einsatz:</span>
                    <p className="font-medium">{selectedMember.aktiverEinsatzName}</p>
                  </div>
                )}
                
                {selectedMember.latitude && selectedMember.longitude && (
                  <div>
                    <span className="text-gray-500 text-sm">GPS-Position:</span>
                    <p className="font-mono text-sm">
                      {selectedMember.latitude.toFixed(5)}, {selectedMember.longitude.toFixed(5)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Aktualisiert: {formatTime(selectedMember.gpsTimestamp)}
                      {selectedMember.gpsAccuracy && ` (±${Math.round(selectedMember.gpsAccuracy)}m)`}
                    </p>
                  </div>
                )}
              </div>

              {/* Alleinarbeit-Info */}
              {selectedMember.alleinarbeitAktiv && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Alleinarbeit aktiv
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Check-Intervall: alle {selectedMember.checkIntervalMin} Min.</p>
                    <p>Letzter Check-In: {formatTime(selectedMember.lastCheckIn)}</p>
                    {selectedMember.nextCheckDue && (
                      <p>Nächster fällig: {formatTime(selectedMember.nextCheckDue)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Aktionen */}
              <div className="space-y-3">
                {selectedMember.telefon && (
                  <a
                    href={`tel:${selectedMember.telefon}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Anrufen: {selectedMember.telefon}
                  </a>
                )}
                
                {selectedMember.latitude && selectedMember.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedMember.latitude},${selectedMember.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Navigation className="w-5 h-5" />
                    In Google Maps öffnen
                  </a>
                )}

                {selectedMember.status === "sos" && selectedMember.aktiverSOSEventId && (
                  <Link
                    href="/sos"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Zum SOS-Alarm
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
