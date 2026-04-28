"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Trash2, ExternalLink, Download, Clock, TreePine, Ruler, FileCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

interface Mitglied {
  id: string
  rolle: string
  mitarbeiter: { id: string; vorname: string; nachname: string; rolle: string }
}
interface Gruppe {
  id: string
  name: string
  status: string
  saison?: { name: string } | null
  mitglieder: Mitglied[]
  auftraege: { id: string; titel: string; status: string }[]
}
interface Mitarbeiter { id: string; vorname: string; nachname: string }

interface GruppeStatistik {
  gruppe: { id: string; name: string; mitarbeiterAnzahl: number }
  kpis: { stundenGesamt: number; gepflanztGesamt: number; haGesamt: number; protokolleCount: number; genehmigte: number }
  perMitarbeiter: { id: string; name: string; stunden: number }[]
  perAuftrag: { id: string; titel: string; typ: string; protokolleCount: number; gepflanzt: number; ha: number }[]
}

export default function GruppeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gruppe, setGruppe] = useState<Gruppe | null>(null)
  const [allMitarbeiter, setAllMitarbeiter] = useState<Mitarbeiter[]>([])
  const [selectedMitarbeiterId, setSelectedMitarbeiterId] = useState("")
  const [adding, setAdding] = useState(false)
  const [statistik, setStatistik] = useState<GruppeStatistik | null>(null)

  const load = useCallback(async () => {
    try {
      const [gRes, maRes] = await Promise.all([
        fetch(`/api/gruppen/${id}`),
        fetch("/api/mitarbeiter"),
      ])
      if (!gRes.ok) { router.push("/gruppen"); return }
      const [g, ma] = await Promise.all([gRes.json(), maRes.json()])
      setGruppe(g)
      setAllMitarbeiter(Array.isArray(ma) ? ma : (ma.items ?? []))
      // Load statistik
      try {
        const sRes = await fetch(`/api/gruppen/${id}/statistik`)
        if (sRes.ok) setStatistik(await sRes.json())
      } catch { /* statistik is optional */ }
    } catch {
      router.push("/gruppen")
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const addMitglied = async () => {
    if (!selectedMitarbeiterId) return
    setAdding(true)
    try {
      const res = await fetch(`/api/gruppen/${id}/mitglieder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mitarbeiterId: selectedMitarbeiterId }),
      })
      if (!res.ok) {
        const err = await res.text()
        toast.error(`Mitglied hinzufügen fehlgeschlagen: ${err}`)
        return
      }
      toast.success("Mitglied hinzugefügt")
      setSelectedMitarbeiterId("")
      load()
    } catch {
      toast.error("Netzwerkfehler beim Hinzufügen des Mitglieds")
    } finally {
      setAdding(false)
    }
  }

  const removeMitglied = async (mitarbeiterId: string) => {
    try {
      const res = await fetch(`/api/gruppen/${id}/mitglieder`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mitarbeiterId }),
      })
      if (!res.ok) {
        const err = await res.text()
        toast.error(`Mitglied entfernen fehlgeschlagen: ${err}`)
        return
      }
      toast.success("Mitglied entfernt")
      load()
    } catch {
      toast.error("Netzwerkfehler beim Entfernen des Mitglieds")
    }
  }

  if (!gruppe) return <div className="text-center py-16 text-zinc-600">Laden...</div>

  const existingIds = gruppe.mitglieder.map(m => m.mitarbeiter.id)
  const verfuegbareMitarbeiter = allMitarbeiter.filter(m => !existingIds.includes(m.id))

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: "Gruppen", href: "/gruppen" }, { label: gruppe.name }]} />
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{gruppe.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {gruppe.saison && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-forest text-emerald-400">
                {gruppe.saison.name}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs ${gruppe.status === "aktiv" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
              {gruppe.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mitglieder */}
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <h2 className="font-semibold text-[var(--color-on-surface)] mb-4">Mitglieder ({gruppe.mitglieder.length})</h2>

          <div className="space-y-2 mb-4">
            {gruppe.mitglieder.length === 0 ? (
              <p className="text-zinc-600 text-sm">Noch keine Mitglieder</p>
            ) : (
              gruppe.mitglieder.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border">
                  <Link
                    href={`/mitarbeiter/${m.mitarbeiter.id}`}
                    className="flex items-center gap-2 group hover:text-emerald-400 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-[var(--color-on-surface)] group-hover:text-emerald-400 transition-colors">{m.mitarbeiter.vorname} {m.mitarbeiter.nachname}</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">{m.rolle}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <button
                    onClick={() => removeMitglied(m.mitarbeiter.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Mitglied hinzufügen */}
          <div className="flex gap-2">
            <select
              value={selectedMitarbeiterId}
              onChange={e => setSelectedMitarbeiterId(e.target.value)}
              className="flex-1 bg-[var(--color-surface-container-low)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-emerald-500"
            >
              <option value="">— Mitarbeiter wählen —</option>
              {verfuegbareMitarbeiter.map(m => (
                <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>
              ))}
            </select>
            <button
              onClick={addMitglied}
              disabled={!selectedMitarbeiterId || adding}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Aufträge */}
        <div className="bg-[var(--color-surface-container)] border border-border rounded-xl p-5">
          <h2 className="font-semibold text-[var(--color-on-surface)] mb-4">Aufträge ({gruppe.auftraege.length})</h2>
          {gruppe.auftraege.length === 0 ? (
            <p className="text-zinc-600 text-sm">Keine Aufträge zugewiesen</p>
          ) : (
            <div className="space-y-2">
              {gruppe.auftraege.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border">
                  <p className="text-sm text-[var(--color-on-surface)]">{a.titel}</p>
                  <span className="text-xs text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] px-2 py-0.5 rounded">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistiken */}
      {statistik && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-on-surface)]">Statistiken</h2>
            <a
              href={`/api/export/csv?typ=gruppen`}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <Download className="w-3 h-3" /> CSV Export
            </a>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Stunden", value: statistik.kpis.stundenGesamt.toFixed(1), unit: "h", icon: Clock },
              { label: "Gepflanzt", value: statistik.kpis.gepflanztGesamt.toLocaleString("de-DE"), unit: "", icon: TreePine },
              { label: "Fläche", value: statistik.kpis.haGesamt.toFixed(2), unit: "ha", icon: Ruler },
              { label: "Protokolle", value: `${statistik.kpis.genehmigte}/${statistik.kpis.protokolleCount}`, unit: "", icon: FileCheck },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-[var(--color-surface-container)] border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-xs text-[var(--color-on-surface-variant)]">{kpi.label}</p>
                </div>
                <p className="text-xl font-bold text-[var(--color-on-surface)]">
                  {kpi.value}{kpi.unit && <span className="text-sm font-normal text-[var(--color-on-surface-variant)]"> {kpi.unit}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Mitarbeiter-Rangliste */}
          {statistik.perMitarbeiter.length > 0 && (
            <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-[var(--color-on-surface)]">Mitarbeiter-Stunden</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-2 text-xs text-[var(--color-on-surface-variant)]">Name</th>
                    <th className="text-right px-5 py-2 text-xs text-[var(--color-on-surface-variant)]">Stunden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statistik.perMitarbeiter.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--color-surface-container-low)]">
                      <td className="px-5 py-2 text-[var(--color-on-surface)]">{m.name}</td>
                      <td className="px-5 py-2 text-right text-[var(--color-on-surface-variant)]">{m.stunden.toFixed(1)} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Auftrags-Aufschlüsselung */}
          {statistik.perAuftrag.length > 0 && (
            <div className="bg-[var(--color-surface-container)] border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-[var(--color-on-surface)]">Auftrags-Aufschlüsselung</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-2 text-xs text-[var(--color-on-surface-variant)]">Auftrag</th>
                    <th className="text-right px-5 py-2 text-xs text-[var(--color-on-surface-variant)]">Protokolle</th>
                    <th className="text-right px-5 py-2 text-xs text-[var(--color-on-surface-variant)]">Gepflanzt</th>
                    <th className="text-right px-5 py-2 text-xs text-[var(--color-on-surface-variant)]">ha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statistik.perAuftrag.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--color-surface-container-low)]">
                      <td className="px-5 py-2 text-[var(--color-on-surface)]">{a.titel}</td>
                      <td className="px-5 py-2 text-right text-[var(--color-on-surface-variant)]">{a.protokolleCount}</td>
                      <td className="px-5 py-2 text-right text-emerald-400">{a.gepflanzt.toLocaleString("de-DE")}</td>
                      <td className="px-5 py-2 text-right text-[var(--color-on-surface-variant)]">{a.ha.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
