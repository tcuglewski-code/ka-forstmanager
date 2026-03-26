"use client"
// @ts-nocheck
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

interface Props {
  saisons: number[]
  baumartOptionen: string[]
  bundeslandOptionen: string[]
  currentSaison: string
  currentBaumart: string
  currentBundesland: string
}

export function ErnteFilterClient({
  saisons,
  baumartOptionen,
  bundeslandOptionen,
  currentSaison,
  currentBaumart,
  currentBundesland,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [saison, setSaison] = useState(currentSaison)
  const [baumart, setBaumart] = useState(currentBaumart)
  const [bundesland, setBundesland] = useState(currentBundesland)

  const apply = (overrides: Record<string, string> = {}) => {
    const p = new URLSearchParams()
    const s = overrides.saison ?? saison
    const b = overrides.baumart ?? baumart
    const bl = overrides.bundesland ?? bundesland
    if (s && s !== "alle") p.set("saison", s)
    if (b) p.set("baumart", b)
    if (bl) p.set("bundesland", bl)
    router.push(`${pathname}?${p.toString()}`)
  }

  const reset = () => {
    setSaison("alle")
    setBaumart("")
    setBundesland("")
    router.push(pathname)
  }

  const hasFilter = saison !== "alle" || baumart || bundesland

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={saison}
        onChange={(e) => {
          setSaison(e.target.value)
          apply({ saison: e.target.value })
        }}
        className="px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-zinc-300 text-sm focus:outline-none focus:border-emerald-600"
      >
        <option value="alle">Alle Saisons</option>
        {saisons.map((s) => (
          <option key={s} value={String(s)}>
            Saison {s}
          </option>
        ))}
      </select>

      <select
        value={baumart}
        onChange={(e) => {
          setBaumart(e.target.value)
          apply({ baumart: e.target.value })
        }}
        className="px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-zinc-300 text-sm focus:outline-none focus:border-emerald-600"
      >
        <option value="">Alle Baumarten</option>
        {baumartOptionen.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        value={bundesland}
        onChange={(e) => {
          setBundesland(e.target.value)
          apply({ bundesland: e.target.value })
        }}
        className="px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-zinc-300 text-sm focus:outline-none focus:border-emerald-600"
      >
        <option value="">Alle Bundesländer</option>
        {bundeslandOptionen.map((bl) => (
          <option key={bl} value={bl}>
            {bl}
          </option>
        ))}
      </select>

      {hasFilter && (
        <button
          onClick={reset}
          className="px-3 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
        >
          × Filter zurücksetzen
        </button>
      )}
    </div>
  )
}
