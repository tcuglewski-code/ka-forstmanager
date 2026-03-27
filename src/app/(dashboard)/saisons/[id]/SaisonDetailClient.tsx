"use client"

// W3: Vollständige SaisonDetailClient mit 5 Tabs
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

// ─── Typ-Definitionen ─────────────────────────────────────────────────────────

interface Mitarbeiter {
  id: string
  vorname: string
  nachname: string
  rolle: string
  stundenlohn: number | null
}

interface Anmeldung {
  id: string
  status: string
  mitarbeiter: Mitarbeiter
}

interface GruppeMitglied {
  id: string
  mitarbeiter: { id: string; vorname: string; nachname: string }
}

interface Gruppe {
  id: string
  name: string
  mitglieder: GruppeMitglied[]
}

interface Protokoll {
  id: string
  datum: string | Date
  gepflanzt?: number | null
  witterung?: string | null
  bericht?: string | null
}

interface StundenEintrag {
  id: string
  mitarbeiterId: string
  stunden: number
  mitarbeiter: { vorname: string; nachname: string }
}

interface AuftragLog {
  id: string
  aktion: string
  von?: string | null
  nach?: string | null
  createdAt: string | Date
}

interface Auftrag {
  id: string
  titel: string
  typ: string
  status: string
  nummer?: string | null
  waldbesitzer?: string | null
  flaeche_ha?: number | null
  gruppe?: { name: string } | null
  protokolle: Protokoll[]
  stundeneintraege: StundenEintrag[]
  logs: AuftragLog[]
}

interface Dokument {
  id: string
  name: string
  typ: string
  url: string | null
  createdAt: string | Date
}

interface Lohnabrechnung {
  id: string
  mitarbeiterId: string
}

interface SaisonData {
  id: string
  status: string
  anmeldungen: Anmeldung[]
  gruppen: Gruppe[]
  auftraege: Auftrag[]
  dokumente: Dokument[]
  lohnabrechnungen: Lohnabrechnung[]
}

