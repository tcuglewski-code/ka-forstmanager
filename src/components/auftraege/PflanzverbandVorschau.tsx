"use client"

import React, { useMemo } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BaumartenEntry {
  name: string
  count: number
  color: string
}

export interface PflanzverbandVorschauProps {
  pflanzverband?: string | null
  pflanzabstand?: string | null
  reihenabstand?: string | null
  baumarten?: string | null       // "Art1: 100 Stk., Art2: 50 Stk."
  baumart?: string | null          // Fallback wenn nur eine Art
  pflanzenzahl?: number | null
  flaeche_ha?: string | number | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WALDFARBEN = [
  "#2d6a4f", // dunkelgrün
  "#8b5e3c", // braun
  "#52b788", // hellgrün
  "#6b4226", // dunkelbraun
  "#74c69d", // mintgrün
  "#a3b18a", // olivgrün
  "#3a5a40", // waldgrün
  "#b5838d", // rotbraun
  "#588157", // mittelgrün
  "#c9ada7", // hellbraun
]

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseBaumarten(
  baumarten: string | null | undefined,
  baumart: string | null | undefined
): BaumartenEntry[] {
  // Try parsing "Art1: 100 Stk., Art2: 50 Stk." format
  if (baumarten && baumarten.trim() !== "") {
    const regex = /([^:,]+):\s*(\d+)\s*Stk\.?/g
    const results: BaumartenEntry[] = []
    let match
    while ((match = regex.exec(baumarten)) !== null) {
      results.push({
        name: match[1].trim(),
        count: parseInt(match[2], 10),
        color: WALDFARBEN[results.length % WALDFARBEN.length],
      })
    }
    if (results.length > 0) return results

    // Fallback: split by comma if no count given
    const parts = baumarten.split(",").map(p => p.replace(/:\s*\d+\s*Stk\.?/g, "").trim()).filter(Boolean)
    if (parts.length > 0) {
      return parts.map((name, i) => ({ name, count: 0, color: WALDFARBEN[i % WALDFARBEN.length] }))
    }
  }

  // Single tree type fallback
  if (baumart && baumart.trim() !== "") {
    return [{ name: baumart.trim(), count: 0, color: WALDFARBEN[0] }]
  }

  return []
}

function parseAbstand(value: string | null | undefined): number {
  if (!value) return 2.0
  const num = parseFloat(value.replace(",", ".").replace(/[^0-9.]/g, ""))
  return isNaN(num) || num <= 0 ? 2.0 : num
}

function normalizePflanzverband(value: string | null | undefined): "gleich" | "quincunx" | "alternierend" {
  const v = (value ?? "").toLowerCase().trim()
  if (v.includes("quincunx") || v.includes("versetzt")) return "quincunx"
  if (v.includes("alternierend") || v.includes("wechsel")) return "alternierend"
  return "gleich"
}

// ─── SVG Renderer ─────────────────────────────────────────────────────────────

interface PlantDot {
  x: number
  y: number
  color: string
  artName: string
}

function buildDots(
  typ: "gleich" | "quincunx" | "alternierend",
  arten: BaumartenEntry[],
  maxRows: number,
  maxCols: number,
  dotSpacing: number,
  rowSpacing: number
): PlantDot[] {
  if (arten.length === 0) return []

  const dots: PlantDot[] = []
  const totalCount = arten.reduce((s, a) => s + a.count, 0)

  // Build ratio sequence for "gleich" mode
  // e.g. [0, 1, 0, 1] for 50/50, [0, 0, 1] for 2:1
  const ratioSeq: number[] = []
  if (arten.length === 1) {
    ratioSeq.push(0)
  } else if (totalCount > 0) {
    // Build a repeating pattern based on counts
    const total = arten.reduce((s, a) => s + a.count, 0)
    for (let i = 0; i < arten.length; i++) {
      const slots = Math.round((arten[i].count / total) * 10)
      for (let j = 0; j < Math.max(1, slots); j++) {
        ratioSeq.push(i)
      }
    }
  } else {
    // Equal distribution
    for (let i = 0; i < arten.length; i++) ratioSeq.push(i)
  }

  let dotCounter = 0

  for (let row = 0; row < maxRows; row++) {
    const yOffset = 16 + row * rowSpacing
    const xShift = typ === "quincunx" && row % 2 === 1 ? dotSpacing / 2 : 0

    for (let col = 0; col < maxCols; col++) {
      const xOffset = 16 + col * dotSpacing + xShift
      let artIdx: number

      if (typ === "alternierend") {
        artIdx = row % arten.length
      } else {
        // gleich & quincunx: distribute by ratio
        artIdx = ratioSeq[dotCounter % ratioSeq.length]
      }

      dots.push({
        x: xOffset,
        y: yOffset,
        color: arten[artIdx].color,
        artName: arten[artIdx].name,
      })
      dotCounter++
    }
  }

  return dots
}

// ─── Per-row count for legend ─────────────────────────────────────────────────

function countPerRow(
  typ: "gleich" | "quincunx" | "alternierend",
  arten: BaumartenEntry[],
  maxCols: number
): Record<string, number> {
  const counts: Record<string, number> = {}
  arten.forEach(a => { counts[a.name] = 0 })

  if (arten.length === 0) return counts

  const totalCount = arten.reduce((s, a) => s + a.count, 0)
  const ratioSeq: number[] = []
  if (arten.length === 1) {
    ratioSeq.push(0)
  } else if (totalCount > 0) {
    const total = arten.reduce((s, a) => s + a.count, 0)
    for (let i = 0; i < arten.length; i++) {
      const slots = Math.round((arten[i].count / total) * 10)
      for (let j = 0; j < Math.max(1, slots); j++) {
        ratioSeq.push(i)
      }
    }
  } else {
    for (let i = 0; i < arten.length; i++) ratioSeq.push(i)
  }

  // Count for first row only
  for (let col = 0; col < maxCols; col++) {
    let artIdx: number
    if (typ === "alternierend") {
      artIdx = 0
    } else {
      artIdx = ratioSeq[col % ratioSeq.length]
    }
    counts[arten[artIdx].name] = (counts[arten[artIdx].name] ?? 0) + 1
  }

  return counts
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PflanzverbandVorschau({
  pflanzverband,
  pflanzabstand,
  reihenabstand,
  baumarten,
  baumart,
  pflanzenzahl,
  flaeche_ha,
}: PflanzverbandVorschauProps) {
  const arten = useMemo(() => parseBaumarten(baumarten, baumart), [baumarten, baumart])
  const typ = useMemo(() => normalizePflanzverband(pflanzverband), [pflanzverband])
  const pa = useMemo(() => parseAbstand(pflanzabstand), [pflanzabstand])
  const ra = useMemo(() => parseAbstand(reihenabstand), [reihenabstand])

  // SVG dimensions
  const MAX_ROWS = 12
  const MAX_COLS = 18
  const DOT_RADIUS = 5
  const DOT_SPACING = 28
  const ROW_SPACING = 26

  const svgWidth = 16 + MAX_COLS * DOT_SPACING + 16
  const svgHeight = 16 + MAX_ROWS * ROW_SPACING + 16

  const dots = useMemo(
    () => buildDots(typ, arten, MAX_ROWS, MAX_COLS, DOT_SPACING, ROW_SPACING),
    [typ, arten]
  )

  const perRow = useMemo(
    () => countPerRow(typ, arten, MAX_COLS),
    [typ, arten]
  )

  if (arten.length === 0) return null

  const typLabel: Record<"gleich" | "quincunx" | "alternierend", string> = {
    gleich: "Gleichmäßig (Rechteck)",
    quincunx: "Quincunx (Versetzt)",
    alternierend: "Alternierend (Reihenweise)",
  }

  const flaecheNum = flaeche_ha != null ? Number(flaeche_ha) : null
  const pflanzNum = pflanzenzahl ?? null

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 mt-4">
      {/* Header */}
      <h3 className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-1 flex items-center gap-2">
        🌲 Pflanzverband-Vorschau
      </h3>
      <p className="text-zinc-500 text-xs mb-4">{typLabel[typ]}</p>

      {/* SVG */}
      <div className="overflow-x-auto rounded-lg bg-[#0f0f0f] border border-[#222]">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Pflanzverband Vorschau"
          style={{ display: "block" }}
        >
          {/* Grid lines (subtle) */}
          {Array.from({ length: MAX_ROWS }).map((_, row) => (
            <line
              key={`row-${row}`}
              x1={8}
              y1={16 + row * ROW_SPACING}
              x2={svgWidth - 8}
              y2={16 + row * ROW_SPACING}
              stroke="#1e1e1e"
              strokeWidth={1}
            />
          ))}

          {/* Plant dots */}
          {dots.map((dot, i) => (
            <g key={i}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={DOT_RADIUS + 2}
                fill={dot.color}
                opacity={0.18}
              />
              <circle
                cx={dot.x}
                cy={dot.y}
                r={DOT_RADIUS}
                fill={dot.color}
              />
            </g>
          ))}

          {/* Abstand labels (first row, first 2 cols) */}
          {dots.length >= 2 && (
            <g>
              <line
                x1={dots[0].x}
                y1={dots[0].y + DOT_RADIUS + 3}
                x2={dots[1].x}
                y2={dots[1].y + DOT_RADIUS + 3}
                stroke="#444"
                strokeWidth={0.8}
                markerEnd="url(#arrow)"
              />
              <text
                x={(dots[0].x + dots[1].x) / 2}
                y={dots[0].y + DOT_RADIUS + 13}
                textAnchor="middle"
                fill="#555"
                fontSize={8}
              >
                {pa}m
              </text>
            </g>
          )}

          {/* Reihenabstand label (first col, rows 0+1) */}
          {dots.length > MAX_COLS && (
            <g>
              <line
                x1={dots[0].x - DOT_RADIUS - 3}
                y1={dots[0].y}
                x2={dots[MAX_COLS].x - DOT_RADIUS - 3}
                y2={dots[MAX_COLS].y}
                stroke="#444"
                strokeWidth={0.8}
              />
              <text
                x={dots[0].x - DOT_RADIUS - 6}
                y={(dots[0].y + dots[MAX_COLS].y) / 2}
                textAnchor="end"
                fill="#555"
                fontSize={8}
                dominantBaseline="middle"
              >
                {ra}m
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Summary */}
      <div className="mt-3 text-xs text-zinc-500 space-y-1">
        {(pflanzNum || flaecheNum) && (
          <p>
            Ca.{" "}
            {pflanzNum != null
              ? <span className="text-zinc-300 font-medium">{pflanzNum.toLocaleString("de-DE")} Pflanzen</span>
              : null}
            {flaecheNum != null && pflanzNum != null ? " auf " : null}
            {flaecheNum != null
              ? <span className="text-zinc-300 font-medium">{flaecheNum} ha</span>
              : null}
            {" "}bei{" "}
            <span className="text-zinc-300">{pa}m × {ra}m</span> Abstand
          </p>
        )}
        {!(pflanzNum || flaecheNum) && (
          <p>Abstand: <span className="text-zinc-300">{pa}m × {ra}m</span></p>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {arten.map((art) => {
          const rowCount = perRow[art.name] ?? 0
          return (
            <div key={art.name} className="flex items-center gap-1.5">
              <svg width={12} height={12} viewBox="0 0 12 12">
                <circle cx={6} cy={6} r={5} fill={art.color} />
              </svg>
              <span className="text-xs text-zinc-300">{art.name}</span>
              {art.count > 0 && (
                <span className="text-xs text-zinc-500">({art.count.toLocaleString("de-DE")} Stk.)</span>
              )}
              {rowCount > 0 && (
                <span className="text-xs text-zinc-600">· {rowCount}× / Reihe</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
