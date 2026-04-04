"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core"

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
  onAuftragUpdate?: () => void // Callback nach erfolgreichem Update
}

const STATUS_FARBEN: Record<string, string> = {
  anfrage: "#3b82f6",
  geplant: "#06b6d4",
  aktiv: "#84cc16",
  geprueft: "#0ea5e9",
  angebot: "#8b5cf6",
  bestaetigt: "#f59e0b",
  angenommen: "#22c55e",
  in_ausfuehrung: "#10b981",
  abgeschlossen: "#16a34a",
  laufend: "#10b981",
  auftrag: "#f59e0b",
  maengel_offen: "#ef4444",
  abnahme: "#a855f7",
}

const TYP_LABELS: Record<string, string> = {
  pflanzung: "Pflanzung",
  flaechenvorbereitung: "Flächenvorb.",
  foerderberatung: "Betriebs-Assistent",
  zaunbau: "Zaunbau",
  kulturschutz: "Kulturschutz",
  kulturpflege: "Kulturpflege",
  saatguternte: "Saatguternte",
}

type ViewMode = "month" | "quarter"

// ============================================
// Draggable Bar Component
// ============================================
interface DraggableBarProps {
  auftrag: Auftrag
  barStyle: { left: string; width: string }
  statusColor: string
  isMobile: boolean
  onMobileMove: (auftrag: Auftrag) => void
}