interface Props {
  saison: SaisonData
  saisonId: string
  gesamtPflanzen: number
  gesamtStunden: number
  gesamtFlaeche: number
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const auftragStatusBadge: Record<string, string> = {
  anfrage: "bg-blue-500/20 text-blue-400",
  geprueft: "bg-sky-500/20 text-sky-400",
  angebot: "bg-violet-500/20 text-violet-400",
  bestaetigt: "bg-amber-500/20 text-amber-400",
  in_ausfuehrung: "bg-emerald-500/20 text-emerald-400",
  abgeschlossen: "bg-zinc-500/20 text-zinc-400",
  storniert: "bg-red-500/20 text-red-400",
  laufend: "bg-emerald-500/20 text-emerald-400",
}

const auftragStatusLabel: Record<string, string> = {
  anfrage: "Anfrage",
  geprueft: "Geprüft",
  angebot: "Angebot",
  bestaetigt: "Bestätigt",
  in_ausfuehrung: "In Ausführung",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
  laufend: "Laufend",
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function SaisonDetailClient({
  saison,
  saisonId,
  gesamtPflanzen,
  gesamtStunden,
  gesamtFlaeche,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<
    "uebersicht" | "auftraege" | "mitarbeiter" | "statistiken" | "abschluss"
  >("uebersicht")

  // Anmeldungen lokal verwalten (für Status-Updates)
  const [anmeldungen, setAnmeldungen] = useState<Anmeldung[]>(
    saison.anmeldungen
  )
  const [anmeldungLoading, setAnmeldungLoading] = useState<string | null>(null)

  // Aufgeklappte Auftrags-Zeilen
  const [expandedAuftrag, setExpandedAuftrag] = useState<string | null>(null)

  // Manuelle Checklisten-Checks für Abschluss
  const [checkGeraete, setCheckGeraete] = useState(false)
  const [checkFahrzeuge, setCheckFahrzeuge] = useState(false)
  const [checkBericht, setCheckBericht] = useState(false)
  const [abschliessend, setAbschliessend] = useState(false)

  // ─── Auto-Checks für Abschluss ────────────────────────────────────────────

  // Alle Aufträge abgeschlossen oder storniert?
  const alleAuftraegeAbgeschlossen =
    saison.auftraege.length > 0 &&
    saison.auftraege.every(
      (a) => a.status === "abgeschlossen" || a.status === "storniert"
    )

  // Lohnabrechnungen vorhanden?
  const lohnAbrechnungenOK =
    saison.lohnabrechnungen.length >= saison.anmeldungen.length

  // Alle Checks OK?
  const alleChecksOK =
    alleAuftraegeAbgeschlossen &&
    lohnAbrechnungenOK &&
    checkGeraete &&
    checkFahrzeuge &&
    checkBericht

  // ─── Statistiken berechnen ────────────────────────────────────────────────

  // Pro-Gruppe-Statistiken
  const gruppenStats = saison.gruppen.map((g) => {
    const gruppenAuftraege = saison.auftraege.filter(
      (a) => a.gruppe?.name === g.name
    )
    const pflanzen = gruppenAuftraege.reduce(
      (sum, a) =>
        sum + a.protokolle.reduce((s2, p) => s2 + (p.gepflanzt ?? 0), 0),
      0
    )
    const stunden = gruppenAuftraege.reduce(
      (sum, a) =>
        sum + a.stundeneintraege.reduce((s2, s) => s2 + s.stunden, 0),
      0
    )
    return {
      name: g.name,
      auftraege: gruppenAuftraege.length,
      pflanzen,
      stunden,
      leistung: stunden > 0 ? pflanzen / stunden : 0,
    }
  })

  // Auftrags-Status-Verteilung
  const statusVerteilung = saison.auftraege.reduce<Record<string, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1
      return acc
    },
    {}
  )
  const statusFarben: Record<string, string> = {
    anfrage: "bg-blue-500",
    bestaetigt: "bg-amber-500",
    in_ausfuehrung: "bg-emerald-500",
    abgeschlossen: "bg-zinc-500",
    storniert: "bg-red-500",
  }

  // ─── Mitarbeiter-Stunden berechnen ───────────────────────────────────────

  const mitarbeiterStunden = anmeldungen.map((an) => {
    const stunden = saison.auftraege.reduce(
      (sum, a) =>
        sum +
        a.stundeneintraege
          .filter((s) => s.mitarbeiterId === an.mitarbeiter.id)
          .reduce((s2, s) => s2 + s.stunden, 0),
      0
    )
    const hatAbrechnung = saison.lohnabrechnungen.some(
      (la) => la.mitarbeiterId === an.mitarbeiter.id
    )
    return { ...an, stunden, hatAbrechnung }
  })

  // ─── Anmeldung aktualisieren ─────────────────────────────────────────────

  async function updateAnmeldung(anmeldungId: string, status: string) {
    setAnmeldungLoading(anmeldungId)
    await fetch(`/api/saisons/${saisonId}/anmeldungen/${anmeldungId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setAnmeldungen((prev) =>
      prev.map((a) => (a.id === anmeldungId ? { ...a, status } : a))
    )
    setAnmeldungLoading(null)
  }

  // ─── Saison abschließen ──────────────────────────────────────────────────

  async function handleAbschliessen() {
    if (!alleChecksOK) return
    setAbschliessend(true)
    try {
      const res = await fetch(`/api/saisons/${saisonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "abgeschlossen" }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Fehler beim Abschließen")
        return
      }
      toast.success("Saison erfolgreich abgeschlossen")
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
      toast.error("Fehler: " + msg)
    } finally {
      setAbschliessend(false)
    }
  }

