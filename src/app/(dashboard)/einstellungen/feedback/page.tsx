"use client"

import { useState, useEffect } from "react"
import { Bug, Lightbulb, HelpCircle, Clock, Filter, RefreshCw, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"

interface FeedbackEintrag {
  id: string
  typ: string
  text: string
  seite: string | null
  nutzer: string | null
  createdAt: string
}

const TYP_CONFIG: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  bug: { icon: Bug, label: "Bug", color: "#dc2626" },
  wunsch: { icon: Lightbulb, label: "Wunsch", color: "#f59e0b" },
  frage: { icon: HelpCircle, label: "Frage", color: "#3b82f6" },
}

export default function FeedbackAdminPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackEintrag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("alle")

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
    { value: "bug", label: "🐛 Bugs" },
    { value: "wunsch", label: "💡 Wünsche" },
    { value: "frage", label: "❓ Fragen" },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Feedback-Übersicht"
        description="Alle eingegangenen Feedbacks von Nutzern"
      />

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

        <div className="flex gap-2">
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

            return (
              <div
                key={feedback.id}
                className="p-5 rounded-xl"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="p-2 rounded-lg"
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
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: "var(--color-surface-container)",
                            color: "var(--color-on-surface-variant)",
                          }}
                        >
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
