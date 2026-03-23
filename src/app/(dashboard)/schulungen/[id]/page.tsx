"use client"

import { useState, useEffect, useCallback } from "react"
import { BookOpen, ArrowLeft, UserPlus, CheckCircle, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Schulung {
  id: string
  titel: string
  typ: string
  beschreibung?: string | null
  datum?: string | null
  ort?: string | null
  maxTeilnehmer?: number | null
  status: string
  teilnehmer: {
    id: string
    status: string
    mitarbeiter: { id: string; vorname: string; nachname: string; rolle: string }
  }[]
}

interface Mitarbeiter {
  id: string
  vorname: string
  nachname: string
}

const statusBadge: Record<string, string> = {
  angemeldet: "bg-blue-500/20 text-blue-400",
  abgeschlossen: "bg-emerald-500/20 text-emerald-400",
  abgebrochen: "bg-red-500/20 text-red-400",
}

export default function SchulungDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [schulung, setSchulung] = useState<Schulung | null>(null)
  const [alleMitarbeiter, setAlleMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchSchulung = useCallback(async () => {
    setLoading(true)
    const [s, m] = await Promise.all([
      fetch(`/api/schulungen/${id}`).then((r) => r.json()),
      fetch("/api/mitarbeiter").then((r) => r.json()),
    ])
    setSchulung(s)
    setAlleMitarbeiter(Array.isArray(m) ? m : [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchSchulung() }, [fetchSchulung])

  async function addTeilnehmer() {
    if (!selectedMitarbeiter) return
    setSaving(true)
    await fetch(`/api/schulungen/${id}/teilnehmer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mitarbeiterId: selectedMitarbeiter }),
    })
    setSelectedMitarbeiter("")
    await fetchSchulung()
    setSaving(false)
  }

  async function removeTeilnehmer(mitarbeiterId: string) {
    if (!confirm("Teilnehmer entfernen?")) return
    await fetch(`/api/schulungen/${id}/teilnehmer?mitarbeiterId=${mitarbeiterId}`, { method: "DELETE" })
    await fetchSchulung()
  }

  async function abschliessen() {
    if (!confirm("Schulung abschließen? Alle angemeldeten Teilnehmer werden als abgeschlossen markiert.")) return
    setSaving(true)
    await fetch(`/api/schulungen/${id}/teilnehmer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "abschliessen" }),
    })
    await fetchSchulung()
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
  if (!schulung) return <div className="text-zinc-500 text-center py-20">Schulung nicht gefunden</div>

  const angemeldete = schulung.teilnehmer.filter((t) => t.status === "angemeldet")
  const bereitsAngemeldetIds = schulung.teilnehmer.map((t) => t.mitarbeiter.id)
  const verfuegbar = alleMitarbeiter.filter((m) => !bereitsAngemeldetIds.includes(m.id))

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/schulungen" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Schulungen
      </Link>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold text-white">{schulung.titel}</h1>
            </div>
            {schulung.beschreibung && <p className="text-zinc-400 text-sm mb-3">{schulung.beschreibung}</p>}
            <div className="flex gap-4 text-sm text-zinc-400">
              {schulung.datum && <span>📅 {new Date(schulung.datum).toLocaleDateString("de-DE")}</span>}
              {schulung.ort && <span>📍 {schulung.ort}</span>}
              {schulung.maxTeilnehmer && <span>👥 Max. {schulung.maxTeilnehmer}</span>}
            </div>
          </div>
          {schulung.status !== "abgeschlossen" && angemeldete.length > 0 && (
            <button onClick={abschliessen} disabled={saving} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> Schulung abschließen
            </button>
          )}
        </div>
      </div>

      {/* Mitarbeiter anmelden */}
      {schulung.status !== "abgeschlossen" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-white mb-3">Mitarbeiter anmelden</h2>
          <div className="flex gap-3">
            <select value={selectedMitarbeiter} onChange={(e) => setSelectedMitarbeiter(e.target.value)} className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— Mitarbeiter auswählen —</option>
              {verfuegbar.map((m) => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
            </select>
            <button onClick={addTeilnehmer} disabled={saving || !selectedMitarbeiter} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              <UserPlus className="w-4 h-4" /> Anmelden
            </button>
          </div>
        </div>
      )}

      {/* Teilnehmerliste */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-semibold text-white">Teilnehmer ({schulung.teilnehmer.length})</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Rolle</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {schulung.teilnehmer.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600">Keine Teilnehmer</td></tr>
            ) : schulung.teilnehmer.map((t) => (
              <tr key={t.id} className="hover:bg-[#1c1c1c]">
                <td className="px-6 py-4 text-sm text-white">{t.mitarbeiter.vorname} {t.mitarbeiter.nachname}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{t.mitarbeiter.rolle}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[t.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {schulung.status !== "abgeschlossen" && (
                    <button onClick={() => removeTeilnehmer(t.mitarbeiter.id)} className="text-zinc-600 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
