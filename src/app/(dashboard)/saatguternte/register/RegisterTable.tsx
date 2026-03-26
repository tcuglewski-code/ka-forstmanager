"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"

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
  quelle: {
    name: string
    kuerzel: string
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
  BY: "bg-blue-500/20 text-blue-400",
  "NW-FVA": "bg-violet-500/20 text-violet-400",
  RLP: "bg-amber-500/20 text-amber-400",
  BW: "bg-emerald-500/20 text-emerald-400",
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
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                  <SortHeader label="Register-Nr" field="registerNr" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                  <SortHeader label="Bundesland" field="bundesland" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                  <SortHeader label="Baumart" field="baumart" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                  <SortHeader label="Fläche ha" field="flaecheHa" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Koordinaten</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                  <SortHeader label="Forstamt" field="forstamt" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Höhe</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                  <SortHeader label="Zulassung bis" field="zulassungBis" currentSort={sortBy} currentDir={sortDir} onClick={handleSort} />
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Quelle</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-zinc-600">
                    Keine Flächen gefunden
                  </td>
                </tr>
              ) : (
                data.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-[#1e1e1e] hover:bg-[#1c1c1c] transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-medium font-mono text-xs">
                      {f.registerNr}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{f.bundesland}</td>
                    <td className="px-4 py-3 text-zinc-300">{f.baumart}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {f.flaecheRedHa != null
                        ? `${f.flaecheRedHa.toFixed(2)} ha`
                        : f.flaecheHa != null
                          ? `${f.flaecheHa.toFixed(2)} ha`
                          : "–"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                      {formatKoord(f.latDez, f.lonDez)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{f.forstamt ?? "–"}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {formatHoehe(f.hoeheVon, f.hoeheBis)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {formatZulassung(f)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${QUELLEFARBEN[f.quelle.kuerzel] ?? "bg-zinc-700/50 text-zinc-400"}`}
                      >
                        {f.quelle.kuerzel}
                      </span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} von {total} Flächen
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildUrl({ page: page - 1 })}
              className={`p-2 rounded-lg border border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#2a2a2a] transition-colors ${page <= 1 ? "pointer-events-none opacity-30" : ""}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm text-zinc-400 px-2">
              Seite {page} / {totalPages}
            </span>
            <Link
              href={buildUrl({ page: page + 1 })}
              className={`p-2 rounded-lg border border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#2a2a2a] transition-colors ${page >= totalPages ? "pointer-events-none opacity-30" : ""}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
