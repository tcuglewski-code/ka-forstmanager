"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Plus, FileText, ExternalLink, Euro, Calendar, User } from "lucide-react"
import Link from "next/link"
import { Breadcrumb } from "@/components/layout/Breadcrumb"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Angebot {
  id: string
  nummer: string | null
  waldbesitzerName: string | null
  waldbesitzerEmail: string | null
  flaeche_ha: number | null
  baumanzahl: number | null
  preisProBaum: number | null
  stundenSchaetzung: number | null
  gesamtpreis: number | null
  beschreibung: string | null
  status: string
  gueltigBis: string | null
  notizen: string | null
  createdAt: string
  auftragId: string | null
  auftrag?: { id: string; titel: string; status: string } | null
}

interface AngebotForm {
  waldbesitzerName: string
  waldbesitzerEmail: string
  kalkulationTyp: "flaeche" | "baumanzahl" | "stunden"
  flaeche_ha: string
  baumanzahl: string
  preisProBaum: string
  stundenSchaetzung: string
  beschreibung: string
  gueltigBis: string
  notizen: string
}

// ─── Hilfsfunktionen ───────────────────────────────────────────────────────────

function kalkulierePreis(form: AngebotForm, config: Record<string, string>): number {
  if (form.kalkulationTyp === "baumanzahl" && form.baumanzahl && form.preisProBaum) {
    return parseFloat(form.baumanzahl) * parseFloat(form.preisProBaum)
  }
  if (form.kalkulationTyp === "flaeche" && form.flaeche_ha) {
    return parseFloat(form.flaeche_ha) * parseFloat(config.preis_pro_ha ?? "1800")
  }
  if (form.kalkulationTyp === "stunden" && form.stundenSchaetzung) {
    return parseFloat(form.stundenSchaetzung) * parseFloat(config.vollkosten_pro_stunde ?? "43.50")
  }
  return 0
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
  entwurf: { label: "Entwurf", farbe: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
  versendet: { label: "Versendet", farbe: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  angenommen: { label: "Angenommen", farbe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  abgelehnt: { label: "Abgelehnt", farbe: "bg-red-500/20 text-red-400 border-red-500/30" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, farbe: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.farbe}`}>
      {cfg.label}
    </span>
  )
}

// ─── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function AngebotePage() {
  const [angebote, setAngebote] = useState<Angebot[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOffen, setModalOffen] = useState(false)
  const [speichern, setSpeichern] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [filterStatus, setFilterStatus] = useState<string>("")

  const [form, setForm] = useState<AngebotForm>({
    waldbesitzerName: "",
    waldbesitzerEmail: "",
    kalkulationTyp: "flaeche",
    flaeche_ha: "",
    baumanzahl: "",
    preisProBaum: "",
    stundenSchaetzung: "",
    beschreibung: "",
    gueltigBis: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notizen: "",
  })

  const ladeDaten = useCallback(async () => {
    setLoading(true)
    try {
      const url = filterStatus ? `/api/angebote?status=${filterStatus}` : "/api/angebote"
      const res = await fetch(url)
      if (res.ok) setAngebote(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    ladeDaten()
    // System-Config laden für Kalkulation
    fetch("/api/einstellungen")
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === "object") setConfig(d)
      })
      .catch(() => {})
  }, [ladeDaten])

  const berechneterPreis = kalkulierePreis(form, config)

  async function angebotErstellen(e: React.FormEvent) {
    e.preventDefault()
    setSpeichern(true)
    try {
      const payload: Record<string, unknown> = {
        waldbesitzerName: form.waldbesitzerName || null,
        waldbesitzerEmail: form.waldbesitzerEmail || null,
        beschreibung: form.beschreibung || null,
        gueltigBis: form.gueltigBis || null,
        notizen: form.notizen || null,
      }
      if (form.kalkulationTyp === "flaeche") {
        payload.flaeche_ha = form.flaeche_ha || null
      } else if (form.kalkulationTyp === "baumanzahl") {
        payload.baumanzahl = form.baumanzahl || null
        payload.preisProBaum = form.preisProBaum || null
      } else if (form.kalkulationTyp === "stunden") {
        payload.stundenSchaetzung = form.stundenSchaetzung || null
      }

      const res = await fetch("/api/angebote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Angebot ${data.nummer} erstellt`)
        setModalOffen(false)
        setForm({
          waldbesitzerName: "",
          waldbesitzerEmail: "",
          kalkulationTyp: "flaeche",
          flaeche_ha: "",
          baumanzahl: "",
          preisProBaum: "",
          stundenSchaetzung: "",
          beschreibung: "",
          gueltigBis: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notizen: "",
        })
        ladeDaten()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Fehler beim Erstellen")
      }
    } finally {
      setSpeichern(false)
    }
  }

  async function statusAendern(id: string, status: string) {
    const res = await fetch(`/api/angebote/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success("Status aktualisiert")
      ladeDaten()
    } else {
      toast.error("Fehler beim Aktualisieren")
    }
  }

  async function zuAuftragKonvertieren(id: string) {
    const res = await fetch(`/api/angebote/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion: "zu_auftrag" }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(`Auftrag ${data.auftrag?.nummer ?? ""} erstellt`)
      ladeDaten()
    } else {
      const err = await res.json()
      toast.error(err.error ?? "Fehler beim Konvertieren")
    }
  }

  const f = (field: keyof AngebotForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Angebote" }]} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Angebote
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Anfragen zu Angeboten weiterverarbeiten</p>
        </div>
        <button
          onClick={() => setModalOffen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neues Angebot
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: "", label: "Alle" },
          { value: "entwurf", label: "Entwurf" },
          { value: "versendet", label: "Versendet" },
          { value: "angenommen", label: "Angenommen" },
          { value: "abgelehnt", label: "Abgelehnt" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filterStatus === f.value
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-[#1e1e1e] text-zinc-400 border-[#2a2a2a] hover:border-zinc-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabelle */}
      {loading ? (
        <div className="text-zinc-500 text-sm py-8 text-center">Lade Angebote…</div>
      ) : angebote.length === 0 ? (
        <div className="text-zinc-500 text-sm py-16 text-center bg-[#161616] rounded-xl border border-[#2a2a2a]">
          Noch keine Angebote vorhanden.
        </div>
      ) : (
        <div className="space-y-3">
          {angebote.map((a) => (
            <div
              key={a.id}
              className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Links: Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{a.nummer ?? "–"}</span>
                    <StatusBadge status={a.status} />
                    {a.auftrag && (
                      <Link
                        href={`/auftraege/${a.auftrag.id}`}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {a.auftrag.titel}
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-400">
                    {a.waldbesitzerName && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <span className="truncate">{a.waldbesitzerName}</span>
                      </div>
                    )}
                    {a.gesamtpreis != null && (
                      <div className="flex items-center gap-1.5">
                        <Euro className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <span className="text-emerald-400 font-medium">{formatEuro(a.gesamtpreis)}</span>
                      </div>
                    )}
                    {a.gueltigBis && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <span>Gültig bis {formatDatum(a.gueltigBis)}</span>
                      </div>
                    )}
                    {a.flaeche_ha && (
                      <div className="text-zinc-400">
                        {a.flaeche_ha} ha
                      </div>
                    )}
                  </div>

                  {a.beschreibung && (
                    <p className="text-zinc-500 text-xs mt-2 line-clamp-2">{a.beschreibung}</p>
                  )}
                </div>

                {/* Rechts: Aktions-Buttons */}
                <div className="flex flex-wrap gap-2 items-start">
                  {a.status === "entwurf" && (
                    <button
                      onClick={() => statusAendern(a.id, "versendet")}
                      className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-colors"
                    >
                      📤 Versendet markieren
                    </button>
                  )}

                  {(a.status === "entwurf" || a.status === "versendet") && !a.auftragId && (
                    <>
                      <button
                        onClick={() => zuAuftragKonvertieren(a.id)}
                        className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors"
                      >
                        ✅ Angenommen → Auftrag erstellen
                      </button>
                      <button
                        onClick={() => statusAendern(a.id, "abgelehnt")}
                        className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                      >
                        ❌ Abgelehnt
                      </button>
                    </>
                  )}

                  {a.status === "angenommen" && a.auftrag && (
                    <Link
                      href={`/auftraege/${a.auftrag.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Zum Auftrag
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal: Neues Angebot ──────────────────────────────────────────────── */}
      {modalOffen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Neues Angebot erstellen</h2>
              <button
                onClick={() => setModalOffen(false)}
                className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={angebotErstellen} className="p-6 space-y-5">
              {/* Waldbesitzer */}
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Waldbesitzer</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.waldbesitzerName}
                      onChange={f("waldbesitzerName")}
                      placeholder="Max Mustermann"
                      className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">E-Mail</label>
                    <input
                      type="email"
                      value={form.waldbesitzerEmail}
                      onChange={f("waldbesitzerEmail")}
                      placeholder="max@beispiel.de"
                      className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Kalkulations-Typ */}
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Kalkulation</p>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {[
                    { value: "flaeche", label: "🌳 Fläche (ha)" },
                    { value: "baumanzahl", label: "🌱 Baumanzahl" },
                    { value: "stunden", label: "⏱ Stunden" },
                  ].map((typ) => (
                    <button
                      key={typ.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, kalkulationTyp: typ.value as AngebotForm["kalkulationTyp"] }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.kalkulationTyp === typ.value
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-[#1e1e1e] text-zinc-400 border-[#2a2a2a] hover:border-zinc-500"
                      }`}
                    >
                      {typ.label}
                    </button>
                  ))}
                </div>

                {form.kalkulationTyp === "flaeche" && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Fläche in ha</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.flaeche_ha}
                      onChange={f("flaeche_ha")}
                      placeholder="z.B. 2.5"
                      className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    <p className="text-xs text-zinc-600 mt-1">
                      Preis/ha: {parseFloat(config.preis_pro_ha ?? "1800").toLocaleString("de-DE")} €
                    </p>
                  </div>
                )}

                {form.kalkulationTyp === "baumanzahl" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Baumanzahl</label>
                      <input
                        type="number"
                        min="0"
                        value={form.baumanzahl}
                        onChange={f("baumanzahl")}
                        placeholder="z.B. 500"
                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Preis pro Baum (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.preisProBaum}
                        onChange={f("preisProBaum")}
                        placeholder="z.B. 3.50"
                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                )}

                {form.kalkulationTyp === "stunden" && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Geschätzte Stunden</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={form.stundenSchaetzung}
                      onChange={f("stundenSchaetzung")}
                      placeholder="z.B. 40"
                      className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    <p className="text-xs text-zinc-600 mt-1">
                      Vollkosten/h: {parseFloat(config.vollkosten_pro_stunde ?? "43.50").toLocaleString("de-DE")} €
                    </p>
                  </div>
                )}

                {/* Live-Kalkulation */}
                {berechneterPreis > 0 && (
                  <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                    <p className="text-xs text-emerald-400/70 mb-0.5">Kalkulierter Gesamtpreis</p>
                    <p className="text-emerald-400 text-xl font-bold">{formatEuro(berechneterPreis)}</p>
                  </div>
                )}
              </div>

              {/* Beschreibung & Gültig bis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Gültig bis</label>
                  <input
                    type="date"
                    value={form.gueltigBis}
                    onChange={f("gueltigBis")}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Beschreibung / Leistungsumfang</label>
                <textarea
                  value={form.beschreibung}
                  onChange={f("beschreibung")}
                  rows={3}
                  placeholder="Beschreibung der geplanten Leistungen…"
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Interne Notizen</label>
                <textarea
                  value={form.notizen}
                  onChange={f("notizen")}
                  rows={2}
                  placeholder="Interne Anmerkungen…"
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOffen(false)}
                  className="flex-1 px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] text-zinc-400 rounded-lg text-sm hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={speichern}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {speichern ? "Wird erstellt…" : "Angebot erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
