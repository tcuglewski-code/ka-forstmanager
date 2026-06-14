"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Package, Plus, ExternalLink, Sparkles } from "lucide-react"
import Link from "next/link"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

// ─── Types ───────────────────────────────────────────────────────────────────
interface LagerAbgleich {
  verfuegbar: unknown[]
  teilweise: unknown[]
  fehlt: unknown[]
}
interface MaterialBedarf {
  id: string
  status: string
  gesamtKosten: number | null
  erstelltAm: string
  lagerAbgleichJson: LagerAbgleich | null
  angebot?: { id: string; nummer: string | null } | null
  auftrag?: { id: string; nummer: string | null; titel: string } | null
  _count?: { positionen: number; bestellVorschlaege: number }
}
interface AngebotLite {
  id: string
  nummer: string | null
}

function formatEuro(value: number | null | undefined): string {
  if (value == null) return "–"
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
}
function formatDatum(iso: string | null | undefined): string {
  if (!iso) return "–"
  return new Date(iso).toLocaleDateString("de-DE")
}

const STATUS_CONFIG: Record<string, { label: string; farbe: string }> = {
  NEU: { label: "Neu", farbe: "bg-gray-100 text-gray-700 border-zinc-500/30" },
  BERECHNET: { label: "Berechnet", farbe: "bg-blue-100 text-blue-800 border-blue-500/30" },
  BESTELLT: { label: "Bestellt", farbe: "bg-emerald-100 text-emerald-800 border-emerald-500/30" },
  ABGEBROCHEN: { label: "Abgebrochen", farbe: "bg-red-100 text-red-800 border-red-500/30" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, farbe: "bg-gray-100 text-gray-700 border-zinc-500/30" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.farbe}`}>
      {cfg.label}
    </span>
  )
}

/** Lager-Ampel: rot=Material fehlt, gelb=teilweise, grün=alles vorhanden. */
function LagerAmpel({ abgleich }: { abgleich: LagerAbgleich | null }) {
  if (!abgleich) return <span className="text-gray-400">–</span>
  const fehlt = abgleich.fehlt?.length ?? 0
  const teilweise = abgleich.teilweise?.length ?? 0
  let farbe = "bg-emerald-500"
  let titel = "Alles auf Lager"
  if (fehlt > 0) {
    farbe = "bg-red-500"
    titel = `${fehlt} Position(en) fehlen`
  } else if (teilweise > 0) {
    farbe = "bg-amber-500"
    titel = `${teilweise} Position(en) teilweise`
  }
  return (
    <span className="inline-flex items-center gap-2" title={titel}>
      <span className={`inline-block w-3 h-3 rounded-full ${farbe}`} />
      <span className="text-xs text-gray-600">{titel}</span>
    </span>
  )
}

export default function MaterialBedarfPage() {
  const [liste, setListe] = useState<MaterialBedarf[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOffen, setModalOffen] = useState(false)
  const [angebote, setAngebote] = useState<AngebotLite[]>([])
  const [angebotId, setAngebotId] = useState("")
  const [busy, setBusy] = useState(false)
  // Direkt-Eingabe
  const [direkt, setDirekt] = useState({
    flaecheHa: "",
    baumarten: "",
    pflanzverband: "2x1m",
    leistungsTyp: "pflanzung",
    verbissschutz: false,
    zaun: false,
  })

  const laden = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/material-bedarf")
      if (!res.ok) throw new Error("Laden fehlgeschlagen")
      setListe(await res.json())
    } catch {
      toast.error("Materialbedarfe konnten nicht geladen werden")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    laden()
    fetch("/api/angebote")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAngebote(Array.isArray(d) ? d : d.items ?? []))
      .catch(() => {})
  }, [laden])

  async function berechnen(body: Record<string, unknown>) {
    setBusy(true)
    try {
      const res = await fetch("/api/material-bedarf/berechnen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.status === 503) {
        toast.error("Material-Agent ist deaktiviert (Kill-Switch mat_agent_aktiv).")
        return
      }
      if (!res.ok) throw new Error(data.error || "Berechnung fehlgeschlagen")
      toast.success(`Materialbedarf berechnet: ${data.positionenAnzahl} Position(en)`)
      setModalOffen(false)
      await laden()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: "Material-Bedarf" }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2C3A1C] flex items-center gap-2">
          <Package className="w-6 h-6" /> Material-Bedarf
        </h1>
        <button
          onClick={() => setModalOffen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2C3A1C] text-white rounded-lg hover:bg-[#3d5a2a] text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Neu berechnen
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Lädt…</p>
      ) : liste.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Noch kein Materialbedarf berechnet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Quelle</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Lager</th>
                <th className="px-4 py-3 font-medium">Positionen</th>
                <th className="px-4 py-3 font-medium">Kosten</th>
                <th className="px-4 py-3 font-medium">Erstellt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {liste.map((mb) => (
                <tr key={mb.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {mb.angebot ? `Angebot ${mb.angebot.nummer ?? ""}` : mb.auftrag ? `Auftrag ${mb.auftrag.nummer ?? mb.auftrag.titel}` : "Direkt-Eingabe"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={mb.status} /></td>
                  <td className="px-4 py-3"><LagerAmpel abgleich={mb.lagerAbgleichJson} /></td>
                  <td className="px-4 py-3 text-gray-700">{mb._count?.positionen ?? 0}</td>
                  <td className="px-4 py-3 text-gray-800">{formatEuro(mb.gesamtKosten)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDatum(mb.erstelltAm)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/material-bedarf/${mb.id}`} className="inline-flex items-center gap-1 text-[#2C3A1C] hover:underline">
                      Details <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOffen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalOffen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#2C3A1C] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Materialbedarf berechnen
            </h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Aus Angebot</label>
              <div className="flex gap-2">
                <select
                  value={angebotId}
                  onChange={(e) => setAngebotId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
                >
                  <option value="">– Angebot wählen –</option>
                  {angebote.map((a) => (
                    <option key={a.id} value={a.id}>{a.nummer ?? a.id}</option>
                  ))}
                </select>
                <button
                  disabled={!angebotId || busy}
                  onClick={() => berechnen({ angebotId })}
                  className="px-4 py-2 bg-[#2C3A1C] text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Berechnen
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Oder Direkt-Eingabe</p>
              <div className="grid grid-cols-2 gap-3">
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Fläche (ha)" value={direkt.flaecheHa} onChange={(e) => setDirekt({ ...direkt, flaecheHa: e.target.value })} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Pflanzverband (2x1m)" value={direkt.pflanzverband} onChange={(e) => setDirekt({ ...direkt, pflanzverband: e.target.value })} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 col-span-2" placeholder="Baumarten (Komma-getrennt)" value={direkt.baumarten} onChange={(e) => setDirekt({ ...direkt, baumarten: e.target.value })} />
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" value={direkt.leistungsTyp} onChange={(e) => setDirekt({ ...direkt, leistungsTyp: e.target.value })}>
                  <option value="pflanzung">Pflanzung</option>
                  <option value="saat">Saat</option>
                  <option value="kombination">Kombination</option>
                </select>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={direkt.verbissschutz} onChange={(e) => setDirekt({ ...direkt, verbissschutz: e.target.checked })} /> Verbiss</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={direkt.zaun} onChange={(e) => setDirekt({ ...direkt, zaun: e.target.checked })} /> Zaun</label>
                </div>
              </div>
              <button
                disabled={busy || !direkt.flaecheHa}
                onClick={() =>
                  berechnen({
                    inputSpezifikation: {
                      leistungsTyp: direkt.leistungsTyp,
                      flaecheHa: parseFloat(direkt.flaecheHa.replace(",", ".")) || null,
                      baumarten: direkt.baumarten.split(",").map((s) => s.trim()).filter(Boolean),
                      pflanzverband: direkt.pflanzverband || null,
                      verbissschutz: direkt.verbissschutz,
                      zaun: direkt.zaun,
                    },
                  })
                }
                className="mt-3 w-full px-4 py-2 bg-[#2C3A1C] text-white rounded-lg text-sm disabled:opacity-50"
              >
                {busy ? "Berechne…" : "Direkt berechnen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
