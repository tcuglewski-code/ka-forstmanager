"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Camera, MapPin } from "lucide-react"

interface RegisterFlaeche {
  id: string
  registerNr: string
  bundesland: string
  baumart: string
  flaecheHa: number | null
  flaecheRedHa: number | null
  latDez: number | null
  lonDez: number | null
  forstamt: string | null
  hoeheVon: number | null
  hoeheBis: number | null
  zulassungBis: string | null
  zulassungBisText: string | null
  zugelassen: boolean
  sonderherkunft?: boolean
  hatWetterdaten?: boolean
  quelle: {
    name: string
    kuerzel: string
  }
  _count?: {
    medien: number
  }
}

interface Props {
  data: RegisterFlaeche[]
  total: number
  page: number
  limit: number
  sortBy: string
  sortDir: string
}

const QUELLEFARBEN: Record<string, string> = {
  BY: "bg-blue-100 text-blue-800",
  "NW-FVA": "bg-violet-100 text-violet-800",
  RLP: "bg-amber-100 text-amber-800",
  BW: "bg-emerald-100 text-emerald-800",
  NI: "bg-cyan-500/20 text-cyan-400",
  HE: "bg-orange-500/20 text-orange-400",
  TH: "bg-rose-500/20 text-rose-400",
  SN: "bg-sky-500/20 text-sky-400",
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onClick,
}: {
  label: string
  field: string
  currentSort: string
  currentDir: string
  onClick: (field: string) => void
}) {
  const isActive = currentSort === field
  return (
    <button
      onClick={() => onClick(field)}
      className="flex items-center gap-1 hover:text-zinc-300 transition-colors whitespace-nowrap"
    >
      {label}
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  )
}

