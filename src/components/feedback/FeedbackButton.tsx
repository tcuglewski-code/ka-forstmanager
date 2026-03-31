"use client"

import { useState, useEffect } from "react"
import { MessageSquare, X, Bug, Lightbulb, HelpCircle, Send, Loader2, Check } from "lucide-react"

type FeedbackTyp = "bug" | "wunsch" | "frage" | null

interface FeedbackButtonProps {
  nutzer?: string
}

export function FeedbackButton({ nutzer }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [typ, setTyp] = useState<FeedbackTyp>(null)
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setTyp(null)
        setText("")
        setError(null)
        setShowSuccess(false)
      }, 200)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!typ || !text.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ,
          text: text.trim(),
          seite: typeof window !== "undefined" ? window.location.pathname : undefined,
          nutzer,
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
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
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
                    Danke! 🙏
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
                    <div className="flex gap-2">
                      {typOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = typ === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={() => setTyp(option.value)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all"
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
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

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
