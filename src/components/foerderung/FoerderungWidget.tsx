"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TreePine, Euro, ExternalLink, Loader2, ArrowRight } from "lucide-react"

interface Foerderprogramm {
  id: number
  name: string
  ebene: string | null
  bundesland: string | null
  foerdersatz: string | null
  traeger: string | null
  status: string | null
}

export function FoerderungWidget() {
  const [programme, setProgramme] = useState<Foerderprogramm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/foerderung/suche?q=Aufforstung&bundesland=&typ=aufforstung")
      .then((r) => r.json())
      .then((data) => {
        setProgramme((data.data || []).slice(0, 3))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TreePine className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-white">Förderprogramme</h2>
        </div>
        <Link
          href="/foerderung"
          className="text-xs text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          Alle anzeigen
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
        </div>
      ) : programme.length === 0 ? (
        <p className="text-zinc-600 text-sm">Keine Programme gefunden</p>
      ) : (
        <div className="space-y-3">
          {programme.map((p) => (
            <Link
              key={p.id}
              href="/foerderung"
              className="block hover:bg-[#1e1e1e] rounded-lg p-2 -mx-2 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-white leading-snug group-hover:text-emerald-100 transition-colors line-clamp-2">
                  {p.name}
                </p>
                <span
                  className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs ${
                    p.ebene === "bund"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-violet-500/20 text-violet-400"
                  }`}
                >
                  {p.ebene === "bund" ? "Bund" : p.bundesland?.slice(0, 3) || "–"}
                </span>
              </div>
              {p.foerdersatz && (
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                  <Euro className="w-3 h-3" />
                  <span className="truncate">{p.foerdersatz}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/foerderung"
        className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 text-xs text-zinc-500 hover:text-emerald-400 hover:bg-[#1e1e1e] rounded-lg transition-all border border-dashed border-[#333] hover:border-emerald-900/50"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Alle 43 Förderprogramme durchsuchen
      </Link>
    </div>
  )
}
