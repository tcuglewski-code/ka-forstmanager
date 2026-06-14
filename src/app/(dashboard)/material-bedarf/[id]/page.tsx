"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Package, ArrowLeft, ShoppingCart, Sparkles, Cpu, Hand } from "lucide-react"
import Link from "next/link"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

// ─── Types ───────────────────────────────────────────────────────────────────
interface Position {
  id: string
  bezeichnung: string
  menge: number
  einheit: string
  einzelpreis: number | null
  gesamtpreis: number | null
  lagerBestand: number | null
  zuBestellenMenge: number | null
  berechnungsFormel: string | null
  quelle: "FORMEL" | "LLM" | "MANUELL"
  konfidenz: number
}
interface BestellPosition {
  bezeichnung: string
  menge: number
  preis: number | null
}
interface BestellVorschlag {
  id: string
  lieferantName: string | null
  positionenJson: BestellPosition[]
  gesamtBetrag: number
  status: "VORSCHLAG" | "BESTELLT" | "GELIEFERT"
  bestelltAm: string | null
}
interface MaterialBedarfDetail {
  id: string
  status: string
  gesamtKosten: number | null
  llmKostenCent: number
  erstelltAm: string
  killSwitchAktiv: boolean
  positionen: Position[]
  bestellVorschlaege: BestellVorschlag[]
  angebot?: { id: string; nummer: string | null } | null
  auftrag?: { id: string; nummer: string | null; titel: string } | null
}

function formatEuro(value: number | null | undefined): string {
  if (value == null) return "–"
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
}
function formatDatum(iso: string | null | undefined): string {
  if (!iso) return "–"
  return new Date(iso).toLocaleDateString("de-DE")
}
function formatMenge(menge: number, einheit: string): string {
  return `${menge.toLocaleString("de-DE")} ${einheit}`
}

const QUELLE_CONFIG: Record<Position["quelle"], { label: string; farbe: string; Icon: typeof Cpu }> = {
  FORMEL: { label: "Formel", farbe: "bg-blue-100 text-blue-800 border-blue-500/30", Icon: Cpu },
  LLM: { label: "KI-Schätzung", farbe: "bg-purple-100 text-purple-800 border-purple-500/30", Icon: Sparkles },
  MANUELL: { label: "Manuell", farbe: "bg-gray-100 text-gray-700 border-zinc-500/30", Icon: Hand },
}

function QuelleBadge({ quelle }: { quelle: Position["quelle"] }) {
  const cfg = QUELLE_CONFIG[quelle] ?? QUELLE_CONFIG.MANUELL
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.farbe}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  )
}

const BESTELL_STATUS: Record<BestellVorschlag["status"], { label: string; farbe: string }> = {
  VORSCHLAG: { label: "Vorschlag", farbe: "bg-amber-100 text-amber-800 border-amber-500/30" },
  BESTELLT: { label: "Bestellt", farbe: "bg-emerald-100 text-emerald-800 border-emerald-500/30" },
  GELIEFERT: { label: "Geliefert", farbe: "bg-blue-100 text-blue-800 border-blue-500/30" },
}

