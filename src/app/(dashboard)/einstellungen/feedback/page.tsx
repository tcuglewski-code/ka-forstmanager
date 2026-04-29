"use client"

import { useState, useEffect } from "react"
import {
  Bug,
  Lightbulb,
  HelpCircle,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Database,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Monitor,
  MapPin,
  Image,
  Terminal,
} from "lucide-react"

interface BrowserInfo {
  userAgent?: string
  viewport?: string
  language?: string
  online?: boolean
  url?: string
  title?: string
}

interface TechnicalContext {
  consoleErrors?: string[]
  loadTime?: number
  screenshotBase64?: string
}

interface FeedbackEintrag {
  id: string
  typ: string
  text: string
  seite: string | null
  nutzer: string | null
  severity: string | null
  screenshotUrl: string | null
  browserInfo: BrowserInfo | null
  technicalContext: TechnicalContext | null
  expectedBehavior: string | null
  createdAt: string
}

const TYP_CONFIG: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  bug: { icon: Bug, label: "Bug", color: "#dc2626" },
  wunsch: { icon: Lightbulb, label: "Wunsch", color: "#f59e0b" },
  frage: { icon: HelpCircle, label: "Frage", color: "#3b82f6" },
  ux_problem: { icon: AlertTriangle, label: "UX-Problem", color: "#f97316" },
  datenfehler: { icon: Database, label: "Datenfehler", color: "#8b5cf6" },
  performance: { icon: BarChart3, label: "Performance", color: "#06b6d4" },
}

const SEV_CONFIG: Record<string, { label: string; color: string }> = {
  blocker: { label: "Blocker", color: "#dc2626" },
  kritisch: { label: "Kritisch", color: "#dc2626" },
  hoch: { label: "Hoch", color: "#f97316" },
  mittel: { label: "Mittel", color: "#eab308" },
  niedrig: { label: "Niedrig", color: "#22c55e" },
}

