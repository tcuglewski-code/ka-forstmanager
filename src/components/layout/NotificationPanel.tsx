"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Clipboard, AlertTriangle, PenLine, Info, X, CheckCheck } from "lucide-react"
import { useNotifications, type NotificationItem, type NotificationType } from "@/hooks/useNotifications"

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

function iconFor(type: NotificationType) {
  const cls = "w-4 h-4"
  switch (type) {
    case "auftrag_neu":
      return <Clipboard className={cls} />
    case "lager_warnung":
      return <AlertTriangle className={cls} />
    case "signatur_faellig":
      return <PenLine className={cls} />
    case "system":
    default:
      return <Info className={cls} />
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "gerade eben"
  if (min < 60) return `vor ${min} Min.`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} Std.`
  const d = Math.floor(h / 24)
  if (d < 7) return `vor ${d} Tag${d === 1 ? "" : "en"}`
  return new Date(iso).toLocaleDateString("de-DE")
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications()

  // Click outside
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open, onClose])

  const handleClick = (n: NotificationItem) => {
    if (!n.read) markAsRead(n.id)
    if (n.link) {
      onClose()
      router.push(n.link)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(17,41,31,0.18)" }}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Benachrichtigungen"
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] flex flex-col shadow-2xl"
        style={{
          backgroundColor: "var(--color-surface)",
          borderLeft: "1px solid var(--color-outline-variant)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
        >
          <h2
            className="text-base font-semibold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-on-surface)",
            }}
          >
            Benachrichtigungen
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs tonal-transition"
              style={{ color: "var(--color-on-surface-variant)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              title="Alle als gelesen markieren"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Alle gelesen
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg tonal-transition"
              style={{ color: "var(--color-on-surface-variant)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div
              className="p-6 text-center text-sm"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Lädt…
            </div>
          ) : notifications.length === 0 ? (
            <div
              className="p-10 text-center text-sm"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Keine Benachrichtigungen
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className="w-full text-left px-5 py-4 flex gap-3 tonal-transition"
                    style={{
                      borderBottom: "1px solid var(--color-outline-variant)",
                      backgroundColor: n.read
                        ? "transparent"
                        : "var(--color-surface-container-low)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--color-surface-container)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = n.read
                        ? "transparent"
                        : "var(--color-surface-container-low)")
                    }
                  >
                    <span
                      className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--color-surface-container)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {iconFor(n.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-tight ${n.read ? "font-medium" : "font-semibold"}`}
                          style={{ color: "var(--color-on-surface)" }}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span
                            className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                            style={{ backgroundColor: "var(--color-primary)" }}
                            aria-label="ungelesen"
                          />
                        )}
                      </div>
                      <p
                        className="text-xs mt-1 leading-snug"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {n.message}
                      </p>
                      <p
                        className="text-[11px] mt-1.5"
                        style={{ color: "var(--color-outline)" }}
                      >
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
