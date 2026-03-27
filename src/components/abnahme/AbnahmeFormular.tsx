"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle, XCircle, AlertTriangle, Clock, MapPin, Plus, Trash2,
  User, Mail, Phone, FileText, Camera, ChevronDown, ChevronUp, Search
} from "lucide-react"
import { toast } from "sonner"

// ─── Typen ────────────────────────────────────────────────────────────────────

interface Mangel {
  beschreibung: string
  prioritaet: "hoch" | "mittel" | "niedrig"
  erledigtAm: string | null
}

interface Foerster {
  id: string
  name: string
  email?: string | null
  telefon?: string | null
  forstamt?: string | null
  revier?: string | null
}

interface Abnahme {
  id: string
  auftragId: string
  datum: string
  foersterId?: string | null
  foersterName?: string | null
  foersterEmail?: string | null
  foersterTelefon?: string | null
  status: string
  notizen?: string | null
  abnahmeProtokoll?: string | null
  haengelListe?: Mangel[] | null
  maengelFrist?: string | null
  gpsLat?: number | null
  gpsLon?: number | null
  fotos?: { url: string; nextcloudPath?: string; caption?: string }[] | null
  signaturUrl?: string | null
  rechnungFreigegeben?: boolean
}

interface AbnahmeFormularProps {
  auftragId: string
  abnahmeId?: string          // wenn vorhanden: bearbeiten, sonst: neu anlegen
  onSaved?: (abnahme: Abnahme) => void
  onCancel?: () => void
}