export default function FeedbackAdminPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackEintrag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("alle")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const url = filter === "alle"
        ? "/api/feedback"
        : `/api/feedback?typ=${filter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data)
      }
    } catch (err) {
      console.error("Fehler beim Laden:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const filterOptions = [
    { value: "alle", label: "Alle" },
    { value: "bug", label: "Bugs" },
    { value: "wunsch", label: "Wünsche" },
    { value: "frage", label: "Fragen" },
    { value: "ux_problem", label: "UX" },
    { value: "datenfehler", label: "Daten" },
    { value: "performance", label: "Perf." },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--color-on-surface)" }}
        >
          Feedback-Übersicht
        </h1>
        <p
          className="text-sm"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          Alle eingegangenen Feedbacks von Nutzern
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="mb-6 p-4 rounded-xl flex items-center gap-4 flex-wrap"
        style={{ backgroundColor: "var(--color-surface-container)" }}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: "var(--color-on-surface-variant)" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Filter:
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  filter === option.value
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color:
                  filter === option.value
                    ? "var(--color-on-primary)"
                    : "var(--color-on-surface-variant)",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={fetchFeedbacks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-on-surface-variant)",
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "var(--color-primary)" }}
          />
        </div>
      ) : feedbacks.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ backgroundColor: "var(--color-surface-container)" }}
        >
          <p style={{ color: "var(--color-on-surface-variant)" }}>
            Noch kein Feedback vorhanden.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const config = TYP_CONFIG[feedback.typ] ?? TYP_CONFIG.frage
            const Icon = config.icon
            const sevConfig = feedback.severity ? SEV_CONFIG[feedback.severity] : null
            const isExpanded = expandedId === feedback.id
            const hasTechnicalDetails = feedback.browserInfo || feedback.technicalContext || feedback.screenshotUrl || feedback.expectedBehavior

            return (
              <div
                key={feedback.id}
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: config.color + "20" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: config.color + "20",
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>

                        {sevConfig && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: sevConfig.color + "20",
                              color: sevConfig.color,
                            }}
                          >
                            {sevConfig.label}
                          </span>
                        )}

                        {feedback.nutzer && (
                          <span
                            className="text-sm"
                            style={{ color: "var(--color-on-surface)" }}
                          >
                            von <strong>{feedback.nutzer}</strong>
                          </span>
                        )}

                        {feedback.seite && (
                          <span
                            className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                            style={{
                              backgroundColor: "var(--color-surface-container)",
                              color: "var(--color-on-surface-variant)",
                            }}
                          >
                            <MapPin className="w-3 h-3" />
                            {feedback.seite}
                          </span>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1 mt-1 text-xs"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        <Clock className="w-3 h-3" />
                        {formatDate(feedback.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <p
                    className="text-sm whitespace-pre-wrap pl-11"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {feedback.text}
                  </p>

                  {/* Expected Behavior */}
                  {feedback.expectedBehavior && (
                    <div className="pl-11 mt-2">
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        Erwartetes Verhalten:
                      </p>
                      <p
                        className="text-sm italic"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {feedback.expectedBehavior}
                      </p>
                    </div>
                  )}

                  {/* Technical Details Toggle */}
                  {hasTechnicalDetails && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : feedback.id)}
                      className="flex items-center gap-1.5 mt-3 ml-11 text-xs font-medium transition-colors"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      Technische Details
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Expanded Technical Details */}
                {isExpanded && hasTechnicalDetails && (
                  <div
                    className="px-5 pb-5 pt-0 ml-11 space-y-3"
                    style={{ borderTop: "1px solid var(--color-outline-variant)" }}
                  >
                    {/* Browser Info */}
                    {feedback.browserInfo && (
                      <div className="mt-3">
                        <p
                          className="text-xs font-medium mb-1.5 flex items-center gap-1"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          Browser / Gerät
                        </p>
                        <div
                          className="rounded-lg p-3 text-xs space-y-1 font-mono"
                          style={{ backgroundColor: "var(--color-surface-container)" }}
                        >
                          {feedback.browserInfo.url && (
                            <p style={{ color: "var(--color-on-surface)" }}>
                              <span style={{ color: "var(--color-on-surface-variant)" }}>URL: </span>
                              {feedback.browserInfo.url}
                            </p>
                          )}
                          {feedback.browserInfo.viewport && (
                            <p style={{ color: "var(--color-on-surface)" }}>
                              <span style={{ color: "var(--color-on-surface-variant)" }}>Viewport: </span>
                              {feedback.browserInfo.viewport}
                            </p>
                          )}
                          {feedback.browserInfo.userAgent && (
                            <p className="break-all" style={{ color: "var(--color-on-surface)" }}>
                              <span style={{ color: "var(--color-on-surface-variant)" }}>UA: </span>
                              {feedback.browserInfo.userAgent}
                            </p>
                          )}
                          {feedback.browserInfo.language && (
                            <p style={{ color: "var(--color-on-surface)" }}>
                              <span style={{ color: "var(--color-on-surface-variant)" }}>Sprache: </span>
                              {feedback.browserInfo.language}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Console Errors */}
                    {feedback.technicalContext?.consoleErrors && feedback.technicalContext.consoleErrors.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-medium mb-1.5 flex items-center gap-1"
                          style={{ color: "#dc2626" }}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          Konsolen-Fehler ({feedback.technicalContext.consoleErrors.length})
                        </p>
                        <div
                          className="rounded-lg p-3 text-xs font-mono space-y-1 max-h-40 overflow-y-auto"
                          style={{ backgroundColor: "#1c1c16", color: "#dc2626" }}
                        >
                          {feedback.technicalContext.consoleErrors.map((err, i) => (
                            <p key={i} className="break-all">{err}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Load Time */}
                    {feedback.technicalContext?.loadTime != null && (
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        Seitenzeit bis Feedback: {(feedback.technicalContext.loadTime / 1000).toFixed(1)}s
                      </p>
                    )}

                    {/* Screenshot */}
                    {feedback.screenshotUrl && (
                      <div>
                        <p
                          className="text-xs font-medium mb-1.5 flex items-center gap-1"
                          style={{ color: "var(--color-on-surface-variant)" }}
                        >
                          <Image className="w-3.5 h-3.5" />
                          Screenshot
                        </p>
                        <img
                          src={feedback.screenshotUrl}
                          alt="Feedback Screenshot"
                          className="rounded-lg border max-w-full max-h-64 object-contain"
                          style={{ borderColor: "var(--color-outline-variant)" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && feedbacks.length > 0 && (
        <div
          className="mt-6 p-4 rounded-xl text-center text-sm"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-on-surface-variant)",
          }}
        >
          {feedbacks.length} Feedback-Einträge gefunden
        </div>
      )}
    </div>
  )
}