function DraggableBar({ auftrag, barStyle, statusColor, isMobile, onMobileMove }: DraggableBarProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: auftrag.id,
    data: { auftrag },
    disabled: isMobile,
  })

  const style = {
    ...barStyle,
    backgroundColor: statusColor,
    transform: transform ? `translateX(${transform.x}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isMobile ? "default" : "grab",
  }

  return (
    <div
      ref={setNodeRef}
      {...(isMobile ? {} : { ...listeners, ...attributes })}
      className={`absolute top-2 bottom-2 rounded-md flex items-center px-2 group transition-all hover:brightness-110 ${
        isDragging ? "ring-2 ring-emerald-400 z-50" : ""
      }`}
      style={style}
    >
      {/* Drag Handle Icon (Desktop) */}
      {!isMobile && (
        <MoveHorizontal className="w-3 h-3 mr-1 opacity-50 group-hover:opacity-100 flex-shrink-0" />
      )}
      
      <span className="text-xs text-white font-medium truncate opacity-90">
        {auftrag.flaeche_ha ? `${auftrag.flaeche_ha} ha` : ""}
      </span>

      {/* Mobile Move Button */}
      {isMobile && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMobileMove(auftrag)
          }}
          className="ml-auto p-1 rounded bg-white/20 hover:bg-white/30"
        >
          <Calendar className="w-3 h-3" />
        </button>
      )}

      {/* Hover Tooltip */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
          <p className="text-xs font-medium text-white">{auftrag.titel}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {new Date(auftrag.startDatum!).toLocaleDateString("de-DE")}
            {auftrag.endDatum && ` – ${new Date(auftrag.endDatum).toLocaleDateString("de-DE")}`}
          </p>
          {auftrag.waldbesitzer && (
            <p className="text-xs text-zinc-500">{auftrag.waldbesitzer}</p>
          )}
          {!isMobile && (
            <p className="text-xs text-emerald-400 mt-1">🖱️ Ziehen zum Verschieben</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Droppable Day Zone
// ============================================
interface DroppableDayProps {
  date: Date
  children: React.ReactNode
  totalDays: number
  startDate: Date
}

function DroppableDay({ date, children, totalDays, startDate }: DroppableDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: { date },
  })

  const dayOffset = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const width = (1 / totalDays) * 100
  const left = (dayOffset / totalDays) * 100

  return (
    <div
      ref={setNodeRef}
      className={`absolute top-0 bottom-0 transition-colors ${
        isOver ? "bg-emerald-500/20 border-l border-r border-emerald-500/50" : ""
      }`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// Mobile Date Picker Modal
// ============================================
interface MobileDateModalProps {
  auftrag: Auftrag | null
  onClose: () => void
  onSave: (auftragId: string, newStart: Date) => void
}

function MobileDateModal({ auftrag, onClose, onSave }: MobileDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    auftrag?.startDatum ? new Date(auftrag.startDatum).toISOString().split("T")[0] : ""
  )

  if (!auftrag) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-6 w-80 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-medium mb-2">Auftrag verschieben</h3>
        <p className="text-sm text-zinc-400 mb-4 truncate">{auftrag.titel}</p>
        
        <label className="block text-xs text-zinc-500 mb-1">Neues Startdatum</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-4"
        />
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-sm"
          >
            Abbrechen
          </button>
          <button
            onClick={() => {
              if (selectedDate) {
                onSave(auftrag.id, new Date(selectedDate))
              }
            }}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main GanttChart Component
// ============================================
export function GanttChart({ auftraege, onAuftragClick, onAuftragUpdate }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [viewOffset, setViewOffset] = useState(0)
  const [activeAuftrag, setActiveAuftrag] = useState<Auftrag | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileModalAuftrag, setMobileModalAuftrag] = useState<Auftrag | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Detect mobile/touch devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Configure sensors for DnD
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const sensors = useSensors(pointerSensor, touchSensor)

  // Calculate visible date range
  const { startDate, endDate, columns, totalDays } = useMemo(() => {
    const today = new Date()
    const startMonth = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1)

    const monthsToShow = viewMode === "month" ? 3 : 6
    const endMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + monthsToShow, 0)

    const cols: { date: Date; label: string; width: number }[] = []
    for (let i = 0; i < monthsToShow; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1)
      cols.push({
        date: d,
        label: d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
        width: 100 / monthsToShow,
      })
    }

    const days = Math.ceil((endMonth.getTime() - startMonth.getTime()) / (1000 * 60 * 60 * 24))

    return { startDate: startMonth, endDate: endMonth, columns: cols, totalDays: days }
  }, [viewMode, viewOffset])

  // Filter visible auftraege
  const visibleAuftraege = useMemo(() => {
    return auftraege
      .filter((a) => {
        if (!a.startDatum) return false
        const start = new Date(a.startDatum)
        const end = a.endDatum
          ? new Date(a.endDatum)
          : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
        return start <= endDate && end >= startDate
      })
      .sort((a, b) => new Date(a.startDatum!).getTime() - new Date(b.startDatum!).getTime())
  }, [auftraege, startDate, endDate])

  // Calculate bar position
  const getBarStyle = useCallback(
    (auftrag: Auftrag) => {
      const start = new Date(auftrag.startDatum!)
      const end = auftrag.endDatum
        ? new Date(auftrag.endDatum)
        : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

      const clampedStart = Math.max(start.getTime(), startDate.getTime())
      const clampedEnd = Math.min(end.getTime(), endDate.getTime())

      const startOffset = (clampedStart - startDate.getTime()) / (1000 * 60 * 60 * 24)
      const duration = (clampedEnd - clampedStart) / (1000 * 60 * 60 * 24)

      const left = (startOffset / totalDays) * 100
      const width = Math.max((duration / totalDays) * 100, 2)

      return { left: `${left}%`, width: `${width}%` }
    },
    [startDate, endDate, totalDays]
  )

  // Update auftrag via API
  const updateAuftragDatum = useCallback(
    async (auftragId: string, newStartDate: Date) => {
      const auftrag = auftraege.find((a) => a.id === auftragId)
      if (!auftrag || !auftrag.startDatum) return

      setIsUpdating(true)

      const oldStart = new Date(auftrag.startDatum)
      const diff = newStartDate.getTime() - oldStart.getTime()

      const newEndDate = auftrag.endDatum
        ? new Date(new Date(auftrag.endDatum).getTime() + diff)
        : null

      try {
        const res = await fetch(`/api/auftraege/${auftragId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDatum: newStartDate.toISOString(),
            endDatum: newEndDate?.toISOString() ?? null,
          }),
        })

        if (!res.ok) throw new Error("Update fehlgeschlagen")

        toast.success("Auftrag verschoben", {
          description: `Neues Startdatum: ${newStartDate.toLocaleDateString("de-DE")}`,
        })

        onAuftragUpdate?.()
      } catch (err) {
        console.error("[GanttChart] updateAuftragDatum error:", err)
        toast.error("Fehler beim Verschieben", {
          description: "Der Auftrag konnte nicht aktualisiert werden.",
        })
      } finally {
        setIsUpdating(false)
      }
    },
    [auftraege, onAuftragUpdate]
  )

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const auftrag = auftraege.find((a) => a.id === active.id)
    setActiveAuftrag(auftrag || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveAuftrag(null)

    if (!over) return

    // Extract date from droppable ID
    const overId = String(over.id)
    if (!overId.startsWith("day-")) return

    const newStartDate = new Date(overId.replace("day-", ""))
    updateAuftragDatum(String(active.id), newStartDate)
  }

  const ROW_HEIGHT = 44
  const HEADER_HEIGHT = 48
  const LABEL_WIDTH = 280

  // Generate droppable days
  const droppableDays = useMemo(() => {
    const days: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }, [startDate, endDate])

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400">
              {startDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })} –{" "}
              {endDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </span>
            {isUpdating && (
              <span className="text-xs text-emerald-400 animate-pulse ml-2">Speichern...</span>
            )}
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
              <div
                className="flex-shrink-0 flex items-center px-4 bg-[#1a1a1a] border-r border-[#2a2a2a]"
                style={{ width: LABEL_WIDTH }}
              >
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Auftrag
                </span>
              </div>
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
                  <p className="text-xs text-zinc-700 mt-1">
                    Tipp: Lege Start- und Enddatum in den Auftragsdetails fest
                  </p>
                </div>
              </div>
            ) : (
              visibleAuftraege.map((auftrag) => {
                const barStyle = getBarStyle(auftrag)
                const statusColor = STATUS_FARBEN[auftrag.status] || "#71717a"

                return (
                  <div
                    key={auftrag.id}
                    className="flex border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Label Column */}
                    <div
                      className="flex-shrink-0 flex items-center gap-3 px-4 border-r border-[#2a2a2a] bg-[#161616] cursor-pointer"
                      style={{ width: LABEL_WIDTH }}
                      onClick={() => onAuftragClick?.(auftrag.id)}
                    >
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

                    {/* Bar Area with Droppable Days */}
                    <div className="flex-1 relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {columns.map((_, i) => (
                          <div
                            key={i}
                            className="border-r border-[#1e1e1e] last:border-r-0"
                            style={{ width: `${100 / columns.length}%` }}
                          />
                        ))}
                      </div>

                      {/* Droppable Day Zones */}
                      {droppableDays.map((day) => (
                        <DroppableDay
                          key={day.toISOString()}
                          date={day}
                          totalDays={totalDays}
                          startDate={startDate}
                        >
                          {null}
                        </DroppableDay>
                      ))}

                      {/* Today Line */}
                      {(() => {
                        const today = new Date()
                        if (today >= startDate && today <= endDate) {
                          const todayOffset =
                            (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                          const leftPercent = (todayOffset / totalDays) * 100
                          return (
                            <div
                              className="absolute top-0 bottom-0 w-px bg-emerald-500/50 pointer-events-none z-10"
                              style={{ left: `${leftPercent}%` }}
                            />
                          )
                        }
                        return null
                      })()}

                      {/* Draggable Bar */}
                      <DraggableBar
                        auftrag={auftrag}
                        barStyle={barStyle}
                        statusColor={statusColor}
                        isMobile={isMobile}
                        onMobileMove={setMobileModalAuftrag}
                      />
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
            {!isMobile && (
              <div className="flex items-center gap-1.5 ml-4">
                <MoveHorizontal className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">Ziehen zum Verschieben</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeAuftrag ? (
          <div
            className="rounded-md px-3 py-2 shadow-xl text-white text-sm font-medium"
            style={{
              backgroundColor: STATUS_FARBEN[activeAuftrag.status] || "#71717a",
              minWidth: 150,
            }}
          >
            {activeAuftrag.titel}
            <div className="text-xs opacity-75 mt-0.5">
              {TYP_LABELS[activeAuftrag.typ] || activeAuftrag.typ}
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Mobile Date Picker Modal */}
      {mobileModalAuftrag && (
        <MobileDateModal
          auftrag={mobileModalAuftrag}
          onClose={() => setMobileModalAuftrag(null)}
          onSave={(id, date) => {
            updateAuftragDatum(id, date)
            setMobileModalAuftrag(null)
          }}
        />
      )}
    </DndContext>
  )
}
