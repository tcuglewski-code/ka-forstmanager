"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { GracePeriodBanner } from "./GracePeriodBanner"
import { ForstManagerTour } from "@/components/tour/ForstManagerTour"
import { QuickSearch } from "@/components/search/QuickSearch"
import { KeyboardShortcuts } from "@/components/shortcuts/KeyboardShortcuts"
import { FeedbackButton } from "@/components/feedback/FeedbackButton"
import { NotificationPanel } from "./NotificationPanel"
import { useNotifications } from "@/hooks/useNotifications"
import { Bell, User, Search, HelpCircle } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  // Tour nur auf der Dashboard-Seite automatisch starten — auf anderen Seiten
  // existieren die `data-tour="dashboard"`-Anker nicht und das Overlay blockiert
  // den ersten View (z.B. /baumschulen/bestellungen).
  const tourAutoStart = pathname === "/dashboard"

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <Sidebar />

      <div className="flex-1 ml-0 lg:ml-60 flex flex-col min-h-screen">
        {/* TopBar */}
        <header
          className="sticky top-0 z-20 px-6 py-3 flex items-center gap-4"
          style={{
            backgroundColor: "var(--color-background)",
            borderBottom: "1px solid var(--color-border)",
            boxShadow: "0 1px 0 rgba(26,46,26,0.06)",
          }}
        >
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm flex-1 max-w-xs tonal-transition"
            style={{
              backgroundColor: "var(--color-surface-container-low)",
              color: "var(--color-on-surface-variant)",
              border: "1px solid var(--color-border)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "var(--color-surface-container)"
              e.currentTarget.style.borderColor = "var(--color-primary)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "var(--color-surface-container-low)"
              e.currentTarget.style.borderColor = "var(--color-border)"
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">
              {title ? `Suche in ${title}…` : "Ressourcen, Mitarbeiter…"}
            </span>
            <kbd
              className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
              style={{
                backgroundColor: "var(--color-surface-container-high)",
                color: "var(--color-outline)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ⌘K
            </kbd>
          </button>

          <div className="flex-1" />

          {/* Live Sync indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "var(--color-outline)" }}>
            <span className="moss-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Live Sync
            </span>
          </div>

          {/* Page Title (if set) */}
          {title && (
            <h1
              className="hidden md:block text-base font-semibold tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-on-surface)",
              }}
            >
              {title}
            </h1>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            <a
              href="https://docs.feldhub.de"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl tonal-transition"
              style={{ color: "var(--color-on-surface-variant)" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              title="Hilfe & Dokumentation"
            >
              <HelpCircle className="w-5 h-5" />
            </a>
            <button
              className="relative p-2 rounded-xl tonal-transition"
              style={{ color: "var(--color-on-surface-variant)" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              title="Benachrichtigungen"
              onClick={() => setNotificationsOpen(o => !o)}
              aria-label={unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigungen` : "Benachrichtigungen"}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--color-gold)",
                    color: "#1A2E1A",
                    border: "2px solid var(--color-background)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center tonal-transition"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#F7F6F0",
                fontFamily: "var(--font-mono)",
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-primary-deep, #0d1a0d)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-primary)")}
              title="Profil"
              onClick={() => router.push("/profil")}
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Grace Period Banner (Sprint OG: IMPL-CHURN-07) */}
        <GracePeriodBanner />

        {/* Main Content */}
        <main
          className="flex-1 p-6 md:p-8"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          {children}
        </main>
      </div>

      {/* Global Components */}
      <ForstManagerTour autoStart={tourAutoStart} />
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <KeyboardShortcuts onOpenSearch={() => setSearchOpen(true)} />
      <FeedbackButton />
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  )
}
