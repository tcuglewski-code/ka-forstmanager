"use client"

import { useMemo, useState } from "react"

interface Kunde {
  kunde: string
  auftragsAnzahl: number
  umsatz: number
  letzterAuftrag: string | null
  bindungsMonate: number
  clv: number
}

type SortKey = "umsatz" | "auftragsAnzahl" | "clv" | "letzterAuftrag" | "bindungsMonate"

const FOREST = "#012d1d"

export function KundenTabelle({ kunden }: { kunden: Kunde[] }) {
  const [sort, setSort] = useState<SortKey>("umsatz")
  const [dir, setDir] = useState<"asc" | "desc">("desc")

  const sorted = useMemo(() => {
    const copy = [...kunden]
    copy.sort((a, b) => {
      let av: number | string = a[sort] ?? 0
      let bv: number | string = b[sort] ?? 0
      if (sort === "letzterAuftrag") {
        av = a.letzterAuftrag ? new Date(a.letzterAuftrag).getTime() : 0
        bv = b.letzterAuftrag ? new Date(b.letzterAuftrag).getTime() : 0
      }
      if (typeof av === "number" && typeof bv === "number") {
        return dir === "asc" ? av - bv : bv - av
      }
      return 0
    })
    return copy
  }, [kunden, sort, dir])

  const setOrToggle = (key: SortKey) => {
    if (sort === key) setDir(dir === "asc" ? "desc" : "asc")
    else {
      setSort(key)
      setDir("desc")
    }
  }

  const Header = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th
      onClick={() => setOrToggle(k)}
      className={`px-3 py-2 cursor-pointer select-none text-xs font-semibold uppercase tracking-wide`}
      style={{ textAlign: align, color: FOREST }}
    >
      {label} {sort === k ? (dir === "desc" ? "▼" : "▲") : ""}
    </th>
  )

  return (
    <div className="rounded-2xl border overflow-hidden" style={{
      backgroundColor: "var(--color-surface-container, #ffffff)",
      borderColor: "var(--color-outline-variant, #e5e7eb)",
    }}>
      <div className="p-5 border-b" style={{ borderColor: "var(--color-outline-variant, #e5e7eb)" }}>
        <h3 className="text-sm font-semibold" style={{ color: FOREST }}>
          Top Kunden (CLV-Ranking)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead style={{ backgroundColor: "rgba(1,45,29,0.03)" }}>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: FOREST }}>Kunde</th>
              <Header k="auftragsAnzahl" label="Aufträge" align="right" />
              <Header k="umsatz" label="Umsatz €" align="right" />
              <Header k="bindungsMonate" label="Bindung (M)" align="right" />
              <Header k="letzterAuftrag" label="Letzter Auftrag" />
              <Header k="clv" label="CLV" align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center opacity-60 text-sm">Keine Kunden im gewählten Zeitraum.</td></tr>
            )}
            {sorted.map((k, i) => (
              <tr
                key={k.kunde + i}
                style={{ borderTop: "1px solid var(--color-outline-variant, #f3f4f6)" }}
              >
                <td className="px-3 py-2 font-medium">{k.kunde}</td>
                <td className="px-3 py-2 text-right">{k.auftragsAnzahl}</td>
                <td className="px-3 py-2 text-right font-mono">{k.umsatz.toLocaleString("de-DE")}</td>
                <td className="px-3 py-2 text-right">{k.bindungsMonate}</td>
                <td className="px-3 py-2 text-xs opacity-80">
                  {k.letzterAuftrag ? new Date(k.letzterAuftrag).toLocaleDateString("de-DE") : "—"}
                </td>
                <td className="px-3 py-2 text-right font-semibold" style={{ color: FOREST }}>
                  {k.clv.toLocaleString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