// ─── Status-Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    offen:      { label: "Offen",      classes: "bg-amber-500/20 text-amber-400 border-amber-500/30",    icon: <Clock className="w-3 h-3" /> },
    "bestätigt": { label: "Bestätigt", classes: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="w-3 h-3" /> },
    "mängel":   { label: "Mängel",     classes: "bg-red-500/20 text-red-400 border-red-500/30",           icon: <AlertTriangle className="w-3 h-3" /> },
    abgelehnt:  { label: "Abgelehnt",  classes: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",        icon: <XCircle className="w-3 h-3" /> },
  }
  const c = cfg[status] ?? cfg.offen
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${c.classes}`}>
      {c.icon}
      {c.label}
    </span>
  )
}

// ─── Prioritäts-Badge ─────────────────────────────────────────────────────────

function PrioBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    hoch:    "bg-red-500/20 text-red-400 border-red-500/30",
    mittel:  "bg-amber-500/20 text-amber-400 border-amber-500/30",
    niedrig: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${map[p] ?? map.niedrig}`}>{p}</span>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export function AbnahmeFormular({ auftragId, abnahmeId, onSaved, onCancel }: AbnahmeFormularProps) {
  const isNeu = !abnahmeId

  const [saving, setSaving] = useState(false)
  const [loadingGps, setLoadingGps] = useState(false)
  const [foersterSuche, setFoersterSuche] = useState("")
  const [foersterListe, setFoersterListe] = useState<Foerster[]>([])
  const [foersterDropdownOpen, setFoersterDropdownOpen] = useState(false)
  const [maengelExpanded, setMaengelExpanded] = useState(false)

  const [form, setForm] = useState<{
    datum: string
    foersterId: string
    foersterName: string
    foersterEmail: string
    foersterTelefon: string
    notizen: string
    abnahmeProtokoll: string
    maengel: Mangel[]
    maengelFrist: string
    gpsLat: number | null
    gpsLon: number | null
  }>({
    datum: new Date().toISOString().slice(0, 10),
    foersterId: "",
    foersterName: "",
    foersterEmail: "",
    foersterTelefon: "",
    notizen: "",
    abnahmeProtokoll: "",
    maengel: [],
    maengelFrist: "",
    gpsLat: null,
    gpsLon: null,
  })

  const [existingStatus, setExistingStatus] = useState<string>("offen")

  // ── Bestehendes Objekt laden ──────────────────────────────────────────────

  useEffect(() => {
    if (!abnahmeId) return
    fetch(`/api/abnahmen/${abnahmeId}`)
      .then(r => r.json())
      .then((a: Abnahme) => {
        setExistingStatus(a.status)
        setForm({
          datum: a.datum?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          foersterId: a.foersterId ?? "",
          foersterName: a.foersterName ?? "",
          foersterEmail: a.foersterEmail ?? "",
          foersterTelefon: a.foersterTelefon ?? "",
          notizen: a.notizen ?? "",
          abnahmeProtokoll: a.abnahmeProtokoll ?? "",
          maengel: (a.haengelListe as Mangel[]) ?? [],
          maengelFrist: a.maengelFrist?.slice(0, 10) ?? "",
          gpsLat: a.gpsLat ?? null,
          gpsLon: a.gpsLon ?? null,
        })
        if ((a.haengelListe as Mangel[])?.length) setMaengelExpanded(true)
      })
      .catch(() => toast.error("Abnahme konnte nicht geladen werden"))
  }, [abnahmeId])

  // ── Förster aus Kontakt-DB laden ──────────────────────────────────────────

  useEffect(() => {
    fetch("/api/kontakte?typ=foerster")
      .then(r => r.json())
      .then((data: Foerster[]) => setFoersterListe(Array.isArray(data) ? data : []))
      .catch(() => { /* Stille Fehler – Freitext ist immer möglich */ })
  }, [])

  const gefilterteFoerster = foersterListe.filter(f =>
    f.name.toLowerCase().includes(foersterSuche.toLowerCase()) ||
    (f.forstamt ?? "").toLowerCase().includes(foersterSuche.toLowerCase())
  )

  function foersterAuswaehlen(f: Foerster) {
    setForm(prev => ({
      ...prev,
      foersterId: f.id,
      foersterName: f.name,
      foersterEmail: f.email ?? "",
      foersterTelefon: f.telefon ?? "",
    }))
    setFoersterSuche(f.name)
    setFoersterDropdownOpen(false)
  }

  // ── GPS erfassen ──────────────────────────────────────────────────────────

  function gpsErfassen() {
    if (!navigator.geolocation) { toast.error("GPS nicht verfügbar"); return }
    setLoadingGps(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({ ...prev, gpsLat: pos.coords.latitude, gpsLon: pos.coords.longitude }))
        setLoadingGps(false)
        toast.success("GPS-Position gesetzt")
      },
      () => { toast.error("GPS-Zugriff verweigert"); setLoadingGps(false) },
      { timeout: 10000 }
    )
  }

  // ── Mängel-Verwaltung ─────────────────────────────────────────────────────

  function mangelHinzufuegen() {
    setForm(prev => ({
      ...prev,
      maengel: [...prev.maengel, { beschreibung: "", prioritaet: "mittel", erledigtAm: null }],
    }))
    setMaengelExpanded(true)
  }

  function mangelEntfernen(idx: number) {
    setForm(prev => ({ ...prev, maengel: prev.maengel.filter((_, i) => i !== idx) }))
  }

  function mangelAendern(idx: number, field: keyof Mangel, value: string | null) {
    setForm(prev => {
      const updated = [...prev.maengel]
      updated[idx] = { ...updated[idx], [field]: value }
      return { ...prev, maengel: updated }
    })
  }

  // ── Speichern ─────────────────────────────────────────────────────────────

  async function speichern(zielStatus?: string) {
    setSaving(true)
    const payload = {
      auftragId,
      datum: new Date(form.datum).toISOString(),
      foersterId: form.foersterId || null,
      foersterName: form.foersterName || null,
      foersterEmail: form.foersterEmail || null,
      foersterTelefon: form.foersterTelefon || null,
      status: zielStatus ?? (isNeu ? "offen" : existingStatus),
      notizen: form.notizen || null,
      abnahmeProtokoll: form.abnahmeProtokoll || null,
      haengelListe: form.maengel.length ? form.maengel : null,
      maengelFrist: form.maengelFrist ? new Date(form.maengelFrist).toISOString() : null,
      gpsLat: form.gpsLat,
      gpsLon: form.gpsLon,
    }

    try {
      let res: Response
      if (isNeu) {
        res = await fetch("/api/abnahmen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/abnahmen/${abnahmeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) throw new Error("Speichern fehlgeschlagen")
      const abnahme = await res.json()
      toast.success(isNeu ? "Abnahme angelegt" : "Abnahme gespeichert")
      onSaved?.(abnahme)
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  async function schnellBestaetigen() {
    if (!abnahmeId) { await speichern("bestätigt"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/abnahmen/${abnahmeId}/bestaetigen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notizen: form.notizen || null }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success("Abnahme bestätigt — Rechnung freigegeben ✓")
      onSaved?.(data.abnahme)
    } catch {
      toast.error("Fehler beim Bestätigen")
    } finally {
      setSaving(false)
    }
  }

  async function maengelMelden() {
    if (form.maengel.length === 0) { toast.error("Bitte mindestens einen Mangel hinzufügen"); return }
    if (!abnahmeId) { await speichern("mängel"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/abnahmen/${abnahmeId}/maengel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maengel: form.maengel, frist: form.maengelFrist || null }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      toast.success("Mängel gemeldet")
      onSaved?.(updated)
    } catch {
      toast.error("Fehler beim Melden der Mängel")
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Status-Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
          {isNeu ? "Neue Abnahme" : "Abnahme bearbeiten"}
        </h3>
        <StatusBadge status={existingStatus} />
      </div>

      {/* Abnahme-Datum + GPS */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Abnahme-Datum</label>
          <input
            type="date"
            value={form.datum}
            onChange={e => setForm(p => ({ ...p, datum: e.target.value }))}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">GPS-Position</label>
          <button
            type="button"
            onClick={gpsErfassen}
            disabled={loadingGps}
            className={`w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all ${
              form.gpsLat
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : "bg-[#0f0f0f] border-[#2a2a2a] text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {loadingGps ? "Ermittle..." : form.gpsLat ? `${form.gpsLat.toFixed(5)}, ${form.gpsLon?.toFixed(5)}` : "GPS erfassen"}
          </button>
        </div>
      </div>

      {/* Förster Autocomplete */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block flex items-center gap-1">
          <User className="w-3 h-3" /> Förster
        </label>
        <div className="relative">
          <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2">
            <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Förster suchen oder Name eingeben..."
              value={foersterSuche || form.foersterName}
              onChange={e => {
                setFoersterSuche(e.target.value)
                setForm(p => ({ ...p, foersterName: e.target.value, foersterId: "" }))
                setFoersterDropdownOpen(true)
              }}
              onFocus={() => setFoersterDropdownOpen(true)}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
            />
          </div>
          {foersterDropdownOpen && gefilterteFoerster.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {gefilterteFoerster.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => foersterAuswaehlen(f)}
                  className="w-full text-left px-3 py-2 hover:bg-[#222] transition-colors"
                >
                  <p className="text-sm text-white">{f.name}</p>
                  <p className="text-xs text-zinc-500">
                    {[f.forstamt, f.revier].filter(Boolean).join(" · ")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Förster-Details */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2">
            <Mail className="w-3 h-3 text-zinc-500 flex-shrink-0" />
            <input
              type="email"
              placeholder="E-Mail"
              value={form.foersterEmail}
              onChange={e => setForm(p => ({ ...p, foersterEmail: e.target.value }))}
              className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2">
            <Phone className="w-3 h-3 text-zinc-500 flex-shrink-0" />
            <input
              type="tel"
              placeholder="Telefon"
              value={form.foersterTelefon}
              onChange={e => setForm(p => ({ ...p, foersterTelefon: e.target.value }))}
              className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Abnahme-Protokoll */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block flex items-center gap-1">
          <FileText className="w-3 h-3" /> Abnahme-Protokoll
        </label>
        <textarea
          rows={4}
          placeholder="Detailliertes Abnahmeprotokoll..."
          value={form.abnahmeProtokoll}
          onChange={e => setForm(p => ({ ...p, abnahmeProtokoll: e.target.value }))}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none"
        />
      </div>

      {/* Notizen */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Notizen</label>
        <textarea
          rows={2}
          placeholder="Kurze Notizen zur Abnahme..."
          value={form.notizen}
          onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none"
        />
      </div>

      {/* Mängel-Liste */}
      <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMaengelExpanded(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#0f0f0f] hover:bg-[#141414] transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm text-white font-medium">
              Mängelliste
              {form.maengel.length > 0 && (
                <span className="ml-2 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                  {form.maengel.length}
                </span>
              )}
            </span>
          </div>
          {maengelExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {maengelExpanded && (
          <div className="p-4 space-y-3 bg-[#0a0a0a]">
            {form.maengel.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-2">Keine Mängel eingetragen</p>
            )}
            {form.maengel.map((m, idx) => (
              <div key={idx} className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    placeholder="Mangel beschreiben..."
                    value={m.beschreibung}
                    onChange={e => mangelAendern(idx, "beschreibung", e.target.value)}
                    className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-white placeholder-zinc-600 outline-none"
                  />
                  <button type="button" onClick={() => mangelEntfernen(idx)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.prioritaet}
                    onChange={e => mangelAendern(idx, "prioritaet", e.target.value)}
                    className="bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="hoch">Hoch</option>
                    <option value="mittel">Mittel</option>
                    <option value="niedrig">Niedrig</option>
                  </select>
                  <PrioBadge p={m.prioritaet} />
                  <input
                    type="date"
                    value={m.erledigtAm ?? ""}
                    onChange={e => mangelAendern(idx, "erledigtAm", e.target.value || null)}
                    className="ml-auto bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white outline-none"
                    title="Erledigt am"
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={mangelHinzufuegen}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-[#2a2a2a] hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus className="w-3 h-3" /> Mangel hinzufügen
              </button>
              {form.maengel.length > 0 && (
                <div className="ml-auto">
                  <label className="text-xs text-zinc-500 mr-2">Frist:</label>
                  <input
                    type="date"
                    value={form.maengelFrist}
                    onChange={e => setForm(p => ({ ...p, maengelFrist: e.target.value }))}
                    className="bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Foto-Upload-Hinweis */}
      <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Camera className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          Fotos können über <strong>Nextcloud</strong> hochgeladen und dann hier verknüpft werden.
          Pfad: <code className="text-blue-200">/Koch-Aufforstung/Projekte/</code>
        </p>
      </div>

      {/* Action-Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={maengelMelden}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 hover:bg-amber-500/30 transition-all disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Mängel melden
        </button>

        <button
          type="button"
          onClick={() => speichern("abgelehnt")}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-zinc-500/20 border border-zinc-500/40 rounded-lg text-zinc-400 hover:bg-zinc-500/30 transition-all disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Ablehnen
        </button>

        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={saving} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2">
              Abbrechen
            </button>
          )}
          <button
            type="button"
            onClick={() => speichern()}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-zinc-700/50 border border-zinc-600/40 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-50"
          >
            Entwurf speichern
          </button>
          <div className="flex flex-col items-end">
            <button
              type="button"
              onClick={schnellBestaetigen}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 hover:bg-emerald-500/30 font-medium transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Bestätigen ✓
            </button>
            <p className="text-[10px] text-zinc-600 mt-1">Rechnung wird automatisch zur Zahlung freigegeben</p>
          </div>
        </div>
      </div>
    </div>
  )
}
