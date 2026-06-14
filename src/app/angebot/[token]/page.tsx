"use client"

/**
 * A1 — Öffentliche Angebots-Ansicht für Waldbesitzer (ANG-033)
 * Kein Login. Zeigt das Angebot, erlaubt Annahme/Ablehnung. Markenkonform.
 */
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"

interface PortalAngebot {
  nummer: string | null
  beschreibung: string | null
  waldbesitzerName: string | null
  status: string
  gesamtNetto: number | null
  mwstBetrag: number | null
  gesamtBrutto: number | null
  gueltigBis: string | null
  foerderHinweis: string | null
  positionen: { bezeichnung: string; menge: number; einheit: string; einzelpreis: number; gesamtpreis: number }[]
  varianten: { stufe: string; titel: string | null; verkaufstext: string | null; gesamtBrutto: number }[]
}

function eur(n: number | null | undefined): string {
  if (n == null) return "–"
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
}

export default function PortalPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PortalAngebot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const laden = useCallback(async () => {
    const res = await fetch(`/api/angebote/portal/${token}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [token])

  useEffect(() => {
    laden()
  }, [laden])

  async function aktion(a: "annehmen" | "ablehnen") {
    setBusy(true)
    try {
      const res = await fetch(`/api/angebote/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktion: a }),
      })
      if (res.ok) {
        setMsg(a === "annehmen" ? "Vielen Dank! Ihre Zusage ist eingegangen." : "Ihre Rückmeldung ist eingegangen.")
        laden()
      } else {
        const e = await res.json().catch(() => ({}))
        setMsg(e.error ?? "Aktion fehlgeschlagen")
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Lädt…</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Angebot nicht gefunden.</div>

  const abgeschlossen = ["angenommen", "abgelehnt"].includes(data.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-2" style={{ backgroundColor: "#2C3A1C" }} />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold" style={{ color: "#2C3A1C" }}>
          Angebot {data.nummer}
        </h1>
        <p className="text-gray-600">{data.beschreibung}</p>
        {data.gueltigBis && (
          <p className="text-sm text-gray-500 mt-1">
            Gültig bis: {new Date(data.gueltigBis).toLocaleDateString("de-DE")}
          </p>
        )}

        <div className="mt-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="px-4 py-2">Leistung</th>
                <th className="px-2 py-2 text-right">Menge</th>
                <th className="px-2 py-2 text-right">Einzel</th>
                <th className="px-2 py-2 text-right">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {data.positionen.map((p, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-2">{p.bezeichnung}</td>
                  <td className="px-2 py-2 text-right">
                    {p.menge.toLocaleString("de-DE")} {p.einheit}
                  </td>
                  <td className="px-2 py-2 text-right">{eur(p.einzelpreis)}</td>
                  <td className="px-2 py-2 text-right">{eur(p.gesamtpreis)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-6 bg-gray-50 px-4 py-3 text-sm">
            <span>Netto: {eur(data.gesamtNetto)}</span>
            <span>MwSt: {eur(data.mwstBetrag)}</span>
            <span className="font-bold" style={{ color: "#2C3A1C" }}>
              Gesamt: {eur(data.gesamtBrutto)}
            </span>
          </div>
        </div>

        {data.foerderHinweis && (
          <div className="mt-4 rounded-lg border-l-4 p-3 text-sm text-gray-700" style={{ borderColor: "#C5A55A", backgroundColor: "#FBF7EC" }}>
            <strong>Förderhinweis (unverbindlich):</strong> {data.foerderHinweis}
          </div>
        )}

        {msg && (
          <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">{msg}</div>
        )}

        {!abgeschlossen && !msg && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => aktion("annehmen")}
              disabled={busy}
              className="px-6 py-3 rounded-lg text-white font-medium disabled:opacity-60"
              style={{ backgroundColor: "#2C3A1C" }}
            >
              Angebot annehmen
            </button>
            <button
              onClick={() => aktion("ablehnen")}
              disabled={busy}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-60"
            >
              Ablehnen
            </button>
          </div>
        )}

        {abgeschlossen && !msg && (
          <p className="mt-6 text-gray-600">
            Status: <strong>{data.status}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