export default function MaterialBedarfDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""
  const [bedarf, setBedarf] = useState<MaterialBedarfDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [bestellBusy, setBestellBusy] = useState<string | null>(null)

  const laden = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/material-bedarf/${id}`)
      if (!res.ok) throw new Error("Laden fehlgeschlagen")
      setBedarf(await res.json())
    } catch {
      toast.error("Materialbedarf konnte nicht geladen werden")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    laden()
  }, [laden])

  async function bestellen(bestellVorschlagId: string) {
    setBestellBusy(bestellVorschlagId)
    try {
      const res = await fetch(`/api/material-bedarf/${id}/bestellen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bestellVorschlagId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Bestellung fehlgeschlagen")
      if (data.bereitsBestellt) {
        toast.info("Bereits bestellt.")
      } else if (data.benachrichtigt) {
        toast.success("Bestellt — Lieferant wurde benachrichtigt.")
      } else {
        toast.success("Als bestellt markiert (keine E-Mail hinterlegt).")
      }
      await laden()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler")
    } finally {
      setBestellBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500">Lädt…</p>
      </div>
    )
  }
  if (!bedarf) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500">Materialbedarf nicht gefunden.</p>
        <Link href="/material-bedarf" className="text-[#2C3A1C] hover:underline inline-flex items-center gap-1 mt-2">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
      </div>
    )
  }

  const quelle = bedarf.angebot
    ? `Angebot ${bedarf.angebot.nummer ?? ""}`
    : bedarf.auftrag
    ? `Auftrag ${bedarf.auftrag.nummer ?? bedarf.auftrag.titel}`
    : "Direkt-Eingabe"

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Material-Bedarf", href: "/material-bedarf" }, { label: "Detail" }]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2C3A1C] flex items-center gap-2">
          <Package className="w-6 h-6" /> Materialbedarf
        </h1>
        <Link href="/material-bedarf" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[#2C3A1C]">
          <ArrowLeft className="w-4 h-4" /> Übersicht
        </Link>
      </div>

      {/* Kopf-Infos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Quelle</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{quelle}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{bedarf.status}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Geschätzte Kosten</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{formatEuro(bedarf.gesamtKosten)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Erstellt</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{formatDatum(bedarf.erstelltAm)}</p>
        </div>
      </div>

      {bedarf.killSwitchAktiv && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Hinweis: Der Material-Agent war bei der Berechnung deaktiviert (Kill-Switch). Werte ggf. erneut berechnen.
        </div>
      )}

      {/* Positionen */}
      <h2 className="text-lg font-semibold text-[#2C3A1C] mb-3">Positionen</h2>
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Bezeichnung</th>
              <th className="px-4 py-3 font-medium">Bedarf</th>
              <th className="px-4 py-3 font-medium">Lager</th>
              <th className="px-4 py-3 font-medium">Zu bestellen</th>
              <th className="px-4 py-3 font-medium">Einzelpreis</th>
              <th className="px-4 py-3 font-medium">Quelle</th>
            </tr>
          </thead>
          <tbody>
            {bedarf.positionen.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-800">
                  {p.bezeichnung}
                  {p.berechnungsFormel && (
                    <span className="block text-xs text-gray-400 mt-0.5" title={p.berechnungsFormel}>
                      {p.berechnungsFormel}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{formatMenge(p.menge, p.einheit)}</td>
                <td className="px-4 py-3 text-gray-600">{p.lagerBestand != null ? formatMenge(p.lagerBestand, p.einheit) : "–"}</td>
                <td className="px-4 py-3">
                  {p.zuBestellenMenge != null && p.zuBestellenMenge > 0 ? (
                    <span className="font-medium text-red-700">{formatMenge(p.zuBestellenMenge, p.einheit)}</span>
                  ) : (
                    <span className="text-emerald-700">vorhanden</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{formatEuro(p.einzelpreis)}</td>
                <td className="px-4 py-3"><QuelleBadge quelle={p.quelle} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bestellvorschläge */}
      <h2 className="text-lg font-semibold text-[#2C3A1C] mb-3 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" /> Bestellvorschläge
      </h2>
      {bedarf.bestellVorschlaege.length === 0 ? (
        <p className="text-gray-500 text-sm">Keine Bestellung nötig — alles auf Lager.</p>
      ) : (
        <div className="space-y-4">
          {bedarf.bestellVorschlaege.map((v) => {
            const cfg = BESTELL_STATUS[v.status] ?? BESTELL_STATUS.VORSCHLAG
            return (
              <div key={v.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800">{v.lieferantName ?? "Lieferant"}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.farbe}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">{formatEuro(v.gesamtBetrag)}</span>
                    {v.status === "VORSCHLAG" ? (
                      <button
                        disabled={bestellBusy === v.id}
                        onClick={() => bestellen(v.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2C3A1C] text-white rounded-lg text-sm hover:bg-[#3d5a2a] disabled:opacity-50"
                      >
                        <ShoppingCart className="w-4 h-4" /> {bestellBusy === v.id ? "Bestelle…" : "Bestellen"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">{v.bestelltAm ? `am ${formatDatum(v.bestelltAm)}` : ""}</span>
                    )}
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {v.positionenJson.map((p, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{p.bezeichnung}</span>
                      <span>
                        {p.menge.toLocaleString("de-DE")}
                        {p.preis != null ? ` · ${formatEuro(p.preis)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
