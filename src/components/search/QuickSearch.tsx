"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  ClipboardList,
  Users,
  Receipt,
  X,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: "auftrag" | "mitarbeiter" | "rechnung"
  href: string
}

interface QuickSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickSearch({ isOpen, onClose }: QuickSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fokus auf Input wenn Modal öffnet
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const searchResults: SearchResult[] = []

        // Parallel API calls
        const [auftraegeRes, mitarbeiterRes, rechnungenRes] = await Promise.allSettled([
          fetch(`/api/auftraege?search=${encodeURIComponent(query)}&limit=5`),
          fetch(`/api/mitarbeiter?search=${encodeURIComponent(query)}&limit=5`),
          fetch(`/api/rechnungen?search=${encodeURIComponent(query)}&limit=5`),
        ])

        if (auftraegeRes.status === "fulfilled" && auftraegeRes.value.ok) {
          const data = await auftraegeRes.value.json()
          const auftraege = Array.isArray(data) ? data : data.auftraege ?? []
          auftraege.slice(0, 5).forEach((a: { id: string; titel?: string; nummer?: string; waldbesitzer?: string }) => {
            searchResults.push({
              id: a.id,
              title: a.titel || a.nummer || "Auftrag",
              subtitle: a.waldbesitzer,
              type: "auftrag",
              href: `/auftraege/${a.id}`,
            })
          })
        }

        if (mitarbeiterRes.status === "fulfilled" && mitarbeiterRes.value.ok) {
          const data = await mitarbeiterRes.value.json()
          const mitarbeiter = Array.isArray(data) ? data : data.mitarbeiter ?? []
          mitarbeiter.slice(0, 5).forEach((m: { id: string; vorname?: string; nachname?: string; rolle?: string }) => {
            searchResults.push({
              id: m.id,
              title: `${m.vorname ?? ""} ${m.nachname ?? ""}`.trim() || "Mitarbeiter",
              subtitle: m.rolle,
              type: "mitarbeiter",
              href: `/mitarbeiter/${m.id}`,
            })
          })
        }

        if (rechnungenRes.status === "fulfilled" && rechnungenRes.value.ok) {
          const data = await rechnungenRes.value.json()
          const rechnungen = Array.isArray(data) ? data : data.rechnungen ?? []
          rechnungen.slice(0, 5).forEach((r: { id: string; nummer?: string; betrag?: number; status?: string }) => {
            searchResults.push({
              id: r.id,
              title: r.nummer || "Rechnung",
              subtitle: r.betrag ? `${r.betrag.toFixed(2)} € · ${r.status}` : r.status,
              type: "rechnung",
              href: `/rechnungen/${r.id}`,
            })
          })
        }

        setResults(searchResults)
        setSelectedIndex(0)
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Keyboard Navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault()
        router.push(results[selectedIndex].href)
        onClose()
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    },
    [results, selectedIndex, router, onClose]
  )

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "auftrag":
        return <ClipboardList className="w-4 h-4" />
      case "mitarbeiter":
        return <Users className="w-4 h-4" />
      case "rechnung":
        return <Receipt className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "auftrag":
        return "Auftrag"
      case "mitarbeiter":
        return "Mitarbeiter"
      case "rechnung":
        return "Rechnung"
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[15%] mx-auto max-w-xl z-50 px-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
            <Search className="w-5 h-5 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Suche nach Aufträgen, Mitarbeitern, Rechnungen..."
              className="flex-1 bg-transparent text-white placeholder:text-zinc-500 text-sm outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                Suche läuft...
              </div>
            ) : query && results.length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                Keine Ergebnisse für &ldquo;{query}&rdquo;
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      router.push(result.href)
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      index === selectedIndex
                        ? "bg-[#2C3A1C] text-white"
                        : "text-zinc-400 hover:bg-[#222]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        index === selectedIndex
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-[#2a2a2a] text-zinc-500"
                      )}
                    >
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-zinc-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-zinc-600">{getTypeLabel(result.type)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-zinc-600 text-sm">
                Tippen Sie, um zu suchen
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#2a2a2a] text-xs text-zinc-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <ArrowDown className="w-3 h-3" />
                Navigieren
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" />
                Öffnen
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] rounded text-[10px]">ESC</kbd>
              Schließen
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

// Globaler Quick-Search Provider
export function QuickSearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K oder Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      {children}
      <QuickSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

// Trigger-Button für Sidebar
export function QuickSearchTrigger() {
  const [, setIsOpen] = useState(false)

  const openSearch = () => {
    // Dispatch custom event das vom Provider gehört wird
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <button
      onClick={openSearch}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1e1e1e] hover:text-white transition-all"
    >
      <Search className="w-4 h-4" />
      <span className="flex-1 text-left">Suchen</span>
      <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#2a2a2a] rounded text-[10px] text-zinc-500">
        <Command className="w-2.5 h-2.5" />K
      </kbd>
    </button>
  )
}
