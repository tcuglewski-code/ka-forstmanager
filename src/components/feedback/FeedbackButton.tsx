"use client"

import { useState, useEffect, useRef } from "react"
import {
  MessageSquare,
  X,
  Bug,
  Lightbulb,
  HelpCircle,
  Send,
  Loader2,
  Check,
  Camera,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

type FeedbackTyp = "bug" | "wunsch" | "frage" | "ux_problem" | "datenfehler" | "performance" | null
type Severity = "blocker" | "hoch" | "mittel" | "niedrig"

interface FeedbackButtonProps {
  nutzer?: string
}

const collectBrowserInfo = () => ({
  userAgent: navigator.userAgent,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  language: navigator.language,
  online: navigator.onLine,
  url: window.location.href,
  title: document.title,
})

export function FeedbackButton({ nutzer }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [typ, setTyp] = useState<FeedbackTyp>(null)
  const [text, setText] = useState("")
  const [severity, setSeverity] = useState<Severity>("mittel")
  const [expectedBehavior, setExpectedBehavior] = useState("")
  const [showExpected, setShowExpected] = useState(false)
  const [screenshotEnabled, setScreenshotEnabled] = useState(false)
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null)
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Console error collector
  const errorLogRef = useRef<string[]>([])
  useEffect(() => {
    const orig = console.error
    console.error = (...args: unknown[]) => {
      errorLogRef.current = [
        ...errorLogRef.current.slice(-4),
        args.map(String).join(" "),
      ]
      orig(...args)
    }
    return () => {
      console.error = orig
    }
  }, [])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setTyp(null)
        setText("")
        setSeverity("mittel")
        setExpectedBehavior("")
        setShowExpected(false)
        setScreenshotEnabled(false)
        setScreenshotDataUrl(null)
        setError(null)
        setShowSuccess(false)
      }, 200)
    }
  }, [isOpen])

  const doCapture = async () => {
    setIsCapturingScreenshot(true)
    try {
      const { captureScreenshot } = await import("@/lib/screenshot")
      const dataUrl = await captureScreenshot()
      setScreenshotDataUrl(dataUrl)
    } catch {
      setScreenshotDataUrl(null)
    } finally {
      setIsCapturingScreenshot(false)
    }
  }

  // Auto-capture screenshot when toggle is enabled
  useEffect(() => {
    if (screenshotEnabled && !screenshotDataUrl && !isCapturingScreenshot) {
      doCapture()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshotEnabled])

  const handleSubmit = async () => {
    if (!typ || !text.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      let screenshotUrl: string | null = null
      if (screenshotDataUrl) {
        const { uploadScreenshot } = await import("@/lib/screenshot")
        screenshotUrl = await uploadScreenshot(screenshotDataUrl)
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ,
          text: text.trim(),
          seite: typeof window !== "undefined" ? window.location.pathname : undefined,
          nutzer,
          severity,
          screenshotUrl,
          expectedBehavior: expectedBehavior.trim() || undefined,
          browserInfo: collectBrowserInfo(),
          technicalContext: {
            consoleErrors: errorLogRef.current,
            loadTime: performance.now(),
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Fehler beim Senden")
      }

      setShowSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Senden")
    } finally {
      setIsSubmitting(false)
    }
  }

  const typOptions = [
    { value: "bug" as const, label: "Bug", icon: Bug, color: "#dc2626" },
    { value: "wunsch" as const, label: "Wunsch", icon: Lightbulb, color: "#f59e0b" },
    { value: "frage" as const, label: "Frage", icon: HelpCircle, color: "#3b82f6" },
    { value: "ux_problem" as const, label: "UX", icon: AlertTriangle, color: "#f97316" },
    { value: "datenfehler" as const, label: "Daten", icon: Database, color: "#8b5cf6" },
    { value: "performance" as const, label: "Perf.", icon: BarChart3, color: "#06b6d4" },
  ]

  const severityOptions: { value: Severity; label: string; color: string }[] = [
    { value: "blocker", label: "Blocker", color: "#dc2626" },
    { value: "hoch", label: "Hoch", color: "#f97316" },
    { value: "mittel", label: "Mittel", color: "#eab308" },
    { value: "niedrig", label: "Niedrig", color: "#22c55e" },
  ]

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          backgroundColor: "var(--color-primary)",
          color: "var(--color-on-primary)",
        }}
        title="Feedback geben"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setIsOpen(false)}
        >
          {/* Modal */}
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                backgroundColor: "var(--color-surface-container)",
                borderBottom: "1px solid var(--color-outline-variant)",
              }}
            >
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--color-on-surface)" }}
              >
                Feedback geben
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {showSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-primary-container)" }}
                  >
                    <Check
                      className="w-8 h-8"
                      style={{ color: "var(--color-on-primary-container)" }}
                    />
                  </div>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    Danke!
                  </p>
                  <p
                    className="text-sm text-center"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    Dein Feedback wurde gesendet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Type Selection */}
                  <div className="mb-4">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      Was möchtest du melden?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {typOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = typ === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={() => setTyp(option.value)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all text-sm"
                            style={{
                              backgroundColor: isSelected
                                ? option.color + "20"
                                : "var(--color-surface-container)",
                              border: `2px solid ${isSelected ? option.color : "transparent"}`,
                              color: isSelected
                                ? option.color
                                : "var(--color-on-surface-variant)",
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Severity */}
                  {typ && (
                    <div className="mb-4">
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        Priorität
                      </label>
                      <div className="flex gap-2">
                        {severityOptions.map((opt) => {
                          const isSelected = severity === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setSeverity(opt.value)}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                              style={{
                                backgroundColor: isSelected
                                  ? opt.color + "20"
                                  : "var(--color-surface-container)",
                                border: `2px solid ${isSelected ? opt.color : "transparent"}`,
                                color: isSelected
                                  ? opt.color
                                  : "var(--color-on-surface-variant)",
                              }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text Area */}
                  <div className="mb-4">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      Was möchtest du mitteilen?
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Beschreibe dein Anliegen..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl resize-none transition-colors"
                      style={{
                        backgroundColor: "var(--color-surface-container-low)",
                        color: "var(--color-on-surface)",
                        border: "1px solid var(--color-outline-variant)",
                      }}
                    />
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {text.length}/5000 Zeichen
                    </p>
                  </div>

                  {/* Expected Behavior (collapsible) */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowExpected(!showExpected)}
                      className="flex items-center gap-1 text-sm font-medium"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {showExpected ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      Was wurde erwartet?
                    </button>
                    {showExpected && (
                      <textarea
                        value={expectedBehavior}
                        onChange={(e) => setExpectedBehavior(e.target.value)}
                        placeholder="Was hätte passieren sollen..."
                        rows={2}
                        className="w-full mt-2 px-4 py-3 rounded-xl resize-none transition-colors"
                        style={{
                          backgroundColor: "var(--color-surface-container-low)",
                          color: "var(--color-on-surface)",
                          border: "1px solid var(--color-outline-variant)",
                        }}
                      />
                    )}
                  </div>

                  {/* Screenshot Toggle */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={screenshotEnabled}
                        onChange={(e) => setScreenshotEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <span
                        className="text-sm font-medium flex items-center gap-1"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        <Camera className="w-4 h-4" />
                        Screenshot anhängen
                      </span>
                    </label>
                    {screenshotEnabled && (
                      <div className="mt-2">
                        {isCapturingScreenshot ? (
                          <div
                            className="flex items-center gap-2 text-sm py-2"
                            style={{ color: "var(--color-on-surface-variant)" }}
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Screenshot wird aufgenommen...
                          </div>
                        ) : screenshotDataUrl ? (
                          <div className="space-y-2">
                            <img
                              src={screenshotDataUrl}
                              alt="Screenshot Vorschau"
                              className="w-full rounded-lg border"
                              style={{ borderColor: "var(--color-outline-variant)" }}
                            />
                            <button
                              onClick={doCapture}
                              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{
                                backgroundColor: "var(--color-surface-container)",
                                color: "var(--color-on-surface-variant)",
                              }}
                            >
                              <RefreshCw className="w-3 h-3" />
                              Neu aufnehmen
                            </button>
                          </div>
                        ) : (
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-on-surface-variant)" }}
                          >
                            Screenshot konnte nicht aufgenommen werden.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Honeypot (hidden) */}
                  <input
                    type="text"
                    name="website"
                    autoComplete="off"
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      opacity: 0,
                    }}
                  />

                  {/* Error */}
                  {error && (
                    <div
                      className="mb-4 px-4 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: "var(--color-error-container)",
                        color: "var(--color-on-error-container)",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!typ || !text.trim() || isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-on-primary)",
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Absenden
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
