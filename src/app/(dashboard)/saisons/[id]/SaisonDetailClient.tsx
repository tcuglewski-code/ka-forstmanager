"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X, ExternalLink } from "lucide-react"

interface Mitarbeiter { id: string; vorname: string; nachname: string; rolle: string }
interface Anmeldung { id: string; status: string; mitarbeiter: Mitarbeiter }
interface GruppeMitglied { id: string; mitarbeiter: { id: string; vorname: string; nachname: string } }
interface Gruppe { id: string; name: string; mitglieder: GruppeMitglied[] }
interface Auftrag { id: string; titel: string; typ: string; status: string; flaeche_ha?: number | null }
interface Dokument { id: string; name: string; typ: string; url: string; createdAt: string | Date }

interface Props {
  saison: {
    id: string
    anmeldungen: Anmeldung[]
    gruppen: Gruppe[]
    auftraege: Auftrag[]
    dokumente: Dokument[]
  }
  saisonId: string
}

const auftragStatusBadge: Record<string, string> = {
  anfrage: "bg-blue-500/20 text-blue-400",
  bestaetigt: "bg-amber-500/20 text-amber-400",
  in_ausfuehrung: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
}

const dokTypBadge: Record<string, string> = {
  foto: "bg-purple-500/20 text-purple-400",
  karte: "bg-blue-500/20 text-blue-400",
  protokoll: "bg-amber-500/20 text-amber-400",
  foerderantrag: "bg-emerald-500/20 text-emerald-400",
  rechnung: "bg-red-500/20 text-red-400",
  sonstiges: "bg-zinc-700/50 text-zinc-400",
}

export default function SaisonDetailClient({ saison, saisonId }: Props) {
  const [tab, setTab] = useState<"anmeldungen" | "gruppen" | "auftraege" | "dokumente">("anmeldungen")
  const [anmeldungen, setAnmeldungen] = useState<Anmeldung[]>(saison.anmeldungen)
  const [loading, setLoading] = useState<string | null>(null)

  async function updateAnmeldung(anmeldungId: string, status: string) {
    setLoading(anmeldungId)
    await fetch(`/api/saisons/${saisonId}/anmeldungen/${anmeldungId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setAnmeldungen((prev) => prev.map((a) => a.id === anmeldungId ? { ...a, status } : a))
    setLoading(null)
  }

  return (
    <>
      <div className="flex gap-1 mb-6 bg-[#161616] border border-[#2a2a2a] rounded-lg p-1 w-fit">
        {([
          { key: "anmeldungen", label: `Anmeldungen (${anmeldungen.length})` },
          { key: "gruppen", label: `Gruppen (${saison.gruppen.length})` },
          { key: "auftraege", label: `Aufträge (${saison.auftraege.length})` },
          { key: "dokumente", label: `Dokumente (${saison.dokumente.length})` },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.key ? "bg-[#2C3A1C] text-emerald-400" : "text-zinc-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "anmeldungen" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Mitarbeiter</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Rolle</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Status</th>
              <th className="px-6 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {anmeldungen.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600">Keine Anmeldungen</td></tr>
              ) : anmeldungen.map((a) => (
                <tr key={a.id} className="hover:bg-[#1c1c1c]">
                  <td className="px-6 py-4 text-sm text-white">{a.mitarbeiter.vorname} {a.mitarbeiter.nachname}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{a.mitarbeiter.rolle}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.status === "bestaetigt" ? "bg-emerald-500/20 text-emerald-400" : a.status === "abgelehnt" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {a.status === "angemeldet" && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => updateAnmeldung(a.id, "bestaetigt")} disabled={loading === a.id} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30">
                          <Check className="w-3 h-3" /> Bestätigen
                        </button>
                        <button onClick={() => updateAnmeldung(a.id, "abgelehnt")} disabled={loading === a.id} className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">
                          <X className="w-3 h-3" /> Ablehnen
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "gruppen" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {saison.gruppen.length === 0 ? (
            <p className="text-zinc-600 text-sm col-span-2">Keine Gruppen</p>
          ) : saison.gruppen.map((g) => (
            <Link key={g.id} href={`/gruppen/${g.id}`} className="block bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 hover:border-zinc-600 transition-all">
              <h3 className="font-semibold text-white mb-2">{g.name}</h3>
              <p className="text-sm text-zinc-400">{g.mitglieder.length} Mitglieder</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {g.mitglieder.slice(0, 3).map((m) => (
                  <span key={m.id} className="text-xs bg-[#222] text-zinc-400 px-2 py-0.5 rounded">{m.mitarbeiter.vorname} {m.mitarbeiter.nachname}</span>
                ))}
                {g.mitglieder.length > 3 && <span className="text-xs text-zinc-600">+{g.mitglieder.length - 3}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "auftraege" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Titel</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Typ</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Status</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Fläche</th>
            </tr></thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {saison.auftraege.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600">Keine Aufträge</td></tr>
              ) : saison.auftraege.map((a) => (
                <Link key={a.id} href={`/auftraege/${a.id}`} legacyBehavior>
                  <tr className="hover:bg-[#1c1c1c] cursor-pointer">
                    <td className="px-6 py-4 text-sm text-white">{a.titel}</td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{a.typ}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${auftragStatusBadge[a.status] ?? "bg-zinc-700 text-zinc-400"}`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{a.flaeche_ha ?? "—"} ha</td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "dokumente" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Name</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Typ</th>
              <th className="text-left px-6 py-3 text-xs text-zinc-500">Datum</th>
              <th className="px-6 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {saison.dokumente.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600">Keine Dokumente</td></tr>
              ) : saison.dokumente.map((d) => (
                <tr key={d.id} className="hover:bg-[#1c1c1c]">
                  <td className="px-6 py-4 text-sm text-white">{d.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${dokTypBadge[d.typ] ?? "bg-zinc-700 text-zinc-400"}`}>{d.typ}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{new Date(d.createdAt as string).toLocaleDateString("de-DE")}</td>
                  <td className="px-6 py-4 text-right">
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-emerald-400">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
