"use client"

import { useState, useEffect } from "react"
import { BarChart3, Download, Loader2, TreePine, Users, Package, FileText } from "lucide-react"

interface Saison { id: string; name: string }
interface SaisonReport {
  saison: Saison
  stats: {
    auftraege: number
    gepflanzt: number
    flaeche: string
    gruppen: number
    mitarbeiter: number
    protokolle: number
  }
  auftraege: { id: string; titel: string; typ: string; status: string; flaeche_ha?: number | null }[]
  gruppen: { id: string; name: string }[]
}

interface MitarbeiterReport {
  monat: number
  jahr: number
  mitarbeiter: {
    mitarbeiter: { vorname: string; nachname: string; stundenlohn: number | null }
    stunden: number
    brutto: number
  }[]
}

function exportCSV(filename: string, rows: string[][], headers: string[]) {
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<"saison" | "mitarbeiter" | "lager">("saison")
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [selectedSaison, setSelectedSaison] = useState("")
  const [saisonReport, setSaisonReport] = useState<SaisonReport | null>(null)
  const [saisonLoading, setSaisonLoading] = useState(false)
  const [monat, setMonat] = useState(new Date().getMonth() + 1)
  const [jahr, setJahr] = useState(new Date().getFullYear())
  const [maReport, setMaReport] = useState<MitarbeiterReport | null>(null)
  const [maLoading, setMaLoading] = useState(false)
  const [lagerItems, setLagerItems] = useState<{ id: string; name: string; bestand: number; mindestbestand: number; einheit: string }[]>([])
  const [lagerLoading, setLagerLoading] = useState(false)

  useEffect(() => {
    fetch("/api/reports/saison").then((r) => r.json()).then((d) => setSaisons(d.saisons ?? []))
  }, [])

  async function loadSaisonReport() {
    if (!selectedSaison) return
    setSaisonLoading(true)
    const r = await fetch(`/api/reports/saison?saisonId=${selectedSaison}`).then((r) => r.json())
    setSaisonReport(r)
    setSaisonLoading(false)
  }

  async function loadMaReport() {
    setMaLoading(true)
    const r = await fetch(`/api/reports/mitarbeiter?monat=${monat}&jahr=${jahr}`).then((r) => r.json())
    setMaReport(r)
    setMaLoading(false)
  }

  async function loadLager() {
    setLagerLoading(true)
    const r = await fetch("/api/lager").then((r) => r.json())
    setLagerItems(Array.isArray(r) ? r : [])
    setLagerLoading(false)
  }

  useEffect(() => {
    if (activeReport === "lager") loadLager()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport])

  function exportSaisonCSV() {
    if (!saisonReport) return
    const rows = saisonReport.auftraege.map((a) => [a.titel, a.typ, a.status, String(a.flaeche_ha ?? 0)])
    exportCSV(`saison-${saisonReport.saison.name}.csv`, rows, ["Titel", "Typ", "Status", "Fläche ha"])
  }

  function exportMaCSV() {
    if (!maReport) return
    const rows = maReport.mitarbeiter.map((m) => [
      `${m.mitarbeiter.vorname} ${m.mitarbeiter.nachname}`,
      String(m.stunden.toFixed(1)),
      String(m.mitarbeiter.stundenlohn ?? 0),
      String(m.brutto.toFixed(2)),
    ])
    exportCSV(`mitarbeiter-${maReport.monat}-${maReport.jahr}.csv`, rows, ["Name", "Stunden", "Stundenlohn", "Brutto"])
  }

  function exportLagerCSV() {
    const rows = lagerItems.map((l) => [l.name, String(l.bestand), l.einheit, String(l.mindestbestand)])
    exportCSV("lager-bericht.csv", rows, ["Artikel", "Bestand", "Einheit", "Mindestbestand"])
  }

  const reportKacheln = [
    { key: "saison", label: "Saison-Report", icon: TreePine, desc: "Aufträge, Bäume, Flächen" },
    { key: "mitarbeiter", label: "Mitarbeiter-Report", icon: Users, desc: "Stunden & Brutto" },
    { key: "lager", label: "Lager-Report", icon: Package, desc: "Bestände & Alerts" },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" /> Reports
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Auswertungen und CSV-Export</p>
      </div>

      {/* Report Kacheln */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {reportKacheln.map((k) => {
          const Icon = k.icon
          return (
            <button
              key={k.key}
              onClick={() => setActiveReport(k.key as typeof activeReport)}
              className={`p-5 rounded-xl border text-left transition-all ${activeReport === k.key ? "bg-[#2C3A1C] border-emerald-500/30 text-emerald-400" : "bg-[#161616] border-[#2a2a2a] text-zinc-400 hover:border-zinc-600"}`}
            >
              <Icon className="w-5 h-5 mb-2" />
              <p className="font-semibold text-sm">{k.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{k.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Saison Report */}
      {activeReport === "saison" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select value={selectedSaison} onChange={(e) => setSelectedSaison(e.target.value)} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white flex-1">
              <option value="">— Saison auswählen —</option>
              {saisons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={loadSaisonReport} disabled={!selectedSaison || saisonLoading} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saisonLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Laden"}
            </button>
            <button onClick={exportSaisonCSV} disabled={!saisonReport} className="flex items-center gap-2 px-4 py-2 bg-[#161616] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-lg text-sm disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
          {saisonReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: "Aufträge", value: saisonReport.stats.auftraege },
                  { label: "Gepflanzt", value: saisonReport.stats.gepflanzt.toLocaleString() + " Stk." },
                  { label: "Fläche", value: saisonReport.stats.flaeche + " ha" },
                  { label: "Gruppen", value: saisonReport.stats.gruppen },
                  { label: "Mitarbeiter", value: saisonReport.stats.mitarbeiter },
                  { label: "Protokolle", value: saisonReport.stats.protokolle },
                ].map((s) => (
                  <div key={s.label} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
                    <p className="text-xs text-zinc-500">{s.label}</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2a2a2a]">
                  <h3 className="font-semibold text-white">Aufträge</h3>
                </div>
                <table className="w-full">
                  <thead><tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-6 py-3 text-xs text-zinc-500">Titel</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500">Typ</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500">Status</th>
                    <th className="text-left px-6 py-3 text-xs text-zinc-500">Fläche</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {saisonReport.auftraege.map((a) => (
                      <tr key={a.id} className="hover:bg-[#1c1c1c]">
                        <td className="px-6 py-3 text-sm text-white">
                          {a.titel}
                          <a href={`/auftraege/${a.id}`} className="text-blue-400 hover:underline text-xs ml-2">
                            Details →
                          </a>
                        </td>
                        <td className="px-6 py-3 text-sm text-zinc-400">{a.typ}</td>
                        <td className="px-6 py-3 text-sm text-zinc-400">{a.status}</td>
                        <td className="px-6 py-3 text-sm text-zinc-400">{a.flaeche_ha ?? "—"} ha</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mitarbeiter Report */}
      {activeReport === "mitarbeiter" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select value={monat} onChange={(e) => setMonat(Number(e.target.value))} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
              {monate.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={jahr} onChange={(e) => setJahr(Number(e.target.value))} className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white">
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={loadMaReport} disabled={maLoading} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {maLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Laden"}
            </button>
            <button onClick={exportMaCSV} disabled={!maReport} className="flex items-center gap-2 px-4 py-2 bg-[#161616] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-lg text-sm disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
          {maReport && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2a2a2a]">
                <h3 className="font-semibold text-white">{monate[maReport.monat - 1]} {maReport.jahr}</h3>
              </div>
              <table className="w-full">
                <thead><tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Mitarbeiter</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Stunden</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Stundenlohn</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Brutto</th>
                </tr></thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {maReport.mitarbeiter.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-600">Keine Stunden</td></tr>
                  ) : maReport.mitarbeiter.map((m, i) => (
                    <tr key={i} className="hover:bg-[#1c1c1c]">
                      <td className="px-6 py-3 text-sm text-white">{m.mitarbeiter.vorname} {m.mitarbeiter.nachname}</td>
                      <td className="px-6 py-3 text-sm text-emerald-400">{m.stunden.toFixed(1)} h</td>
                      <td className="px-6 py-3 text-sm text-zinc-400">{m.mitarbeiter.stundenlohn?.toFixed(2) ?? "—"} €</td>
                      <td className="px-6 py-3 text-sm font-medium text-white">{m.brutto.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
                {maReport.mitarbeiter.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-[#2a2a2a] bg-[#1a1a1a]">
                      <td className="px-6 py-3 text-sm font-medium text-zinc-400">Gesamt</td>
                      <td className="px-6 py-3 text-sm font-medium text-emerald-400">{maReport.mitarbeiter.reduce((s, m) => s + m.stunden, 0).toFixed(1)} h</td>
                      <td></td>
                      <td className="px-6 py-3 text-sm font-bold text-white">{maReport.mitarbeiter.reduce((s, m) => s + m.brutto, 0).toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* DATEV-Export */}
      <div className="mt-8 bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-300">DATEV-Export (Steuerberater)</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a
            href="/api/export/datev-rechnungen"
            className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Download className="w-4 h-4" /> Rechnungen DATEV CSV
          </a>
          <a
            href="/api/export/datev-lohn"
            className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Download className="w-4 h-4" /> Lohnabrechnungen DATEV CSV
          </a>
        </div>
        <p className="text-xs text-zinc-600 mt-3">
          Rechnungen-Export im DATEV-Buchungsstapel-Format (CSV). Lohnexport enthält alle Lohnabrechnungen.
        </p>
      </div>

      {/* Lager Report */}
      {activeReport === "lager" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={exportLagerCSV} disabled={lagerLoading} className="flex items-center gap-2 px-4 py-2 bg-[#161616] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-lg text-sm disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV exportieren
            </button>
          </div>
          {lagerLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Artikel</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Bestand</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Einheit</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Mindestbestand</th>
                  <th className="text-left px-6 py-3 text-xs text-zinc-500">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {lagerItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-600">Kein Lager</td></tr>
                  ) : lagerItems.map((l) => (
                    <tr key={l.id} className="hover:bg-[#1c1c1c]">
                      <td className="px-6 py-3 text-sm text-white">{l.name}</td>
                      <td className="px-6 py-3 text-sm font-medium text-white">{l.bestand}</td>
                      <td className="px-6 py-3 text-sm text-zinc-400">{l.einheit}</td>
                      <td className="px-6 py-3 text-sm text-zinc-400">{l.mindestbestand}</td>
                      <td className="px-6 py-3">
                        {l.bestand < l.mindestbestand ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">Kritisch</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">OK</span>
                        )}
                      </td>
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
