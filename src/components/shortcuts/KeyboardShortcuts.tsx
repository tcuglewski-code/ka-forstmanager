"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Command, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"

interface Shortcut {
  keys: string[]
  description: string
  action?: () => void
}

interface KeyboardShortcutsProps {
  onOpenSearch: () => void
}

export function KeyboardShortcuts({ onOpenSearch }: KeyboardShortcutsProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [gMode, setGMode] = useState(false)
  const gModeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const shortcuts: Shortcut[] = [
    { keys: ["⌘", "K"], description: "Schnellsuche öffnen" },
    { keys: ["⌘", "N"], description: "Neuer Auftrag" },
    { keys: ["⌘", "M"], description: "Neues Tagesprotokoll" },
    { keys: ["⌘", "R"], description: "Neue Rechnung" },
    { keys: ["⌘", "/"], description: "Diese Hilfe anzeigen" },
    { keys: ["G", "→", "D"], description: "Gehe zu Dashboard" },
    { keys: ["G", "→", "A"], description: "Gehe zu Aufträge" },
    { keys: ["G", "→", "M"], description: "Gehe zu Mitarbeiter" },
    { keys: ["G", "→", "L"], description: "Gehe zu Lager" },
    { keys: ["G", "→", "P"], description: "Gehe zu Protokolle" },
    { keys: ["G", "→", "R"], description: "Gehe zu Rechnungen" },
    { keys: ["ESC"], description: "Modal schließen" },
  ]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignoriere wenn in Input/Textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + K → Schnellsuche (handled by QuickSearchProvider, aber backup)
      if (cmdKey && e.key === "k") {
        e.preventDefault()
        onOpenSearch()
        return
      }

      // Cmd/Ctrl + N → Neuer Auftrag
      if (cmdKey && e.key === "n") {
        e.preventDefault()
        router.push("/auftraege?new=1")
        return
      }

      // Cmd/Ctrl + M → Neues Protokoll
      if (cmdKey && e.key === "m") {
        e.preventDefault()
        router.push("/protokolle?new=1")
        return
      }

      // Cmd/Ctrl + R → Neue Rechnung (verhindere Browser-Refresh)
      if (cmdKey && e.key === "r") {
        e.preventDefault()
        router.push("/rechnungen?new=1")
        return
      }

      // Cmd/Ctrl + / → Shortcuts-Hilfe
      if (cmdKey && e.key === "/") {
        e.preventDefault()
        setIsHelpOpen((prev) => !prev)
        return
      }

      // ESC → Modal schließen
      if (e.key === "Escape") {
        setIsHelpOpen(false)
        setGMode(false)
        return
      }

      // G-Mode für "G dann X" Navigation
      if (e.key === "g" && !cmdKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setGMode(true)
        // Reset G-Mode nach 2 Sekunden
        if (gModeTimerRef.current) clearTimeout(gModeTimerRef.current)
        gModeTimerRef.current = setTimeout(() => setGMode(false), 2000)
        return
      }

      // G-Mode Navigation
      if (gMode) {
        e.preventDefault()
        setGMode(false)
        if (gModeTimerRef.current) clearTimeout(gModeTimerRef.current)

        switch (e.key.toLowerCase()) {
          case "d":
            router.push("/dashboard")
            break
          case "a":
            router.push("/auftraege")
            break
          case "m":
            router.push("/mitarbeiter")
            break
          case "l":
            router.push("/lager")
            break
          case "p":
            router.push("/protokolle")
            break
          case "r":
            router.push("/rechnungen")
            break
        }
      }
    },
    [router, onOpenSearch, gMode]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // G-Mode Indicator
  useEffect(() => {
    return () => {
      if (gModeTimerRef.current) clearTimeout(gModeTimerRef.current)
    }
  }, [])

  return (
    <>
      {/* G-Mode Indicator */}
      {gMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#2C3A1C] text-emerald-400 rounded-lg shadow-xl text-sm font-medium animate-pulse">
          G-Modus aktiv – Drücke D, A, M, L, P oder R
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsHelpOpen(false)}
          />
          <div className="fixed inset-x-0 top-[15%] mx-auto max-w-md z-50 px-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2 text-white">
                  <Keyboard className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium">Tastenkürzel</span>
                </div>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-4 space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-zinc-400">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-mono",
                            key === "→"
                              ? "text-zinc-500"
                              : "bg-[#2a2a2a] text-zinc-300"
                          )}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-[#2a2a2a] text-xs text-zinc-600">
                <span className="flex items-center gap-1">
                  Auf Windows/Linux: Ctrl statt{" "}
                  <Command className="w-3 h-3" /> verwenden
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Button für Sidebar
export function ShortcutsButton({ onClick }: { onClick?: () => void }) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Dispatch keyboard event
      const event = new KeyboardEvent("keydown", {
        key: "/",
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all"
    >
      <Keyboard className="w-4 h-4" />
      <span className="flex-1 text-left">Tastenkürzel</span>
      <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#2a2a2a] rounded text-[10px] text-zinc-500">
        <Command className="w-2.5 h-2.5" />/
      </kbd>
    </button>
  )
}

// Kombinierter Provider
export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      {children}
      <KeyboardShortcuts onOpenSearch={() => setSearchOpen(true)} />
    </>
  )
}
