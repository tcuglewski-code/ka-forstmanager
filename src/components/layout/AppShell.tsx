"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { GracePeriodBanner } from "./GracePeriodBanner"
import { ForstManagerTour } from "@/components/tour/ForstManagerTour"
import { QuickSearch } from "@/components/search/QuickSearch"
import { KeyboardShortcuts } from "@/components/shortcuts/KeyboardShortcuts"
import { FeedbackButton } from "@/components/feedback/FeedbackButton"
import { Bell, User, Search, HelpCircle } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false)

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
            backgroundColor: "var(--color-surface)",
            boxShadow: "0 1px 0 var(--color-outline-variant), 0 4px 16px rgba(17,41,31,0.04)",
          }}
        >
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm flex-1 max-w-xs tonal-transition"
            style={{
              backgroundColor: "var(--color-surface-container-low)",
              color: "var(--color-on-surface-variant)",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container-low)")}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">
              {title ? `Suche in ${title}…` : "Ressourcen, Mitarbeiter…"}
            </span>
            <kbd
              className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{
                backgroundColor: "var(--color-surface-container-high)",
                color: "var(--color-outline)",
              }}
            >
              ⌘K
            </kbd>
          </button>

          <div className="flex-1" />

          {/* Live Sync indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "var(--color-outline)" }}>
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
            Live Sync
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
              className="p-2 rounded-xl tonal-transition"
              style={{ color: "var(--color-on-surface-variant)" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              title="Benachrichtigungen"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-xl tonal-transition"
              style={{ color: "var(--color-on-surface-variant)" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              title="Profil"
            >
              <User className="w-5 h-5" />
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
      <ForstManagerTour autoStart={true} />
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <KeyboardShortcuts onOpenSearch={() => setSearchOpen(true)} />
      <FeedbackButton />
    </div>
  )
}
