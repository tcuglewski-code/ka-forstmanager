"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ExternalLink, Save, Phone, Mail, User, TreePine, MapPin, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface Saison {
  id: string
  name: string
}

interface Gruppe {
  id: string
  name: string
}

interface Auftrag {
  id: string
  titel: string
  typ: string
  status: string
  beschreibung?: string | null
  flaeche_ha?: number | null
  standort?: string | null
  bundesland?: string | null
  waldbesitzer?: string | null
  waldbesitzerEmail?: string | null
  waldbesitzerTelefon?: string | null
  baumarten?: string | null
  zeitraum?: string | null
  notizen?: string | null
  neuFlag?: boolean
  wpProjektId?: string | null
  saisonId?: string | null
  gruppeId?: string | null
  saison?: { id: string; name: string } | null
  gruppe?: { id: string; name: string } | null
  startDatum?: string | null
  endDatum?: string | null
  createdAt: string
  protokolle?: { id: string; datum: string; gepflanzt?: number | null; witterung?: string | null; ersteller?: string | null }[]
  abnahmen?: { id: string; datum: string; status: string; notizen?: string | null }[]
  rechnungen?: { id: string; nummer: string; betrag: number; status: string }[]
}

const STATUS_LIST = [
  { value: "anfrage", label: "Anfrage", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "angebot", label: "Angebot", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { value: "auftrag", label: "Auftrag", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "laufend", label: "Laufend", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "abgeschlossen", label: "Abgeschlossen", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
  { value: "geprueft", label: "Geprüft", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { value: "bestaetigt", label: "Bestätigt", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "in_ausfuehrung", label: "In Ausführung", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
]

const TYP_LABEL: Record<string, string> = {
  pflanzung: "Pflanzung",
  flaechenvorbereitung: "Flächenvorbereitung",
  flachenvorbereitung: "Flächenvorbereitung",
  foerderberatung: "Förderberatung",
  foerdermittelberatung: "Förderberatung",
  zaunbau: "Zaunbau",
  kulturschutz: "Kulturschutz",
  kulturpflege: "Kulturpflege",
  saatguternte: "Saatguternte",
  pflanzenbeschaffung: "Pflanzenbeschaffung",
  unbekannt: "Unbekannt",
}

const TYP_FARBEN: Record<string, string> = {
  pflanzung: "bg-emerald-500/20 text-emerald-400",
  flaechenvorbereitung: "bg-blue-500/20 text-blue-400",
  flachenvorbereitung: "bg-blue-500/20 text-blue-400",
  foerderberatung: "bg-purple-500/20 text-purple-400",
  foerdermittelberatung: "bg-purple-500/20 text-purple-400",
  zaunbau: "bg-orange-500/20 text-orange-400",
  kulturschutz: "bg-amber-500/20 text-amber-400",
  kulturpflege: "bg-yellow-500/20 text-yellow-400",
}

export default function AuftragDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [auftrag, setAuftrag] = useState<Auftrag | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
  const [status, setStatus] = useState("")
  const [notizen, setNotizen] = useState("")
  const [saisonId, setSaisonId] = useState<string>("")
  const [gruppeId, setGruppeId] = useState<string>("")

  // Lists for dropdowns
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])

  useEffect(() => {
    async function fetchData() {
      const [auftragRes, saionsRes, gruppenRes] = await Promise.all([
        fetch(`/api/auftraege/${id}`),
        fetch("/api/saisons"),
        fetch("/api/gruppen"),
      ])
      const a: Auftrag = await auftragRes.json()
      setAuftrag(a)
      setStatus(a.status)
      setNotizen(a.notizen ?? "")
      setSaisonId(a.saisonId ?? "")
      setGruppeId(a.gruppeId ?? "")
      setSaisons(saionsRes.ok ? await saionsRes.json() : [])
      setGruppen(gruppenRes.ok ? await gruppenRes.json() : [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/auftraege/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        notizen: notizen || null,
        saisonId: saisonId || null,
        gruppeId: gruppeId || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    // Reload auftrag
    const res = await fetch(`/api/auftraege/${id}`)
    setAuftrag(await res.json())
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
        <p className="text-zinc-600">Laden...</p>
      </div>
    )
  }

  if (!auftrag) {
    return (
      <div className="max-w-5xl mx-auto">
        <p className="text-zinc-500">Auftrag nicht gefunden.</p>
      </div>
    )
  }

  const statusObj = STATUS_LIST.find(s => s.value === status) ?? STATUS_LIST[0]
  const wpAdminUrl = auftrag.wpProjektId
    ? `https://peru-otter-113714.hostingersite.com/wp-admin/post.php?post=${auftrag.wpProjektId}&action=edit`
    : null

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/auftraege" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Aufträge
      </Link>

      {/* Header */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-xl font-bold text-white leading-tight">{auftrag.titel}</h1>
              {auftrag.neuFlag && (
                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold">NEU</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs ${TYP_FARBEN[auftrag.typ] ?? "bg-zinc-700/50 text-zinc-400"}`}>
                {TYP_LABEL[auftrag.typ] ?? auftrag.typ}
              </span>
            </div>
            <p className="text-zinc-500 text-xs">Erstellt: {new Date(auftrag.createdAt).toLocaleDateString("de-DE")}</p>
          </div>
          <div className="flex items-center gap-2">
            {wpAdminUrl && (
              <a
                href={wpAdminUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] text-zinc-400 hover:text-white rounded-lg text-xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                WP Admin
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Kontakt */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-500" />
              Waldbesitzer / Kontakt
            </h2>
            {auftrag.waldbesitzer || auftrag.waldbesitzerEmail || auftrag.waldbesitzerTelefon ? (
              <div className="space-y-3">
                {auftrag.waldbesitzer && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    <span className="text-white">{auftrag.waldbesitzer}</span>
                  </div>
                )}
                {auftrag.waldbesitzerEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    <a href={`mailto:${auftrag.waldbesitzerEmail}`} className="text-emerald-400 hover:underline">
                      {auftrag.waldbesitzerEmail}
                    </a>
                  </div>
                )}
                {auftrag.waldbesitzerTelefon && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    <a href={`tel:${auftrag.waldbesitzerTelefon}`} className="text-emerald-400 hover:underline">
                      {auftrag.waldbesitzerTelefon}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">Keine Kontaktdaten</p>
            )}
          </div>

          {/* Projektdetails */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TreePine className="w-4 h-4 text-zinc-500" />
              Projektdetails
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 block mb-1">Leistungsart</span>
                <span className="text-zinc-200">{TYP_LABEL[auftrag.typ] ?? auftrag.typ}</span>
              </div>
              {auftrag.flaeche_ha != null && (
                <div>
                  <span className="text-zinc-500 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Fläche
                  </span>
                  <span className="text-zinc-200">{auftrag.flaeche_ha} ha</span>
                </div>
              )}
              {auftrag.bundesland && (
                <div>
                  <span className="text-zinc-500 block mb-1">Bundesland</span>
                  <span className="text-zinc-200">{auftrag.bundesland}</span>
                </div>
              )}
              {auftrag.zeitraum && (
                <div>
                  <span className="text-zinc-500 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Zeitraum
                  </span>
                  <span className="text-zinc-200">{auftrag.zeitraum}</span>
                </div>
              )}
              {auftrag.standort && (
                <div>
                  <span className="text-zinc-500 block mb-1">Standort</span>
                  <span className="text-zinc-200">{auftrag.standort}</span>
                </div>
              )}
              {auftrag.startDatum && (
                <div>
                  <span className="text-zinc-500 block mb-1">Start</span>
                  <span className="text-zinc-200">{new Date(auftrag.startDatum).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              {auftrag.endDatum && (
                <div>
                  <span className="text-zinc-500 block mb-1">Ende</span>
                  <span className="text-zinc-200">{new Date(auftrag.endDatum).toLocaleDateString("de-DE")}</span>
                </div>
              )}
            </div>

            {auftrag.baumarten && (
              <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                <span className="text-zinc-500 text-sm block mb-2">Baumarten</span>
                <p className="text-zinc-200 text-sm leading-relaxed">{auftrag.baumarten}</p>
              </div>
            )}

            {auftrag.beschreibung && (
              <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                <span className="text-zinc-500 text-sm block mb-2">Bemerkung</span>
                <p className="text-zinc-200 text-sm leading-relaxed">{auftrag.beschreibung}</p>
              </div>
            )}
          </div>

          {/* Protokolle */}
          {auftrag.protokolle && auftrag.protokolle.length > 0 && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Tagesprotokolle ({auftrag.protokolle.length})</h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#2a2a2a]">
                  <th className="text-left py-2 text-xs text-zinc-500">Datum</th>
                  <th className="text-left py-2 text-xs text-zinc-500">Ersteller</th>
                  <th className="text-left py-2 text-xs text-zinc-500">Gepflanzt</th>
                  <th className="text-left py-2 text-xs text-zinc-500">Witterung</th>
                </tr></thead>
                <tbody>
                  {auftrag.protokolle.map(p => (
                    <tr key={p.id} className="border-b border-[#1e1e1e] last:border-0">
                      <td className="py-2 text-zinc-400">{new Date(p.datum).toLocaleDateString("de-DE")}</td>
                      <td className="py-2 text-zinc-400">{p.ersteller ?? "—"}</td>
                      <td className="py-2 text-emerald-400">{p.gepflanzt != null ? `${p.gepflanzt.toLocaleString()} Stk.` : "—"}</td>
                      <td className="py-2 text-zinc-400">{p.witterung ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#2a2a2a]">
                    <td colSpan={2} className="py-2 text-xs text-zinc-500 font-medium">Gesamt:</td>
                    <td className="py-2 text-sm font-bold text-emerald-400">
                      {auftrag.protokolle.reduce((s, p) => s + (p.gepflanzt ?? 0), 0).toLocaleString()} Stk.
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>

        {/* Right column: Actions */}
        <div className="space-y-6">

          {/* Status */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Status</h2>
            <div className="mb-3">
              <span className={`px-3 py-1.5 rounded-lg text-sm border ${statusObj.color}`}>
                {statusObj.label}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {STATUS_LIST.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    status === s.value
                      ? `${s.color} border`
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-[#222]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interne Felder */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Intern</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Saison</label>
                <select
                  value={saisonId}
                  onChange={e => setSaisonId(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Keine Saison</option>
                  {saisons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Gruppe</label>
                <select
                  value={gruppeId}
                  onChange={e => setGruppeId(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Keine Gruppe</option>
                  {gruppen.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Notizen
                </label>
                <textarea
                  value={notizen}
                  onChange={e => setNotizen(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Interne Notizen..."
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  saved
                    ? "bg-emerald-700 text-emerald-100"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                } disabled:opacity-50`}
              >
                <Save className="w-4 h-4" />
                {saving ? "Speichern..." : saved ? "Gespeichert ✓" : "Speichern"}
              </button>
            </div>
          </div>

          {/* WP Info */}
          {auftrag.wpProjektId && (
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-2">WordPress Post</p>
              <p className="text-xs font-mono text-zinc-400 mb-3">ID: {auftrag.wpProjektId}</p>
              {wpAdminUrl && (
                <a
                  href={wpAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Im WP-Admin öffnen
                </a>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Back button at bottom */}
      <div className="mt-6">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          ← Zurück
        </button>
      </div>
    </div>
  )
}
