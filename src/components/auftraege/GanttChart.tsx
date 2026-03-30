"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Calendar, ZoomIn, ZoomOut } from "lucide-react"

interface Auftrag {
  id: string
  titel: string
  typ: string
  status: string
  startDatum?: string | null
  endDatum?: string | null
  waldbesitzer?: string | null
  flaeche_ha?: number | null
  gruppe?: { id: string; name: string } | null
}

interface GanttChartProps {
  auftraege: Auftrag[]
  onAuftragClick?: (id: string) => void
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "#3b82f6",      // blue
  geplant: "#06b6d4",      // cyan
  aktiv: "#84cc16",        // lime
  geprueft: "#0ea5e9",     // sky
  angebot: "#8b5cf6",      // violet
  bestaetigt: "#f59e0b",   // amber
  angenommen: "#22c55e",   // green
  in_ausfuehrung: "#10b981", // emerald
  abgeschlossen: "#16a34a",  // green-600
  laufend: "#10b981",      // emerald
  auftrag: "#f59e0b",      // amber
  maengel_offen: "#ef4444", // red
  abnahme: "#a855f7",      // purple
}

const TYP_LABELS: Record<string, string> = {
  pflanzung: "Pflanzung",
  flaechenvorbereitung: "Flächenvorb.",
  foerderberatung: "Förderberatung",
  zaunbau: "Zaunbau",
  kulturschutz: "Kulturschutz",
  kulturpflege: "Kulturpflege",
  saatguternte: "Saatguternte",
}

type ViewMode = "month" | "quarter"

