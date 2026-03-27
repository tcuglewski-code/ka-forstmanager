"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertTriangle, XCircle, Clock, Plus, ChevronRight } from "lucide-react"
import Link from "next/link"
import { AbnahmeFormular } from "./AbnahmeFormular"

interface Abnahme {
  id: string
  auftragId: string
  datum: string
  status: string
  foersterName?: string | null
  notizen?: string | null
  rechnungFreigegeben?: boolean
  freigegebenAm?: string | null
}

interface AbnahmeStatusProps {
  auftragId: string
}

function StatusIcon({ status }: { status: string }) {
  if (status === "bestätigt") return <CheckCircle className="w-4 h-4 text-emerald-400" />
  if (status === "mängel") return <AlertTriangle className="w-4 h-4 text-amber-400" />
  if (status === "abgelehnt") return <XCircle className="w-4 h-4 text-zinc-500" />
  return <Clock className="w-4 h-4 text-amber-400" />
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    offen:       { label: "Offen",      classes: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    "bestätigt": { label: "Bestätigt",  classes: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    "mängel":    { label: "Mängel",     classes: "bg-red-500/20 text-red-400 border-red-500/30" },
    abgelehnt:   { label: "Abgelehnt",  classes: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
  }
  const c = map[status] ?? map.offen
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${c.classes}`}>{c.label}</span>
  )
}

export function AbnahmeStatus({ auftragId }: AbnahmeStatusProps) {
  const [abnahmen, setAbnahmen] = useState<Abnahme[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>(undefined)

  function laden() {
    setLoading(true)
    fetch(`/api/abnahmen?auftragId=${auftragId}`)
      .then(r => r.json())
      .then(d => setAbnahmen(Array.isArray(d) ? d : []))
      .catch(() => setAbnahmen([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { laden() }, [auftragId])

  function onSaved() {
    setFormOpen(false)
    setEditId(undefined)
    laden()
  }

  if (loading) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
        <p className="text-xs text-zinc-600">Lade Abnahmen...</p>
      </div>
    )
  }

  // ── Formular-Overlay ──────────────────────────────────────────────────────
  if (formOpen) {
    return (
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
        <AbnahmeFormular
          auftragId={auftragId}
          abnahmeId={editId}
          onSaved={onSaved}
          onCancel={() => { setFormOpen(false); setEditId(undefined) }}
        />
      </div>
    )
  }

  // ── Status-Übersicht ──────────────────────────────────────────────────────
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-zinc-500" />
          Abnahme
          {abnahmen.length > 0 && (
            <span className="text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full">{abnahmen.length}</span>
          )}
        </h3>
        <button
          onClick={() => { setEditId(undefined); setFormOpen(true) }}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Abnahme starten
        </button>
      </div>

      {abnahmen.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-600">Noch keine Abnahme durchgeführt</p>
          <p className="text-xs text-zinc-700 mt-1">Klicke &quot;Abnahme starten&quot; um die Abnahme zu erfassen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {abnahmen.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] group">
              <div className="flex items-center gap-3">
                <StatusIcon status={a.status} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">{new Date(a.datum).toLocaleDateString("de-DE")}</p>
                    {a.rechnungFreigegeben && (
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                        Rechnung freigegeben
                      </span>
                    )}
                  </div>
                  {a.foersterName && <p className="text-xs text-zinc-500 mt-0.5">Förster: {a.foersterName}</p>}
                  {a.notizen && <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{a.notizen}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusLabel status={a.status} />
                <button
                  onClick={() => { setEditId(a.id); setFormOpen(true) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-white"
                  title="Bearbeiten"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link zur vollständigen Abnahmen-Übersicht */}
      <div className="mt-3 pt-3 border-t border-[#1e1e1e]">
        <Link
          href="/abnahmen"
          className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
        >
          Alle Abnahmen ansehen
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
