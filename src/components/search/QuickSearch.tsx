"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Fuse from "fuse.js"
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

interface GroupedResults {
  auftraege: SearchResult[]
  mitarbeiter: SearchResult[]
  rechnungen: SearchResult[]
}

interface QuickSearchProps {
  isOpen: boolean
  onClose: () => void
}

// Fuse.js Optionen für Fuzzy-Matching
const fuseOptions: Fuse.IFuseOptions<SearchResult> = {
  keys: ["title", "subtitle"],
  threshold: 0.4, // 0 = exakt, 1 = alles matcht
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
}

export function QuickSearch({ isOpen, onClose }: QuickSearchProps) {
  const [query, setQuery] = useState("")
  const [rawResults, setRawResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fokus auf Input wenn Modal öffnet
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setRawResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Fuzzy-Matching mit Fuse.js auf Client-Seite
  const { groupedResults, flatResults } = useMemo(() => {
    if (!rawResults.length || !query.trim()) {
      return {
        groupedResults: { auftraege: [], mitarbeiter: [], rechnungen: [] },
        flatResults: [],
      }
    }

    // Fuse.js für Fuzzy-Matching
    const fuse = new Fuse(rawResults, fuseOptions)
    const fuzzyResults = fuse.search(query)
    
    // Falls Fuzzy keine Ergebnisse liefert, alle rawResults zurückgeben
    const matchedResults = fuzzyResults.length > 0
      ? fuzzyResults.map((r) => r.item)
      : rawResults

    // Gruppieren nach Typ
    const grouped: GroupedResults = {
      auftraege: matchedResults.filter((r) => r.type === "auftrag"),
      mitarbeiter: matchedResults.filter((r) => r.type === "mitarbeiter"),
      rechnungen: matchedResults.filter((r) => r.type === "rechnung"),
    }

    // Flache Liste für Navigation (Reihenfolge: Aufträge, Mitarbeiter, Rechnungen)
    const flat = [...grouped.auftraege, ...grouped.mitarbeiter, ...grouped.rechnungen]

    return { groupedResults: grouped, flatResults: flat }
  }, [rawResults, query])

  // Debounced Search (API-Calls)
  useEffect(() => {
    if (!query.trim()) {
      setRawResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const searchResults: SearchResult[] = []

        // Parallel API calls
        const [auftraegeRes, mitarbeiterRes, rechnungenRes] = await Promise.allSettled([
          fetch(`/api/auftraege?search=${encodeURIComponent(query)}&limit=10`),
          fetch(`/api/mitarbeiter?search=${encodeURIComponent(query)}&limit=10`),
          fetch(`/api/rechnungen?search=${encodeURIComponent(query)}&limit=10`),
        ])

        if (auftraegeRes.status === "fulfilled" && auftraegeRes.value.ok) {
          const data = await auftraegeRes.value.json()
          const auftraege = Array.isArray(data) ? data : data.auftraege ?? []
          auftraege.forEach((a: { id: string; titel?: string; nummer?: string; waldbesitzer?: string; kunde?: { name?: string } }) => {
            searchResults.push({
              id: a.id,
              title: a.titel || a.nummer || "Auftrag",
              subtitle: a.waldbesitzer || a.kunde?.name,
              type: "auftrag",
              href: `/auftraege/${a.id}`,
            })
          })
        }

        if (mitarbeiterRes.status === "fulfilled" && mitarbeiterRes.value.ok) {
          const data = await mitarbeiterRes.value.json()
          const mitarbeiter = Array.isArray(data) ? data : (data.items ?? data.mitarbeiter ?? [])
          mitarbeiter.forEach((m: { id: string; vorname?: string; nachname?: string; rolle?: string; email?: string }) => {
            searchResults.push({
              id: m.id,
              title: `${m.vorname ?? ""} ${m.nachname ?? ""}`.trim() || "Mitarbeiter",
              subtitle: m.rolle || m.email,
              type: "mitarbeiter",
              href: `/mitarbeiter/${m.id}`,
            })
          })
        }

        if (rechnungenRes.status === "fulfilled" && rechnungenRes.value.ok) {
          const data = await rechnungenRes.value.json()
          const rechnungen = Array.isArray(data) ? data : data.rechnungen ?? []
          rechnungen.forEach((r: { id: string; nummer?: string; betrag?: number; status?: string; kunde?: { name?: string } }) => {
            searchResults.push({
              id: r.id,
              title: r.nummer || "Rechnung",
              subtitle: r.kunde?.name 
                ? `${r.kunde.name}${r.betrag ? ` · ${r.betrag.toFixed(2)} €` : ""}`
                : r.betrag ? `${r.betrag.toFixed(2)} € · ${r.status}` : r.status,
              type: "rechnung",
              href: `/rechnungen/${r.id}`,
            })
          })
        }

        setRawResults(searchResults)
        setSelectedIndex(0)
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  // Keyboard Navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && flatResults[selectedIndex]) {
        e.preventDefault()
        router.push(flatResults[selectedIndex].href)
        onClose()
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    },
    [flatResults, selectedIndex, router, onClose]
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
        return "Aufträge"
      case "mitarbeiter":
        return "Mitarbeiter"
      case "rechnung":
        return "Rechnungen"
    }
  }

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "auftrag":
        return <ClipboardList className="w-3.5 h-3.5" />
      case "mitarbeiter":
        return <Users className="w-3.5 h-3.5" />
      case "rechnung":
        return <Receipt className="w-3.5 h-3.5" />
    }
  }

  // Render eine Gruppe von Ergebnissen
  const renderGroup = (
    type: SearchResult["type"],
    items: SearchResult[],
    startIndex: number
  ) => {
    if (items.length === 0) return null

    return (
      <div key={type} className="py-1">
        {/* Gruppen-Header */}
        <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">
          {getTypeIcon(type)}
          <span>{getTypeLabel(type)}</span>
          <span className="text-[var(--color-on-surface-variant)]">({items.length})</span>
        </div>
        {/* Ergebnisse */}
        {items.map((result, idx) => {
          const globalIndex = startIndex + idx
          return (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                router.push(result.href)
                onClose()
              }}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                globalIndex === selectedIndex
                  ? "bg-forest text-white"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[#222]"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                  globalIndex === selectedIndex
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-surface-container-highest text-[var(--color-on-surface-variant)]"
                )}
              >
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{result.title}</p>
                {result.subtitle && (
                  <p className="text-xs text-[var(--color-on-surface-variant)] truncate">{result.subtitle}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  // Berechne Start-Indizes für jede Gruppe
  const auftraegeStartIndex = 0
  const mitarbeiterStartIndex = groupedResults.auftraege.length
  const rechnungenStartIndex = mitarbeiterStartIndex + groupedResults.mitarbeiter.length

  const hasResults = flatResults.length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[12%] mx-auto max-w-xl z-50 px-4">
        <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-[var(--color-on-surface-variant)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Suche nach Aufträgen, Mitarbeitern, Rechnungen..."
              className="flex-1 bg-transparent text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Fuzzy-Matching Hinweis */}
          {query.length >= 2 && hasResults && (
            <div className="px-4 py-1.5 text-[10px] text-[var(--color-on-surface-variant)] border-b border-border flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
              Fuzzy-Suche aktiv · Tippfehler werden ignoriert
            </div>
          )}

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-flex items-center gap-2 text-[var(--color-on-surface-variant)] text-sm">
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
                  Suche läuft...
                </div>
              </div>
            ) : query && !hasResults ? (
              <div className="px-4 py-8 text-center text-[var(--color-on-surface-variant)] text-sm">
                <p>Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                  Versuche eine andere Schreibweise
                </p>
              </div>
            ) : hasResults ? (
              <div className="divide-y divide-border">
                {renderGroup("auftrag", groupedResults.auftraege, auftraegeStartIndex)}
                {renderGroup("mitarbeiter", groupedResults.mitarbeiter, mitarbeiterStartIndex)}
                {renderGroup("rechnung", groupedResults.rechnungen, rechnungenStartIndex)}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-[var(--color-on-surface-variant)] text-sm">
                <p>Tippen Sie, um zu suchen</p>
                <p className="text-xs mt-1.5 text-[var(--color-on-surface-variant)]">
                  Mind. 2 Zeichen · Tippfehler-tolerant
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-[var(--color-on-surface-variant)]">
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
              <kbd className="px-1.5 py-0.5 bg-surface-container-highest rounded text-[10px]">ESC</kbd>
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
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] hover:text-[var(--color-on-surface)] transition-all"
    >
      <Search className="w-4 h-4" />
      <span className="flex-1 text-left">Suchen</span>
      <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-container-highest rounded text-[10px] text-[var(--color-on-surface-variant)]">
        <Command className="w-2.5 h-2.5" />K
      </kbd>
    </button>
  )
}