export function RegisterTable({ data, total, page, limit, sortBy, sortDir }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Checkbox-Auswahl für "Zur Planung"
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())

  function toggleFlaeche(id: string) {
    setAusgewaehlt((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function alleToggle() {
    if (ausgewaehlt.size === data.length) {
      setAusgewaehlt(new Set())
    } else {
      setAusgewaehlt(new Set(data.map((f) => f.id)))
    }
  }

  function zurPlanung() {
    const ids = Array.from(ausgewaehlt).join(",")
    router.push(`/saatguternte/planung?flaechenIds=${ids}`)
  }

  const totalPages = Math.ceil(total / limit)

  function buildUrl(overrides: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === "" || v === null || v === undefined) {
        params.delete(k)
      } else {
        params.set(k, String(v))
      }
    })
    return `${pathname}?${params.toString()}`
  }

  function handleSort(field: string) {
    const newDir = sortBy === field && sortDir === "asc" ? "desc" : "asc"
    router.push(buildUrl({ sortBy: field, sortDir: newDir, page: 1 }))
  }

  function formatKoord(lat: number | null, lon: number | null) {
    if (lat == null || lon == null) return "–"
    return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°O`
  }

  function formatHoehe(von: number | null, bis: number | null) {
    if (von == null && bis == null) return "–"
    if (von != null && bis != null) return `${von}–${bis} m`
    return `${von ?? bis} m`
  }

  function formatZulassung(flaeche: RegisterFlaeche) {
    if (flaeche.zulassungBisText) return flaeche.zulassungBisText
    if (flaeche.zulassungBis) {
      return new Date(flaeche.zulassungBis).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
    if (!flaeche.zugelassen) return "Widerruf"
    return "–"
  }

  return (
    <div>
      <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-[var(--color-on-surface-variant)] font-medium w-10">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && ausgewaehlt.size === data.length}
                    onChange={alleToggle}
                    className="accent-emerald-500 cursor-pointer"
                    title="Alle auswählen"
                  />
                </th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">
                  <SortHeader label="Register-Nr" field="registerNr" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">
                  <SortHeader label="Bundesland" field="bundesland" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">
                  <SortHeader label="Baumart" field="baumart" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">
                  <SortHeader label="Fläche ha" field="flaecheHa" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Koordinaten</th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">
                  <SortHeader label="Forstamt" field="forstamt" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Höhe</th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">
                  <SortHeader label="Zulassung bis" field="zulassungBis" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Quelle</th>
                <th className="text-center px-4 py-3 text-[var(--color-on-surface-variant)] font-medium" title="Wetterdaten vorhanden">Wetter</th>
                <th className="text-left px-4 py-3 text-[var(--color-on-surface-variant)] font-medium">Medien</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-zinc-600">
                    Keine Flächen gefunden
                  </td>
                </tr>
              ) : (
                data.map((f) => (
                  <tr
                    key={f.id}
                    className={`border-b border-[var(--color-outline-variant)] hover:bg-[#1c1c1c] transition-colors ${ausgewaehlt.has(f.id) ? "bg-emerald-900/10" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={ausgewaehlt.has(f.id)}
                        onChange={() => toggleFlaeche(f.id)}
                        className="accent-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-on-surface)] font-medium font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        {f.registerNr}
                        {f.sonderherkunft && (
                          <span title="Sonderherkunft" className="text-amber-400 text-sm leading-none">⭐</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{f.bundesland}</td>
                    <td className="px-4 py-3 text-zinc-300">{f.baumart}</td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">
                      {f.flaecheRedHa != null
                        ? `${f.flaecheRedHa.toFixed(2)} ha`
                        : f.flaecheHa != null
                          ? `${f.flaecheHa.toFixed(2)} ha`
                          : "–"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-variant)] text-xs font-mono">
                      {formatKoord(f.latDez, f.lonDez)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{f.forstamt ?? "–"}</td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-variant)] text-xs whitespace-nowrap">
                      {formatHoehe(f.hoeheVon, f.hoeheBis)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-on-surface-variant)] text-xs whitespace-nowrap">
                      {formatZulassung(f)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${QUELLEFARBEN[f.quelle.kuerzel] ?? "bg-[var(--color-surface-container-high)]/50 text-[var(--color-on-surface-variant)]"}`}
                      >
                        {f.quelle.kuerzel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-base" title={f.hatWetterdaten ? "Wetterdaten vorhanden" : "Keine Wetterdaten"}>
                      {f.hatWetterdaten ? "🌤️" : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {(f._count?.medien ?? 0) > 0 ? (
                        <Link
                          href={`/saatguternte/register/${f.id}?tab=medien`}
                          className="flex items-center gap-1.5 group"
                          title={`${f._count!.medien} Medien anzeigen`}
                        >
                          <Camera className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                            {f._count!.medien}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-zinc-700 text-xs">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/saatguternte/register/${f.id}`}
                        className="text-zinc-600 hover:text-emerald-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar — Zur Planung */}
      {ausgewaehlt.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-border rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-[var(--color-on-surface)] font-medium">
            {ausgewaehlt.size} Fläche{ausgewaehlt.size !== 1 ? "n" : ""} ausgewählt
          </span>
          <button
            onClick={zurPlanung}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Zur Planung →
          </button>
          <button
            onClick={() => setAusgewaehlt(new Set())}
            className="text-gray-400 hover:text-white px-2 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} von {total} Flächen
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildUrl({ page: page - 1 })}
              className={`p-2 rounded-lg border border-border text-[var(--color-on-surface-variant)] hover:text-white hover:bg-surface-container-highest transition-colors ${page <= 1 ? "pointer-events-none opacity-30" : ""}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm text-[var(--color-on-surface-variant)] px-2">
              Seite {page} / {totalPages}
            </span>
            <Link
              href={buildUrl({ page: page + 1 })}
              className={`p-2 rounded-lg border border-border text-[var(--color-on-surface-variant)] hover:text-white hover:bg-surface-container-highest transition-colors ${page >= totalPages ? "pointer-events-none opacity-30" : ""}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