  // ─── Tab-Definitionen ────────────────────────────────────────────────────

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "uebersicht", label: "Überblick" },
    { key: "auftraege", label: `Aufträge (${saison.auftraege.length})` },
    { key: "mitarbeiter", label: `Mitarbeiter (${anmeldungen.length})` },
    { key: "statistiken", label: "Statistiken" },
    ...(saison.status !== "abgeschlossen"
      ? [{ key: "abschluss" as const, label: "Abschluss" }]
      : []),
  ]

  return (
    <>
      {/* Tab-Leiste */}
      <div className="flex gap-1 mb-6 bg-[#161616] border border-[#2a2a2a] rounded-lg p-1 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? "bg-[#2C3A1C] text-emerald-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab 1: Überblick ─────────────────────────────────────────────── */}
      {tab === "uebersicht" && (
        <div className="space-y-6">
          {/* KPI-Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Aufträge", value: saison.auftraege.length, unit: "" },
              {
                label: "Fläche",
                value: gesamtFlaeche.toFixed(1),
                unit: " ha",
              },
              {
                label: "Pflanzen",
                value: gesamtPflanzen.toLocaleString("de-DE"),
                unit: "",
              },
              {
                label: "Stunden",
                value: gesamtStunden.toFixed(1),
                unit: " h",
              },
              {
                label: "Mitarbeiter",
                value: anmeldungen.length,
                unit: "",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold text-white">
                  {kpi.value}
                  <span className="text-sm text-zinc-400">{kpi.unit}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Auftrags-Status-Verteilung */}
          {saison.auftraege.length > 0 && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">
                Auftrags-Status-Verteilung
              </h3>
              <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-3">
                {Object.entries(statusVerteilung).map(([status, count]) => (
                  <div
                    key={status}
                    className={`${statusFarben[status] ?? "bg-zinc-600"} transition-all`}
                    style={{
                      width: `${(count / saison.auftraege.length) * 100}%`,
                    }}
                    title={`${auftragStatusLabel[status] ?? status}: ${count}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(statusVerteilung).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${statusFarben[status] ?? "bg-zinc-600"}`}
                    />
                    <span className="text-xs text-zinc-400">
                      {auftragStatusLabel[status] ?? status}: {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gruppen-Übersicht */}
          {saison.gruppen.length > 0 && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">
                Gruppen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {saison.gruppen.map((g) => (
                  <div
                    key={g.id}
                    className="bg-[#1e1e1e] rounded-lg p-3 border border-[#2a2a2a]"
                  >
                    <p className="font-medium text-white text-sm mb-1">
                      {g.name}
                    </p>
                    <p className="text-xs text-zinc-500 mb-2">
                      {g.mitglieder.length} Mitglieder
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {g.mitglieder.slice(0, 4).map((m) => (
                        <span
                          key={m.id}
                          className="text-xs bg-[#2a2a2a] text-zinc-400 px-2 py-0.5 rounded"
                        >
                          {m.mitarbeiter.vorname} {m.mitarbeiter.nachname}
                        </span>
                      ))}
                      {g.mitglieder.length > 4 && (
                        <span className="text-xs text-zinc-600">
                          +{g.mitglieder.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: Aufträge ─────────────────────────────────────────────── */}
      {tab === "auftraege" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="w-8 px-3 py-3" />
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Nr.</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Titel</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Waldbesitzer</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Gruppe</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500">Status</th>
                <th className="text-right px-4 py-3 text-xs text-zinc-500">Fläche</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {saison.auftraege.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-zinc-600"
                  >
                    Keine Aufträge in dieser Saison
                  </td>
                </tr>
              ) : (
                saison.auftraege.map((a) => (
                  <>
                    <tr
                      key={a.id}
                      className="hover:bg-[#1c1c1c] transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedAuftrag(
                          expandedAuftrag === a.id ? null : a.id
                        )
                      }
                    >
                      <td className="px-3 py-3 text-zinc-500">
                        {expandedAuftrag === a.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {a.nummer ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {a.titel}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {a.waldbesitzer ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {a.gruppe?.name ?? "–"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${auftragStatusBadge[a.status] ?? "bg-zinc-700 text-zinc-400"}`}
                        >
                          {auftragStatusLabel[a.status] ?? a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">
                        {a.flaeche_ha != null
                          ? `${a.flaeche_ha} ha`
                          : "–"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/auftraege/${a.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-zinc-600 hover:text-emerald-400 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>

                    {/* Aufgeklappte Details: Protokolle + Logs */}
                    {expandedAuftrag === a.id && (
                      <tr key={`${a.id}-detail`} className="bg-[#111111]">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Letzte 3 Protokolle */}
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-2">
                                Letzte Protokolle
                              </p>
                              {a.protokolle.length === 0 ? (
                                <p className="text-xs text-zinc-700">
                                  Keine Protokolle
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {a.protokolle.slice(0, 3).map((p) => (
                                    <div
                                      key={p.id}
                                      className="flex items-center gap-2 text-xs text-zinc-400"
                                    >
                                      <span className="text-zinc-600">
                                        {new Date(
                                          p.datum as string
                                        ).toLocaleDateString("de-DE")}
                                      </span>
                                      <span className="text-emerald-400">
                                        {p.gepflanzt != null
                                          ? `${p.gepflanzt.toLocaleString("de-DE")} Pflanzen`
                                          : "–"}
                                      </span>
                                      {p.witterung && (
                                        <span className="text-zinc-500">
                                          · {p.witterung}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Letzte 3 Logs */}
                            <div>
                              <p className="text-xs font-medium text-zinc-500 mb-2">
                                Letzte Aktivitäten
                              </p>
                              {a.logs.length === 0 ? (
                                <p className="text-xs text-zinc-700">
                                  Keine Aktivitäten
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {a.logs.slice(0, 3).map((log) => (
                                    <div
                                      key={log.id}
                                      className="flex items-center gap-2 text-xs text-zinc-400"
                                    >
                                      <span className="text-zinc-600">
                                        {new Date(
                                          log.createdAt as string
                                        ).toLocaleDateString("de-DE")}
                                      </span>
                                      <span>{log.aktion}</span>
                                      {log.von && log.nach && (
                                        <span className="text-zinc-600">
                                          {log.von} → {log.nach}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab 3: Mitarbeiter ──────────────────────────────────────────── */}
      {tab === "mitarbeiter" && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-3 text-xs text-zinc-500">Name</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500">Rolle</th>
                <th className="text-right px-6 py-3 text-xs text-zinc-500">Stundenlohn</th>
                <th className="text-right px-6 py-3 text-xs text-zinc-500">Stunden (Saison)</th>
                <th className="text-left px-6 py-3 text-xs text-zinc-500">Abrechnung</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {anmeldungen.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-zinc-600"
                  >
                    Keine Mitarbeiter angemeldet
                  </td>
                </tr>
              ) : (
                mitarbeiterStunden.map((ma) => (
                  <tr key={ma.id} className="hover:bg-[#1c1c1c]">
                    <td className="px-6 py-4 text-white">
                      {ma.mitarbeiter.vorname} {ma.mitarbeiter.nachname}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {ma.mitarbeiter.rolle}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400">
                      {ma.mitarbeiter.stundenlohn != null
                        ? `${ma.mitarbeiter.stundenlohn.toFixed(2)} €/h`
                        : "–"}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                      {ma.stunden.toFixed(1)} h
                    </td>
                    <td className="px-6 py-4">
                      {ma.hatAbrechnung ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <Check className="w-3 h-3" /> Abgerechnet
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-zinc-600">
                          <X className="w-3 h-3" /> Ausstehend
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ma.status === "angemeldet" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() =>
                              updateAnmeldung(ma.id, "bestaetigt")
                            }
                            disabled={anmeldungLoading === ma.id}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30 transition-colors"
                          >
                            <Check className="w-3 h-3" /> Bestätigen
                          </button>
                          <button
                            onClick={() =>
                              updateAnmeldung(ma.id, "abgelehnt")
                            }
                            disabled={anmeldungLoading === ma.id}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                          >
                            <X className="w-3 h-3" /> Ablehnen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab 4: Statistiken ──────────────────────────────────────────── */}
      {tab === "statistiken" && (
        <div className="space-y-6">
          {gesamtPflanzen === 0 && gesamtStunden === 0 ? (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Keine Protokolldaten vorhanden</p>
              <p className="text-zinc-600 text-sm mt-1">
                Sobald Tagesprotokolle erfasst werden, erscheinen hier die
                Auswertungen.
              </p>
            </div>
          ) : (
            <>
              {/* Gesamt-KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
                  <p className="text-xs text-zinc-500 mb-1">Ø Pflanzen / Stunde</p>
                  <p className="text-3xl font-bold text-white">
                    {gesamtStunden > 0
                      ? (gesamtPflanzen / gesamtStunden).toFixed(1)
                      : "–"}
                  </p>
                </div>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
                  <p className="text-xs text-zinc-500 mb-1">Pflanzen / Hektar</p>
                  <p className="text-3xl font-bold text-white">
                    {gesamtFlaeche > 0
                      ? Math.round(gesamtPflanzen / gesamtFlaeche).toLocaleString(
                          "de-DE"
                        )
                      : "–"}
                  </p>
                </div>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
                  <p className="text-xs text-zinc-500 mb-1">Pflanzen gesamt</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {gesamtPflanzen.toLocaleString("de-DE")}
                  </p>
                </div>
              </div>

              {/* Pro-Gruppe-Tabelle */}
              {gruppenStats.length > 0 && (
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#2a2a2a]">
                    <h3 className="text-sm font-medium text-zinc-300">
                      Gruppen-Vergleich
                    </h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left px-5 py-3 text-xs text-zinc-500">Gruppe</th>
                        <th className="text-right px-5 py-3 text-xs text-zinc-500">Aufträge</th>
                        <th className="text-right px-5 py-3 text-xs text-zinc-500">Pflanzen</th>
                        <th className="text-right px-5 py-3 text-xs text-zinc-500">Stunden</th>
                        <th className="text-right px-5 py-3 text-xs text-zinc-500">Ø Pfl./Std.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e1e]">
                      {gruppenStats.map((g) => (
                        <tr key={g.name} className="hover:bg-[#1c1c1c]">
                          <td className="px-5 py-3 text-white font-medium">
                            {g.name}
                          </td>
                          <td className="px-5 py-3 text-right text-zinc-400">
                            {g.auftraege}
                          </td>
                          <td className="px-5 py-3 text-right text-emerald-400">
                            {g.pflanzen.toLocaleString("de-DE")}
                          </td>
                          <td className="px-5 py-3 text-right text-zinc-400">
                            {g.stunden.toFixed(1)} h
                          </td>
                          <td className="px-5 py-3 text-right text-white font-medium">
                            {g.leistung > 0 ? g.leistung.toFixed(1) : "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Tab 5: Abschluss ────────────────────────────────────────────── */}
      {tab === "abschluss" && saison.status !== "abgeschlossen" && (
        <div className="space-y-6">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-5">
              Abschluss-Checkliste
            </h3>

            <div className="space-y-3">
              {/* Auto-Check: Alle Aufträge abgeschlossen */}
              <div
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alleAuftraegeAbgeschlossen
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <span className="text-lg leading-none mt-0.5">
                  {alleAuftraegeAbgeschlossen ? "✅" : "❌"}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    Alle Aufträge abgeschlossen
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {alleAuftraegeAbgeschlossen
                      ? `${saison.auftraege.length} Aufträge abgeschlossen / storniert`
                      : `Noch ${saison.auftraege.filter((a) => a.status !== "abgeschlossen" && a.status !== "storniert").length} Aufträge offen`}
                  </p>
                </div>
              </div>

              {/* Auto-Check: Lohnabrechnungen */}
              <div
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  lohnAbrechnungenOK
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : anmeldungen.length === 0
                      ? "bg-zinc-500/10 border border-zinc-500/20"
                      : "bg-amber-500/10 border border-amber-500/20"
                }`}
              >
                <span className="text-lg leading-none mt-0.5">
                  {lohnAbrechnungenOK
                    ? "✅"
                    : anmeldungen.length === 0
                      ? "⚠️"
                      : "❌"}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    Lohnabrechnungen erstellt
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {saison.lohnabrechnungen.length} von {anmeldungen.length}{" "}
                    Mitarbeitern abgerechnet
                  </p>
                </div>
              </div>

              {/* Manuell: Geräte zurückgegeben */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  checkGeraete
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-[#1e1e1e] border border-[#2a2a2a] hover:border-zinc-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkGeraete}
                  onChange={(e) => setCheckGeraete(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-600 accent-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    Alle Geräte zurückgegeben
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manuelle Bestätigung erforderlich
                  </p>
                </div>
              </label>

              {/* Manuell: Fahrzeuge eingecheckt */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  checkFahrzeuge
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-[#1e1e1e] border border-[#2a2a2a] hover:border-zinc-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkFahrzeuge}
                  onChange={(e) => setCheckFahrzeuge(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-600 accent-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    Alle Fahrzeuge eingecheckt
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manuelle Bestätigung erforderlich
                  </p>
                </div>
              </label>

              {/* Manuell: Abschlussbericht erstellt */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  checkBericht
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-[#1e1e1e] border border-[#2a2a2a] hover:border-zinc-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkBericht}
                  onChange={(e) => setCheckBericht(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-600 accent-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    Abschlussbericht erstellt
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manuelle Bestätigung erforderlich
                  </p>
                </div>
              </label>
            </div>

            {/* Abschluss-Button */}
            <div className="mt-6 pt-5 border-t border-[#2a2a2a]">
              {!alleChecksOK && (
                <p className="text-xs text-zinc-600 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Alle Checks müssen erfüllt sein, bevor die Saison abgeschlossen
                  werden kann.
                </p>
              )}
              <button
                onClick={handleAbschliessen}
                disabled={!alleChecksOK || abschliessend}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                {abschliessend ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saison wird abgeschlossen...
                  </>
                ) : (
                  "Saison abschließen"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