export function GanttChart({ auftraege, onAuftragClick }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [viewOffset, setViewOffset] = useState(0) // Monate-Offset von heute

  // Berechne Start- und Enddatum des sichtbaren Bereichs
  const { startDate, endDate, columns } = useMemo(() => {
    const today = new Date()
    const startMonth = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1)
    
    let monthsToShow: number
    if (viewMode === "month") {
      monthsToShow = 3 // 3 Monate
    } else {
      monthsToShow = 6 // 6 Monate (Quartal + 1)
    }

    const endMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + monthsToShow, 0)

    // Generiere Spalten-Headers
    const cols: { date: Date; label: string; width: number }[] = []
    for (let i = 0; i < monthsToShow; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1)
      cols.push({
        date: d,
        label: d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
        width: 100 / monthsToShow,
      })
    }

    return { startDate: startMonth, endDate: endMonth, columns: cols }
  }, [viewMode, viewOffset])

  // Filtere Aufträge die im sichtbaren Bereich liegen (und Start+End haben)
  const visibleAuftraege = useMemo(() => {
    return auftraege.filter((a) => {
      if (!a.startDatum) return false
      const start = new Date(a.startDatum)
      const end = a.endDatum ? new Date(a.endDatum) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000) // Default 1 Woche
      
      // Prüfe ob Überlappung mit sichtbarem Bereich
      return start <= endDate && end >= startDate
    }).sort((a, b) => {
      // Sortiere nach Startdatum
      const startA = new Date(a.startDatum!).getTime()
      const startB = new Date(b.startDatum!).getTime()
      return startA - startB
    })
  }, [auftraege, startDate, endDate])

  // Berechne Position und Breite eines Balkens
  const getBarStyle = (auftrag: Auftrag) => {
    const start = new Date(auftrag.startDatum!)
    const end = auftrag.endDatum 
      ? new Date(auftrag.endDatum) 
      : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Clamp start/end to visible range
    const clampedStart = Math.max(start.getTime(), startDate.getTime())
    const clampedEnd = Math.min(end.getTime(), endDate.getTime())

    const startOffset = (clampedStart - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const duration = (clampedEnd - clampedStart) / (1000 * 60 * 60 * 24)

    const left = (startOffset / totalDays) * 100
    const width = Math.max((duration / totalDays) * 100, 2) // Minimum 2% Breite

    return { left: `${left}%`, width: `${width}%` }
  }

  const ROW_HEIGHT = 44
  const HEADER_HEIGHT = 48
  const LABEL_WIDTH = 280 // Breite für Auftrags-Labels

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-400">
            {startDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })} – {endDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Navigation */}
          <button
            onClick={() => setViewOffset((o) => o - (viewMode === "month" ? 1 : 3))}
            className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-colors"
            title="Zurück"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewOffset(0)}
            className="px-2 py-1 text-xs rounded-lg hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-colors"
          >
            Heute
          </button>
          <button
            onClick={() => setViewOffset((o) => o + (viewMode === "month" ? 1 : 3))}
            className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-colors"
            title="Vorwärts"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 ml-4 bg-[#1e1e1e] rounded-lg p-1">
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === "month" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <ZoomIn className="w-3 h-3" />
              Monat
            </button>
            <button
              onClick={() => setViewMode("quarter")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === "quarter" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <ZoomOut className="w-3 h-3" />
              Quartal
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: "900px" }}>
          {/* Header Row */}
          <div className="flex border-b border-[#2a2a2a]" style={{ height: HEADER_HEIGHT }}>
            {/* Label Column Header */}
            <div
              className="flex-shrink-0 flex items-center px-4 bg-[#1a1a1a] border-r border-[#2a2a2a]"
              style={{ width: LABEL_WIDTH }}
            >
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Auftrag</span>
            </div>
            
            {/* Month Headers */}
            <div className="flex-1 flex">
              {columns.map((col, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center border-r border-[#2a2a2a] last:border-r-0"
                  style={{ width: `${col.width}%` }}
                >
                  <span className="text-xs font-medium text-zinc-400">{col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {visibleAuftraege.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-zinc-600">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine Aufträge mit Start-/Enddatum im sichtbaren Zeitraum</p>
                <p className="text-xs text-zinc-700 mt-1">Tipp: Lege Start- und Enddatum in den Auftragsdetails fest</p>
              </div>
            </div>
          ) : (
            visibleAuftraege.map((auftrag, rowIndex) => {
              const barStyle = getBarStyle(auftrag)
              const statusColor = STATUS_FARBEN[auftrag.status] || "#71717a"

              return (
                <div
                  key={auftrag.id}
                  className="flex border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onAuftragClick?.(auftrag.id)}
                >
                  {/* Label Column */}
                  <div
                    className="flex-shrink-0 flex items-center gap-3 px-4 border-r border-[#2a2a2a] bg-[#161616]"
                    style={{ width: LABEL_WIDTH }}
                  >
                    {/* Status Indicator */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusColor }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate" title={auftrag.titel}>
                        {auftrag.titel}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {TYP_LABELS[auftrag.typ] || auftrag.typ}
                        {auftrag.gruppe?.name && ` • ${auftrag.gruppe.name}`}
                      </p>
                    </div>
                  </div>

                  {/* Bar Area */}
                  <div className="flex-1 relative">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex">
                      {columns.map((_, i) => (
                        <div
                          key={i}
                          className="border-r border-[#1e1e1e] last:border-r-0"
                          style={{ width: `${100 / columns.length}%` }}
                        />
                      ))}
                    </div>

                    {/* Today Line */}
                    {(() => {
                      const today = new Date()
                      if (today >= startDate && today <= endDate) {
                        const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                        const todayOffset = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                        const leftPercent = (todayOffset / totalDays) * 100
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-emerald-500/50"
                            style={{ left: `${leftPercent}%` }}
                          />
                        )
                      }
                      return null
                    })()}

                    {/* Bar */}
                    <div
                      className="absolute top-2 bottom-2 rounded-md flex items-center px-2 group transition-all hover:brightness-110"
                      style={{
                        ...barStyle,
                        backgroundColor: statusColor,
                      }}
                    >
                      <span className="text-xs text-white font-medium truncate opacity-90">
                        {auftrag.flaeche_ha ? `${auftrag.flaeche_ha} ha` : ""}
                      </span>
                      
                      {/* Hover Tooltip */}
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                          <p className="text-xs font-medium text-white">{auftrag.titel}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {new Date(auftrag.startDatum!).toLocaleDateString("de-DE")}
                            {auftrag.endDatum && ` – ${new Date(auftrag.endDatum).toLocaleDateString("de-DE")}`}
                          </p>
                          {auftrag.waldbesitzer && (
                            <p className="text-xs text-zinc-500">{auftrag.waldbesitzer}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-zinc-600">Legende:</span>
          {[
            { status: "anfrage", label: "Anfrage" },
            { status: "geplant", label: "Geplant" },
            { status: "in_ausfuehrung", label: "In Ausführung" },
            { status: "abgeschlossen", label: "Abgeschlossen" },
          ].map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: STATUS_FARBEN[item.status] }}
              />
              <span className="text-xs text-zinc-500">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-4">
            <div className="w-px h-3 bg-emerald-500" />
            <span className="text-xs text-zinc-500">Heute</span>
          </div>
        </div>
      </div>
    </div>
  )
}
