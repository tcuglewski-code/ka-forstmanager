"use client"

/**
 * A1 — Angebots-Detail / KI-Entwurf-Review (ANG-028)
 * Zeigt Positionen (editierbar), Gut/Besser/Best-Varianten, Warnungen und
 * erlaubt Freigabe (Mensch-im-Loop) sowie PDF-Vorschau.
 */
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { FileText, CheckCircle2, Layers, Loader2, Pencil } from "lucide-react"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

interface Position {
  id: string
  bezeichnung: string
  menge: number
  einheit: string
  einzelpreis: number
  gesamtpreis: number
  mwstSatz: number
  quelle: string
  konfidenz: number
  manuellGeaendert: boolean
}

interface Variante {
  id: string
  stufe: string
  titel: string | null
  verkaufstext: string | null
  gesamtNetto: number
  gesamtBrutto: number
}

interface Angebot {
  id: string
  nummer: string | null
  status: string
  beschreibung: string | null
  waldbesitzerName: string | null
  flaeche_ha: number | null
  gesamtNetto: number | null
  mwstBetrag: number | null
  gesamtpreis: number | null
  kiGeneriert: boolean
  kiModell: string | null
  kiKostenCent: number | null
  freigegebenAm: string | null
  anfrageSpezifikationJson: { rueckfragenErforderlich?: string[]; konfidenz?: number } | null
}

function eur(n: number | null | undefined): string {
  if (n == null) return "–"
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
}

export default function AngebotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [angebot, setAngebot] = useState<Angebot | null>(null)
  const [positionen, setPositionen] = useState<Position[]>([])
  const [varianten, setVarianten] = useState<Variante[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const laden = useCallback(async () => {
    setLoading(true)
    const [a, p, v] = await Promise.all([
      fetch(`/api/angebote/${id}`).then((r) => r.json()),
      fetch(`/api/angebote/${id}/positionen`).then((r) => r.json()),
      fetch(`/api/angebote/${id}/varianten`).then((r) => r.json()),
    ])
    setAngebot(a)
    setPositionen(Array.isArray(p) ? p : [])
    setVarianten(Array.isArray(v) ? v : [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    laden()
  }, [laden])

  async function freigeben() {
    setBusy(true)
    try {
      const res = await fetch(`/api/angebote/${id}/freigeben`, { method: "POST" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error ?? "Freigabe fehlgeschlagen")
        return
      }
      toast.success("Angebot freigegeben")
      laden()
    } finally {
      setBusy(false)
    }
  }

  async function variantenErzeugen() {
    setBusy(true)
    try {
      const res = await fetch(`/api/angebote/${id}/varianten`, { method: "POST" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error ?? "Varianten fehlgeschlagen")
        return
      }
      toast.success("Gut/Besser/Best erzeugt")
      laden()
    } finally {
      setBusy(false)
    }
  }

  async function positionAendern(pos: Position) {
    const neueMenge = prompt(`Menge für "${pos.bezeichnung}"`, String(pos.menge))
    if (neueMenge == null) return
    const neuerPreis = prompt(`Einzelpreis (€) für "${pos.bezeichnung}"`, String(pos.einzelpreis))
    if (neuerPreis == null) return
    setBusy(true)
    try {
      const res = await fetch(`/api/angebote/${id}/positionen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId: pos.id, menge: Number(neueMenge), einzelpreis: Number(neuerPreis) }),
      })
      if (!res.ok) {
        toast.error("Änderung fehlgeschlagen")
        return
      }
      toast.success("Position aktualisiert")
      laden()
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Lädt…</div>
  if (!angebot?.id) return <div className="p-6 text-gray-500">Angebot nicht gefunden.</div>

  const rueckfragen = angebot.anfrageSpezifikationJson?.rueckfragenErforderlich ?? []
  const istFreigegeben = angebot.status === "freigegeben" || !!angebot.freigegebenAm

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Breadcrumb items={[{ label: "Angebote", href: "/angebote" }, { label: angebot.nummer ?? "Angebot" }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#2C3A1C" }}>
            {angebot.nummer ?? "Angebot"}
          </h1>
          <p className="text-sm text-gray-600">
            {angebot.beschreibung ?? "—"} · {angebot.flaeche_ha ?? "?"} ha
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{angebot.status}</span>
            {angebot.kiGeneriert && (
              <span className="rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: "#C5A55A" }}>
                KI {angebot.kiModell ?? ""} · {((angebot.kiKostenCent ?? 0) / 100).toFixed(2)} €
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={`/api/angebote/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700"
          >
            <FileText className="w-4 h-4" /> PDF
          </a>
          <button
            onClick={variantenErzeugen}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm disabled:opacity-60"
            style={{ borderColor: "#C5A55A", color: "#2C3A1C" }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Gut/Besser/Best
          </button>
          {!istFreigegeben && (
            <button
              onClick={freigeben}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-60"
              style={{ backgroundColor: "#2C3A1C" }}
            >
              <CheckCircle2 className="w-4 h-4" /> Freigeben
            </button>
          )}
        </div>
      </div>

      {rueckfragen.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <p className="font-semibold text-sm">Offene Rückfragen für die Kalkulation:</p>
          <ul className="mt-1 list-disc list-inside text-sm">
            {rueckfragen.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Positionen */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 text-sm font-semibold" style={{ color: "#2C3A1C" }}>
          Positionen
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="px-4 py-2">Leistung</th>
              <th className="px-2 py-2 text-right">Menge</th>
              <th className="px-2 py-2">Einh.</th>
              <th className="px-2 py-2 text-right">Einzel</th>
              <th className="px-2 py-2 text-right">Gesamt</th>
              <th className="px-2 py-2">Quelle</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {positionen.map((p) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="px-4 py-2">{p.bezeichnung}</td>
                <td className="px-2 py-2 text-right">{p.menge.toLocaleString("de-DE")}</td>
                <td className="px-2 py-2">{p.einheit}</td>
                <td className="px-2 py-2 text-right">{eur(p.einzelpreis)}</td>
                <td className="px-2 py-2 text-right">{eur(p.gesamtpreis)}</td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      p.quelle === "geschaetzt"
                        ? "bg-amber-100 text-amber-700"
                        : p.manuellGeaendert
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {p.manuellGeaendert ? "manuell" : p.quelle}
                  </span>
                </td>
                <td className="px-2 py-2">
                  {!istFreigegeben && (
                    <button onClick={() => positionAendern(p)} className="text-gray-400 hover:text-gray-700">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {positionen.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Keine Positionen
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-end gap-6 border-t border-gray-200 bg-gray-50 px-4 py-2 text-sm">
          <span>Netto: {eur(angebot.gesamtNetto)}</span>
          <span>MwSt: {eur(angebot.mwstBetrag)}</span>
          <span className="font-semibold" style={{ color: "#2C3A1C" }}>
            Brutto: {eur(angebot.gesamtpreis)}
          </span>
        </div>
      </div>

      {/* Varianten */}
      {varianten.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {varianten.map((v) => (
            <div key={v.id} className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs uppercase tracking-wide" style={{ color: "#C5A55A" }}>
                {v.stufe}
              </div>
              <div className="font-semibold" style={{ color: "#2C3A1C" }}>
                {v.titel ?? v.stufe}
              </div>
              <p className="mt-1 text-xs text-gray-600">{v.verkaufstext}</p>
              <div className="mt-3 text-lg font-bold" style={{ color: "#2C3A1C" }}>
                {eur(v.gesamtBrutto)}
              </div>
              <div className="text-xs text-gray-500">{eur(v.gesamtNetto)} netto</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
