"use client"

import { useEffect, useState, useCallback } from "react"
import { Phone, MapPin, Clock, CheckCircle, AlertTriangle, User, Navigation, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Lazy load Leaflet map (SSR incompatible)
const SOSMap = dynamic(() => import("./SOSMap"), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
})

interface SOSEvent {
  id: string
  eventId: string
  mitarbeiterId: string
  mitarbeiterName: string
  aktiverEinsatzId: string | null
  aktiverEinsatzName: string | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  gpsTimestamp: string | null
  googleMapsLink: string | null
  ausgeloestAt: string
  gesendetAt: string | null
  acknowledgedAt: string | null
  resolvedAt: string | null
  status: "pending" | "sent" | "acknowledged" | "resolved"
  resolvedBy: string | null
  resolutionNotes: string | null
  isDelayedSync: boolean
  koordinatorenNotified: number
}

export default function SOSKoordinatorDashboard() {
  const [events, setEvents] = useState<SOSEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<SOSEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")

  // Fetch initial data and setup SSE
  useEffect(() => {
    let eventSource: EventSource | null = null

    const connectSSE = () => {
      setConnectionStatus("connecting")
      eventSource = new EventSource("/api/sos/events")

      eventSource.onopen = () => {
        setConnectionStatus("connected")
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "init" || data.type === "update") {
            setEvents(data.events)
            setLoading(false)
            
            // Play alert sound for new pending events
            if (data.type === "update") {
              const hasPending = data.events.some((e: SOSEvent) => e.status === "pending" || e.status === "sent")
              if (hasPending) {
                // Browser audio notification (if permitted)
                try {
                  const audio = new Audio("/sounds/sos-alert.mp3")
                  audio.volume = 0.5
                  audio.play().catch(() => {})
                } catch {}
              }
            }
          }
        } catch (err) {
          console.error("[SSE] Parse error:", err)
        }
      }

      eventSource.onerror = () => {
        setConnectionStatus("error")
        eventSource?.close()
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000)
      }
    }

    // Initial fetch fallback
    fetch("/api/sos/events?active=true")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(console.error)

    // Start SSE
    connectSSE()

    return () => {
      eventSource?.close()
    }
  }, [])

  // Active (non-resolved) events
  const activeEvents = events.filter((e) => e.status !== "resolved")
  const hasActiveAlarm = activeEvents.length > 0

  // Acknowledge SOS
  const acknowledgeEvent = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/sos/status/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "acknowledged" }),
      })
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.eventId === eventId
              ? { ...e, status: "acknowledged", acknowledgedAt: new Date().toISOString() }
              : e
          )
        )
      }
    } catch (err) {
      console.error("Acknowledge failed:", err)
    }
  }, [])

  // Resolve SOS
  const resolveEvent = useCallback(async (eventId: string) => {
    if (!resolutionNotes.trim()) {
      toast.warning("Bitte Auflösungs-Notiz eingeben")
      return
    }
    setResolving(eventId)
    try {
      const res = await fetch(`/api/sos/resolve/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resolutionNotes: resolutionNotes.trim(),
        }),
      })
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.eventId === eventId
              ? { ...e, status: "resolved", resolvedAt: new Date().toISOString(), resolutionNotes: resolutionNotes.trim() }
              : e
          )
        )
        setSelectedEvent(null)
        setResolutionNotes("")
      }
    } catch (err) {
      console.error("Resolve failed:", err)
    } finally {
      setResolving(null)
    }
  }, [resolutionNotes])

  // Format timestamp
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Status badge
  const StatusBadge = ({ status }: { status: SOSEvent["status"] }) => {
    const styles = {
      pending: "bg-red-600 text-white animate-pulse",
      sent: "bg-red-500 text-white",
      acknowledged: "bg-yellow-500 text-white",
      resolved: "bg-green-500 text-white",
    }
    const labels = {
      pending: "🚨 AKTIV",
      sent: "🚨 GESENDET",
      acknowledged: "⚠️ BESTÄTIGT",
      resolved: "✅ GELÖST",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Critical Alert Banner */}
      {hasActiveAlarm && (
        <div className="bg-red-600 text-white py-4 px-6 animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">🚨 AKTIVE SOS-ALARME: {activeEvents.length}</h2>
                <p className="text-red-100">
                  {activeEvents.map((e) => e.mitarbeiterName).join(", ")} benötigt Hilfe!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Echtzeit</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-400"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            SOS-Koordination
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className={`w-4 h-4 ${connectionStatus === "connecting" ? "animate-spin" : ""}`} />
            {connectionStatus === "connected" ? "Live verbunden" : connectionStatus === "connecting" ? "Verbinde..." : "Verbindung unterbrochen"}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Live-Karte
                </h2>
              </div>
              <SOSMap
                events={activeEvents}
                selectedEventId={selectedEvent?.eventId}
                onSelectEvent={(eventId) => {
                  const event = events.find((e) => e.eventId === eventId)
                  setSelectedEvent(event || null)
                }}
              />
            </div>

            {/* Event List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold">SOS-Events</h2>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                    <p>Keine aktiven SOS-Alarme</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedEvent?.eventId === event.eventId
                          ? "bg-red-50 border-l-4 border-red-500"
                          : "hover:bg-gray-50"
                      } ${event.status === "pending" || event.status === "sent" ? "bg-red-50" : ""}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold">{event.mitarbeiterName}</span>
                        </div>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {event.aktiverEinsatzName && (
                          <p>📍 {event.aktiverEinsatzName}</p>
                        )}
                        <p className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(event.ausgeloestAt)}
                          {event.isDelayedSync && (
                            <span className="text-yellow-600 text-xs ml-2">(verzögert)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {selectedEvent && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className={`w-6 h-6 ${selectedEvent.status === "resolved" ? "text-green-500" : "text-red-500"}`} />
                  SOS von {selectedEvent.mitarbeiterName}
                </h2>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info */}
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-sm">Mitarbeiter-ID:</span>
                  <p className="font-mono">{selectedEvent.mitarbeiterId}</p>
                </div>
                {selectedEvent.aktiverEinsatzName && (
                  <div>
                    <span className="text-gray-500 text-sm">Aktiver Einsatz:</span>
                    <p>{selectedEvent.aktiverEinsatzName}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 text-sm">Ausgelöst:</span>
                  <p>{new Date(selectedEvent.ausgeloestAt).toLocaleString("de-DE")}</p>
                </div>
                {selectedEvent.gpsLatitude && selectedEvent.gpsLongitude && (
                  <div>
                    <span className="text-gray-500 text-sm">GPS-Koordinaten:</span>
                    <p className="font-mono text-sm">
                      {selectedEvent.gpsLatitude.toFixed(6)}, {selectedEvent.gpsLongitude.toFixed(6)}
                      {selectedEvent.gpsAccuracy && (
                        <span className="text-gray-400 ml-2">(±{Math.round(selectedEvent.gpsAccuracy)}m)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Call Button */}
                <a
                  href={`tel:+49000000000`} // TODO: Get from Mitarbeiter
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Mitarbeiter anrufen
                </a>

                {/* Google Maps */}
                {selectedEvent.googleMapsLink && (
                  <a
                    href={selectedEvent.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Navigation className="w-5 h-5" />
                    In Google Maps öffnen
                  </a>
                )}

                {/* Acknowledge */}
                {(selectedEvent.status === "pending" || selectedEvent.status === "sent") && (
                  <button
                    onClick={() => acknowledgeEvent(selectedEvent.eventId)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Als "Bestätigt" markieren
                  </button>
                )}

                {/* Resolve */}
                {selectedEvent.status !== "resolved" && (
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auflösung dokumentieren:
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="z.B. Falscher Alarm, Mitarbeiter kontaktiert..."
                      className="w-full p-3 border rounded-lg text-sm"
                      rows={2}
                    />
                    <button
                      onClick={() => resolveEvent(selectedEvent.eventId)}
                      disabled={resolving === selectedEvent.eventId || !resolutionNotes.trim()}
                      className="mt-2 flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
                    >
                      {resolving === selectedEvent.eventId ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      SOS auflösen
                    </button>
                  </div>
                )}

                {/* Resolution info */}
                {selectedEvent.status === "resolved" && selectedEvent.resolutionNotes && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Aufgelöst:</span>
                    <p className="text-green-800">{selectedEvent.resolutionNotes}</p>
                    {selectedEvent.resolvedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(selectedEvent.resolvedAt).toLocaleString("de-DE")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
