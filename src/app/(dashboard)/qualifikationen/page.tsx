"use client"

import { useState, useEffect, useCallback } from "react"
import { GraduationCap, Plus, Trash2, Loader2, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/useConfirm"

interface Qualifikation {
  id: string
  name: string
  typ: string
  beschreibung?: string | null
  mitarbeiterCount: number
}

interface MitarbeiterQual {
  id: string
  mitarbeiter: { id: string; vorname: string; nachname: string }
  qualifikation: { id: string; name: string; typ: string }
  erworbenAm?: string | null
  ablaufDatum?: string | null
  notiz?: string | null
}

interface Mitarbeiter {
  id: string
  vorname: string
  nachname: string
}

const typBadge: Record<string, string> = {
  fuehrerschein: "bg-blue-100 text-blue-800",
  sicherheit: "bg-red-100 text-red-800",
  zertifikat: "bg-emerald-100 text-emerald-800",
  sonstiges: "bg-zinc-700/50 text-zinc-400",
}

const typLabel: Record<string, string> = {
  fuehrerschein: "Führerschein",
  sicherheit: "Sicherheit",
  zertifikat: "Zertifikat",
  sonstiges: "Sonstiges",
}

function ablaufStatus(ablauf?: string | null): "abgelaufen" | "kritisch" | "ok" | "none" {
  if (!ablauf) return "none"
  const heute = new Date()
  const d = new Date(ablauf)
  if (d < heute) return "abgelaufen"
  const diff = (d.getTime() - heute.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return "kritisch"
  return "ok"
}

export default function QualifikationenPage() {
  const { confirm, ConfirmDialogElement } = useConfirm()
  const [tab, setTab] = useState<"katalog" | "mitarbeiter">("katalog")
  const [qualifikationen, setQualifikationen] = useState<Qualifikation[]>([])
  const [mitarbeiterQuals, setMitarbeiterQuals] = useState<MitarbeiterQual[]>([])
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", typ: "zertifikat", beschreibung: "" })
  const [assignForm, setAssignForm] = useState({ mitarbeiterId: "", qualifikationId: "", erworbenAm: "", ablaufDatum: "" })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [q, mq, m] = await Promise.all([
      fetch("/api/qualifikationen").then((r) => r.json()),
      fetch(`/api/mitarbeiter-qualifikationen${filter ? `?filter=${filter}` : ""}`).then((r) => r.json()),
      fetch("/api/mitarbeiter").then((r) => r.json()),
    ])
    setQualifikationen(Array.isArray(q) ? q : [])
    setMitarbeiterQuals(Array.isArray(mq) ? mq : [])
    setMitarbeiter(Array.isArray(m) ? m : [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function createQual() {
    setSaving(true)
    await fetch("/api/qualifikationen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm({ name: "", typ: "zertifikat", beschreibung: "" })
    await fetchAll()
    setSaving(false)
  }

  async function deleteQual(id: string) {
    const ok = await confirm({ title: "Bestätigen", message: "Qualifikation löschen?" })
    if (!ok) return
    await fetch(`/api/qualifikationen/${id}`, { method: "DELETE" })
    await fetchAll()
  }

  async function assignQual() {
    setSaving(true)
    await fetch("/api/mitarbeiter-qualifikationen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assignForm) })
    setShowAssignModal(false)
    setAssignForm({ mitarbeiterId: "", qualifikationId: "", erworbenAm: "", ablaufDatum: "" })
    await fetchAll()
    setSaving(false)
  }

  async function removeAssignment(id: string) {
    const ok = await confirm({ title: "Bestätigen", message: "Zuweisung entfernen?" })
    if (!ok) return
    await fetch(`/api/mitarbeiter-qualifikationen/${id}`, { method: "DELETE" })
    await fetchAll()
  }

  return (
    <div className="max-w-6xl mx-auto">
      {ConfirmDialogElement}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-400" /> Qualifikationen
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Zertifikate, Führerscheine, Sicherheitsnachweise</p>
        </div>
        <button
          onClick={() => tab === "katalog" ? setShowModal(true) : setShowAssignModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          {tab === "katalog" ? "Qualifikation anlegen" : "Qualifikation zuweisen"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#161616] border border-[#2a2a2a] rounded-lg p-1 w-fit">
        {(["katalog", "mitarbeiter"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-400 hover:text-white"}`}
          >
            {t === "katalog" ? "Katalog" : "Mitarbeiter-Qualifikationen"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : tab === "katalog" ? (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Typ</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Beschreibung</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Mitarbeiter</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {qualifikationen.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-600">Keine Qualifikationen</td></tr>
              ) : qualifikationen.map((q) => (
                <tr key={q.id} className="hover:bg-[#1c1c1c]">
                  <td className="px-6 py-4 text-sm font-medium text-white">{q.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${typBadge[q.typ] ?? "bg-zinc-700 text-zinc-400"}`}>
                      {typLabel[q.typ] ?? q.typ}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{q.beschreibung ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{q.mitarbeiterCount}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteQual(q.id)} className="text-zinc-600 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {["", "30", "60", "90"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === f ? "bg-emerald-100 text-emerald-800 border border-emerald-500/30" : "bg-[#161616] text-zinc-400 border border-[#2a2a2a] hover:border-zinc-600"}`}
              >
                {f === "" ? "Alle" : `Ablauf in ${f} Tagen`}
              </button>
            ))}
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Mitarbeiter</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Qualifikation</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Erworben</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Ablauf</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {mitarbeiterQuals.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-600">Keine Einträge</td></tr>
                ) : mitarbeiterQuals.map((mq) => {
                  const st = ablaufStatus(mq.ablaufDatum)
                  return (
                    <tr key={mq.id} className="hover:bg-[#1c1c1c]">
                      <td className="px-6 py-4 text-sm text-white">{mq.mitarbeiter.vorname} {mq.mitarbeiter.nachname}</td>
                      <td className="px-6 py-4 text-sm text-zinc-300">{mq.qualifikation.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{mq.erworbenAm ? new Date(mq.erworbenAm).toLocaleDateString("de-DE") : "—"}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{mq.ablaufDatum ? new Date(mq.ablaufDatum).toLocaleDateString("de-DE") : "—"}</td>
                      <td className="px-6 py-4">
                        {st === "abgelaufen" && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Abgelaufen</span>}
                        {st === "kritisch" && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">&lt; 30 Tage</span>}
                        {st === "ok" && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">Gültig</span>}
                        {st === "none" && <span className="text-zinc-600 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => removeAssignment(mq.id)} className="text-zinc-600 hover:text-red-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* Create Qual Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Qualifikation anlegen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" placeholder="z.B. Motorsäge Klasse B" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Typ</label>
                <select value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="fuehrerschein">Führerschein</option>
                  <option value="sicherheit">Sicherheit</option>
                  <option value="zertifikat">Zertifikat</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Beschreibung</label>
                <textarea value={form.beschreibung} onChange={(e) => setForm({ ...form, beschreibung: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={createQual} disabled={saving || !form.name} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Anlegen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Qualifikation zuweisen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Mitarbeiter</label>
                <select value={assignForm.mitarbeiterId} onChange={(e) => setAssignForm({ ...assignForm, mitarbeiterId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— auswählen —</option>
                  {mitarbeiter.map((m) => <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Qualifikation</label>
                <select value={assignForm.qualifikationId} onChange={(e) => setAssignForm({ ...assignForm, qualifikationId: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">— auswählen —</option>
                  {qualifikationen.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Erworben am</label>
                <input type="date" value={assignForm.erworbenAm} onChange={(e) => setAssignForm({ ...assignForm, erworbenAm: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Ablaufdatum</label>
                <input type="date" value={assignForm.ablaufDatum} onChange={(e) => setAssignForm({ ...assignForm, ablaufDatum: e.target.value })} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222]">Abbrechen</button>
              <button onClick={assignQual} disabled={saving || !assignForm.mitarbeiterId || !assignForm.qualifikationId} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Speichern..." : "Zuweisen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
