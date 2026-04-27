'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSmartItemsForDienstleistung, DIENSTLEISTUNG_LABELS, type SmartItem } from '@/lib/smart-items'

// ──────────────────────────────────────────────────────────────────────────────
// Typen
// ──────────────────────────────────────────────────────────────────────────────

interface Props {
  auftragId: string
  auftragTitel?: string
  waldbesitzer?: string
  gruppeId?: string
  onSaved?: () => void
  // FIX 1: Vorausfüllen aus Auftrag
  defaultFoerstamt?: string
  defaultRevier?: string
  defaultAbteilung?: string
  defaultRevierleiter?: string
  defaultGpsLat?: number
  defaultGpsLon?: number
  // FIX 5: Rollenabhängiges Gruppenführer-Feld
  userRole?: string
  userName?: string
  // Edit mode
  editId?: string
  initialData?: Record<string, unknown>
}

interface TeamMitglied {
  mitarbeiterId: string
  name: string
  stunden: string
  krank: boolean
  maschine: string
  maschinenstunden: string
}

interface GruppeMitgliedAPI {
  mitarbeiterId: string
  mitarbeiter: {
    id: string
    vorname: string
    nachname: string
  }
}

interface GruppenfuehrerOption {
  id: string
  vorname: string
  nachname: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Hauptkomponente
// ──────────────────────────────────────────────────────────────────────────────

export default function TagesprotokollFormular({
  auftragId,
  auftragTitel,
  waldbesitzer,
  gruppeId,
  onSaved,
  defaultFoerstamt = '',
  defaultRevier = '',
  defaultAbteilung = '',
  defaultRevierleiter = '',
  defaultGpsLat,
  defaultGpsLon,
  userRole = 'mitarbeiter',
  userName = '',
  editId,
  initialData,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // FIX 4: GPS-State
  const [gpsStatus, setGpsStatus] = useState<'leer' | 'laden' | 'ermittelt'>(
    defaultGpsLat != null && defaultGpsLon != null ? 'ermittelt' : 'leer'
  )
  const [gpsError, setGpsError] = useState('')

  // FIX 5: Gruppenführer-Dropdown für Admins
  const [gruppenfuehrerListe, setGruppenfuehrerListe] = useState<GruppenfuehrerOption[]>([])
  const isAdmin = userRole === 'admin' || userRole === 'ka_admin'

  // AUF-4: Gruppen-Dropdown (echte Daten statt hardcoded)
  const [gruppenListe, setGruppenListe] = useState<{ id: string; name: string }[]>([])

  // F-3: Protokoll-Items (Dienstleistungs-Verknüpfung)
  const [protokollItems, setProtokollItems] = useState<Array<{dienstleistung: string; flaeche: string; anzahlPflanzen: string; stunden: string; bemerkung: string}>>([])

  // FIX 6: Team-Mitglieder
  const [team, setTeam] = useState<TeamMitglied[]>([])
  const [globalStunden, setGlobalStunden] = useState('')

  // ──────────────────────────────────────────────────────────────────────────
  // Formular-State (FIX 1: initial values aus Auftrag)
  // ──────────────────────────────────────────────────────────────────────────
  // Helper to prefill from initialData (edit mode)
  const d = initialData ?? {}
  const s = (key: string, fallback: string) => d[key] != null ? String(d[key]) : fallback
  const sDate = (key: string) => {
    if (!d[key]) return ''
    try { return new Date(d[key] as string).toISOString().split('T')[0] } catch { return '' }
  }
  const sDateTime = (key: string) => {
    if (!d[key]) return ''
    try {
      const dt = new Date(d[key] as string)
      return dt.toISOString().slice(0, 16)
    } catch { return '' }
  }

  const [form, setForm] = useState({
    datum: editId ? sDate('datum') || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    ersteller: editId ? s('ersteller', '') : (isAdmin ? '' : userName),
    // Revier & Gruppe
    forstamt: s('forstamt', defaultFoerstamt),
    revier: s('revier', defaultRevier),
    revierleiter: s('revierleiter', defaultRevierleiter),
    abteilung: s('abteilung', defaultAbteilung),
    waldbesitzerName: s('waldbesitzerName', waldbesitzer || ''),
    gruppe: '',
    // Arbeitszeit (FM-06: type="time" mit Defaults)
    arbeitsBeginn: editId ? (d.arbeitsBeginn as string || sDateTime('zeitBeginn')?.slice(11, 16) || '07:00') : '07:00',
    arbeitsEnde: editId ? (d.arbeitsEnde as string || sDateTime('zeitEnde')?.slice(11, 16) || '17:00') : '17:00',
    pausezeit: s('pausezeit', '60'),
    // Pflanzung Hand
    std_einschlag: s('std_einschlag', ''), std_handpflanzung: s('std_handpflanzung', ''), stk_pflanzung: s('stk_pflanzung', ''),
    // Pflanzung Bohrer
    std_zum_bohrer: s('std_zum_bohrer', ''), std_mit_bohrer: s('std_mit_bohrer', ''), stk_pflanzung_mit_bohrer: s('stk_pflanzung_mit_bohrer', ''),
    // Freischneider/Motorsäge
    std_freischneider: s('std_freischneider', ''), std_motorsaege: s('std_motorsaege', ''),
    // Pflanzenschutz
    std_wuchshuellen: s('std_wuchshuellen', ''), stk_wuchshuellen: s('stk_wuchshuellen', ''), std_netze_staebe_spiralen: s('std_netze_staebe_spiralen', ''), stk_netze_staebe_spiralen: s('stk_netze_staebe_spiralen', ''),
    // Zaunbau
    std_zaunbau: s('std_zaunbau', ''), stk_drahtverbinder: s('stk_drahtverbinder', ''), lfm_zaunbau: s('lfm_zaunbau', ''),
    // Nachbesserung
    std_nachbesserung: s('std_nachbesserung', ''), stk_nachbesserung: s('stk_nachbesserung', ''), std_sonstige_arbeiten: s('std_sonstige_arbeiten', ''),
    // Witterung
    witterung: s('witterung', 'sonnig'),
    // GPS (FIX 1: Vorausfüllen)
    gpsStartLat: s('gpsStartLat', defaultGpsLat?.toFixed(7) ?? ''),
    gpsStartLon: s('gpsStartLon', defaultGpsLon?.toFixed(7) ?? ''),
    // Kommentar
    kommentar: s('kommentar', ''),
    bericht: s('bericht', ''),
  })

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 5: Gruppenführer-Liste laden (nur für Admins)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/mitarbeiter?rolle=gruppenführer')
      .then(r => r.json())
      .then((data: GruppenfuehrerOption[] | { items: GruppenfuehrerOption[] }) => setGruppenfuehrerListe(Array.isArray(data) ? data : (data.items ?? [])))
      .catch((err) => { console.error("Gruppenführer Ladefehler:", err) })
  }, [isAdmin])

  // AUF-4: Gruppen laden
  useEffect(() => {
    fetch('/api/gruppen')
      .then(r => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : (data.items ?? [])
        setGruppenListe(items)
      })
      .catch((err) => { console.error("Gruppen Ladefehler:", err) })
  }, [])

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 6: Gruppenmitglieder laden
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gruppeId) return
    fetch(`/api/gruppen/${gruppeId}/mitglieder`)
      .then(r => r.json())
      .then((data: GruppeMitgliedAPI[]) => {
        setTeam(
          data.map(m => ({
            mitarbeiterId: m.mitarbeiterId,
            name: `${m.mitarbeiter.vorname} ${m.mitarbeiter.nachname}`,
            stunden: '',
            krank: false,
            maschine: '',
            maschinenstunden: '',
          }))
        )
      })
      .catch((err) => { console.error("Gruppenmitglieder Ladefehler:", err) })
  }, [gruppeId])

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 2: Arbeitszeit — max. 10h + gesetzliche Pause (ArbZG §4)
  // ──────────────────────────────────────────────────────────────────────────
  // FM-06: Nettoarbeitszeit berechnen aus time-Inputs
  const berechneNettoStunden = (beginn: string, ende: string, pause: string): number => {
    if (!beginn || !ende) return 0
    const [bH, bM] = beginn.split(':').map(Number)
    const [eH, eM] = ende.split(':').map(Number)
    const startMin = bH * 60 + bM
    let endMin = eH * 60 + eM
    // FM-06: Mitternacht-Edge-Case — wenn Ende < Beginn, über Tagesgrenze rechnen
    if (endMin <= startMin) endMin += 24 * 60
    const nettoMin = (endMin - startMin) - (parseInt(pause) || 0)
    return Math.max(0, nettoMin / 60)
  }

  const handleZeitChange = (field: 'arbeitsBeginn' | 'arbeitsEnde', value: string) => {
    setForm(f => {
      const updated = { ...f, [field]: value }
      const b = field === 'arbeitsBeginn' ? value : f.arbeitsBeginn
      const e = field === 'arbeitsEnde' ? value : f.arbeitsEnde
      if (b && e) {
        const [bH, bM] = b.split(':').map(Number)
        const [eH, eM] = e.split(':').map(Number)
        let diffMin = (eH * 60 + eM) - (bH * 60 + bM)
        // FM-06: Mitternacht-Edge-Case
        if (diffMin < 0) diffMin += 24 * 60
        const diffStunden = diffMin / 60
        // Auto-Pause nach ArbZG §4
        let gesetzlichePause = 0
        if (diffStunden > 9) gesetzlichePause = 45
        else if (diffStunden > 6) gesetzlichePause = 30
        if (gesetzlichePause > 0 && (parseInt(updated.pausezeit) || 0) < gesetzlichePause) {
          updated.pausezeit = gesetzlichePause.toString()
        }
        // ArbZG §3: max 10h Netto-Arbeitszeit (nach Pausenabzug)
        const nettoStd = diffStunden - ((parseInt(updated.pausezeit) || 0) / 60)
        if (nettoStd > 10) {
          toast.warning('Netto-Arbeitszeit darf 10 Stunden nicht überschreiten (ArbZG §3).')
        }
      }
      return updated
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 4: GPS ermitteln
  // ──────────────────────────────────────────────────────────────────────────
  const ermittleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS nicht verfügbar auf diesem Gerät')
      return
    }
    setGpsStatus('laden')
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          gpsStartLat: pos.coords.latitude.toFixed(7),
          gpsStartLon: pos.coords.longitude.toFixed(7),
        }))
        setGpsStatus('ermittelt')
      },
      err => {
        setGpsStatus('leer')
        setGpsError(`GPS-Fehler: ${err.message}. Bitte Berechtigung prüfen.`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 6: Team-Hilfsfunktionen
  // ──────────────────────────────────────────────────────────────────────────
  const updateTeamMitglied = (idx: number, updates: Partial<TeamMitglied>) => {
    setTeam(t => t.map((m, i) => (i === idx ? { ...m, ...updates } : m)))
  }

  const setGlobalStundenFuerAlle = () => {
    if (!globalStunden) return
    setTeam(t =>
      t.map(m => (m.krank ? m : { ...m, stunden: globalStunden }))
    )
  }

  const verteileGleichmaessig = () => {
    if (!globalStunden) return
    const total = parseFloat(globalStunden)
    if (isNaN(total) || total <= 0) return
    const aktive = team.filter(m => !m.krank).length
    if (aktive === 0) return
    const proMA = Math.round((total / aktive) * 10) / 10 // 1 decimal
    setTeam(t =>
      t.map(m => (m.krank ? m : { ...m, stunden: String(proMA) }))
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sprint FU (D5): Live-Berechnungen
  // ──────────────────────────────────────────────────────────────────────────
  const gesamtStunden = team.reduce((sum, m) => sum + (m.krank ? 0 : parseFloat(m.stunden) || 0), 0)
  const baumanzahl = (parseFloat(form.stk_pflanzung) || 0) + (parseFloat(form.stk_pflanzung_mit_bohrer) || 0)
  const stckProStunde = gesamtStunden > 0 && baumanzahl > 0 ? Math.round(baumanzahl / gesamtStunden) : 0
  // ha/Stunde braucht Fläche — falls aus Auftrag übernehmen

  // Sprint FU (D6): Validierung
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validateForm = (): boolean => {
    const errors: string[] = []
    const heute = new Date().toISOString().split('T')[0]
    
    if (form.datum > heute) {
      errors.push('Datum darf nicht in der Zukunft liegen')
    }
    
    if (form.arbeitsBeginn && form.arbeitsEnde) {
      if (form.arbeitsBeginn >= form.arbeitsEnde) {
        errors.push('Beginn muss vor Ende liegen')
      }
    }
    
    const mengenFelder = [
      { name: 'Stückzahl Pflanzung', val: form.stk_pflanzung },
      { name: 'Stückzahl Bohrer', val: form.stk_pflanzung_mit_bohrer },
      { name: 'Wuchshüllen', val: form.stk_wuchshuellen },
    ]
    for (const f of mengenFelder) {
      const v = parseFloat(f.val)
      if (f.val && v < 0) {
        errors.push(`${f.name} darf nicht negativ sein`)
      }
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Submit
  // ──────────────────────────────────────────────────────────────────────────
  const n = (val: string) => (val === '' ? null : Number(val))

  const handleSubmit = async (status: 'entwurf' | 'eingereicht') => {
    // Sprint FU (D6): Validierung vor Submit
    if (status === 'eingereicht' && !validateForm()) {
      return // Fehler werden angezeigt, nicht senden
    }
    
    setLoading(true)
    try {
      // FIX 6: Team-Daten serialisieren
      const mitarbeiterListe = team.length > 0
        ? team.map(m => ({
            mitarbeiterId: m.mitarbeiterId,
            name: m.name,
            stunden: m.krank ? 0 : parseFloat(m.stunden) || 0,
            krank: m.krank,
          }))
        : null

      const maschinenEinsatz = team.some(m => m.maschine)
        ? team
            .filter(m => m.maschine)
            .map(m => ({
              mitarbeiterId: m.mitarbeiterId,
              maschine: m.maschine,
              stunden: parseFloat(m.maschinenstunden) || 0,
            }))
        : null

      const payload = {
        auftragId,
        gruppeId,
        datum: new Date(form.datum).toISOString(),
        ersteller: form.ersteller,
        status,
        eingereichtAm: status === 'eingereicht' ? new Date().toISOString() : null,
        // Revier
        forstamt: form.forstamt || null,
        revier: form.revier || null,
        revierleiter: form.revierleiter || null,
        abteilung: form.abteilung || null,
        waldbesitzerName: form.waldbesitzerName || null,
        // Arbeitszeit (FM-06: time strings + Nettoarbeitszeit)
        arbeitsbeginn: form.arbeitsBeginn || null,
        arbeitsende: form.arbeitsEnde || null,
        pauseMinuten: parseInt(form.pausezeit) || 0,
        pausezeit: parseInt(form.pausezeit) || 0,
        arbeitsstunden: berechneNettoStunden(form.arbeitsBeginn, form.arbeitsEnde, form.pausezeit) || null,
        // Pflanzung Hand
        std_einschlag: n(form.std_einschlag),
        std_handpflanzung: n(form.std_handpflanzung),
        stk_pflanzung: n(form.stk_pflanzung),
        // Pflanzung Bohrer
        std_zum_bohrer: n(form.std_zum_bohrer),
        std_mit_bohrer: n(form.std_mit_bohrer),
        stk_pflanzung_mit_bohrer: n(form.stk_pflanzung_mit_bohrer),
        // Freischneider/Motorsäge
        std_freischneider: n(form.std_freischneider),
        std_motorsaege: n(form.std_motorsaege),
        // Pflanzenschutz
        std_wuchshuellen: n(form.std_wuchshuellen),
        stk_wuchshuellen: n(form.stk_wuchshuellen),
        std_netze_staebe_spiralen: n(form.std_netze_staebe_spiralen),
        stk_netze_staebe_spiralen: n(form.stk_netze_staebe_spiralen),
        // Zaunbau
        std_zaunbau: n(form.std_zaunbau),
        stk_drahtverbinder: n(form.stk_drahtverbinder),
        lfm_zaunbau: n(form.lfm_zaunbau),
        // Nachbesserung
        std_nachbesserung: n(form.std_nachbesserung),
        stk_nachbesserung: n(form.stk_nachbesserung),
        std_sonstige_arbeiten: n(form.std_sonstige_arbeiten),
        // Witterung & GPS
        witterung: form.witterung,
        gpsStartLat: n(form.gpsStartLat),
        gpsStartLon: n(form.gpsStartLon),
        // Team
        mitarbeiterListe,
        maschinenEinsatz,
        // Kommentar
        kommentar: form.kommentar || null,
        bericht: form.bericht || '',
        // F-3: Protokoll-Items
        items: protokollItems
          .filter(it => it.dienstleistung.trim())
          .map(it => ({
            dienstleistung: it.dienstleistung,
            flaeche: it.flaeche ? parseFloat(it.flaeche) : null,
            anzahlPflanzen: it.anzahlPflanzen ? parseInt(it.anzahlPflanzen) : null,
            stunden: it.stunden ? parseFloat(it.stunden) : null,
            bemerkung: it.bemerkung || null,
          })),
      }

      const url = editId ? `/api/tagesprotokoll/${editId}` : '/api/tagesprotokoll'
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      const result = await res.json()
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((w: string) => toast.warning(w))
      }
      if (onSaved) onSaved()
      else router.back()
    } catch (e) {
      toast.error('Fehler: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 3: Helper-Funktionen mit hellen Design-Klassen
  // ──────────────────────────────────────────────────────────────────────────
  const inp = (field: keyof typeof form, type = 'text', placeholder = '', opts?: { min?: number; max?: number; step?: number }) => (
    <input
      type={type}
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      placeholder={placeholder}
      {...(type === 'number' ? { min: opts?.min ?? 0, max: opts?.max ?? 10000, step: opts?.step ?? 0.5 } : {})}
      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] placeholder-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
    />
  )

  const sel = (field: keyof typeof form, opts: string[]) => (
    <select
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] focus:outline-none focus:ring-2 focus:ring-green-600"
    >
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  const section = (title: string, icon: string, children: React.ReactNode) => (
    <div className="mb-6 bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden">
      <div className="bg-[var(--color-surface-container-highest)] px-4 py-3 border-b border-border flex items-center gap-2">
        <span>{icon}</span>
        <h3 className="font-semibold text-[var(--color-on-surface)] text-sm">{title}</h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  )

  const field = (label: string, child: React.ReactNode, fullWidth = false) => (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">{label}</label>
      {child}
    </div>
  )

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-1">Tagesprotokoll</h2>
      {auftragTitel && <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">Auftrag: {auftragTitel}</p>}

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('Datum *', inp('datum', 'date'))}

        {/* FIX 5: Rollenabhängiges Gruppenführer-Feld */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Gruppenführer</label>
          {isAdmin ? (
            <select
              value={form.ersteller}
              onChange={e => setForm(f => ({ ...f, ersteller: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">— Gruppenführer wählen —</option>
              {gruppenfuehrerListe.map(gf => (
                <option key={gf.id} value={`${gf.vorname} ${gf.nachname}`}>
                  {gf.vorname} {gf.nachname}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container-highest)]">
              {userName || '—'}
            </div>
          )}
        </div>
      </div>

      {section('Revier und Gruppe', '🌲', <>
        {field('Forstamt', inp('forstamt', 'text', 'Forstamt Darmstadt'))}
        {field('Revier', inp('revier', 'text', 'Revier Nord'))}
        {field('Revierleiter', inp('revierleiter', 'text', 'Name des Revierleiters'))}
        {field('Abteilung', inp('abteilung', 'text', 'Abt. 12a'))}
        {field('Waldbesitzer', inp('waldbesitzerName', 'text', 'Klaus Hoffmann'))}
        {field('Gruppe', (
          <select
            value={form.gruppe}
            onChange={e => setForm(f => ({ ...f, gruppe: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">— Gruppe wählen —</option>
            {gruppenListe.map(g => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        ))}
      </>)}

      {/* FM-06: Arbeitszeit Start/Ende/Pause mit Netto-Berechnung */}
      <div className="mb-6 bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden">
        <div className="bg-[var(--color-surface-container-highest)] px-4 py-3 border-b border-border flex items-center gap-2">
          <span>⏰</span>
          <h3 className="font-semibold text-[var(--color-on-surface)] text-sm">Arbeitszeit vor Ort</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Arbeitsbeginn</label>
            <input
              type="time"
              value={form.arbeitsBeginn}
              onChange={e => handleZeitChange('arbeitsBeginn', e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Arbeitsende</label>
            <input
              type="time"
              value={form.arbeitsEnde}
              onChange={e => handleZeitChange('arbeitsEnde', e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Pause (Minuten)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={form.pausezeit}
              onChange={e => setForm(f => ({ ...f, pausezeit: e.target.value }))}
              placeholder="60"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] placeholder-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div className="md:col-span-3">
            {(() => {
              const netto = berechneNettoStunden(form.arbeitsBeginn, form.arbeitsEnde, form.pausezeit)
              return netto > 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-emerald-400 font-medium text-sm">Nettoarbeitszeit: {netto.toFixed(1)} Stunden</span>
                </div>
              ) : null
            })()}
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
              Pause wird automatisch nach ArbZG §4 vorgeschlagen: &gt;6h = 30 min, &gt;9h = 45 min.
            </p>
          </div>
        </div>
      </div>

      {section('Pflanzung mit Hand', '🤲', <>
        {field('Einschlag (Stunden)', inp('std_einschlag', 'number', '0', { max: 10 }))}
        {field('Stunden Pflanzung', inp('std_handpflanzung', 'number', '0', { max: 10 }))}
        {field('Stückzahl Handpflanzung', inp('stk_pflanzung', 'number', '0', { max: 50000, step: 1 }))}
      </>)}

      {section('Pflanzung mit Bohrer', '🔩', <>
        {field('Handpflanzung zum Bohrer (Std)', inp('std_zum_bohrer', 'number', '0', { max: 10 }))}
        {field('Laufzeit des Bohrers (Std)', inp('std_mit_bohrer', 'number', '0', { max: 10 }))}
        {field('Stückzahl Bohrerpflanzung', inp('stk_pflanzung_mit_bohrer', 'number', '0', { max: 50000, step: 1 }))}
      </>)}

      {section('Freischneider und Motorsäge', '⚙️', <>
        {field('Stunden Freischneider', inp('std_freischneider', 'number', '0', { max: 10 }))}
        {field('Stunden Motorsäge', inp('std_motorsaege', 'number', '0', { max: 10 }))}
      </>)}

      {section('Pflanzenschutz', '🛡️', <>
        {field('Std Wuchshüllen anbringen', inp('std_wuchshuellen', 'number', '0'))}
        {field('Stückzahl Wuchshüllen', inp('stk_wuchshuellen', 'number', '0'))}
        {field('Std Netz/Stäbe/Spiralen', inp('std_netze_staebe_spiralen', 'number', '0'))}
        {field('Stk Netz/Stäbe/Spiralen', inp('stk_netze_staebe_spiralen', 'number', '0'))}
      </>)}

      {section('Zaunbau', '🪵', <>
        {field('Stunden Zaunbau', inp('std_zaunbau', 'number', '0'))}
        {field('Stückzahl Drahtverbinder', inp('stk_drahtverbinder', 'number', '0'))}
        {field('Laufmeter Zaunbau (lfm)', inp('lfm_zaunbau', 'number', '0'))}
      </>)}

      {section('Nachbesserung', '🔄', <>
        {field('Stunden Nachbesserung', inp('std_nachbesserung', 'number', '0'))}
        {field('Stückzahl Nachbesserung', inp('stk_nachbesserung', 'number', '0'))}
        {field('Std sonstige Arbeiten', inp('std_sonstige_arbeiten', 'number', '0'))}
      </>)}

      {/* Witterung & GPS */}
      <div className="mb-6 bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden">
        <div className="bg-[var(--color-surface-container-highest)] px-4 py-3 border-b border-border flex items-center gap-2">
          <span>🌤️</span>
          <h3 className="font-semibold text-[var(--color-on-surface)] text-sm">Witterung &amp; GPS</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('Witterung', sel('witterung', ['sonnig', 'bedeckt', 'leichter Regen', 'starker Regen', 'Schnee', 'Nebel', 'Frost']))}

          {/* FIX 4: GPS-Button statt manuelle Eingabe */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-2">GPS Standort (Start)</label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                {gpsStatus === 'ermittelt' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-emerald-400">
                    ✓ {form.gpsStartLat}, {form.gpsStartLon}
                    <button
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, gpsStartLat: '', gpsStartLon: '' })); setGpsStatus('leer') }}
                      className="ml-2 text-red-400 text-xs hover:underline"
                    >
                      zurücksetzen
                    </button>
                  </div>
                ) : (
                  <div className="bg-[var(--color-surface-container-highest)] border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface-variant)]">
                    {gpsStatus === 'laden' ? '⏳ GPS wird ermittelt…' : 'Noch nicht ermittelt'}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={ermittleGPS}
                disabled={gpsStatus === 'laden'}
                className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                📍 {gpsStatus === 'laden' ? 'Wird ermittelt…' : 'GPS ermitteln'}
              </button>
            </div>
            {gpsError && <p className="text-xs text-red-500 mt-1">{gpsError}</p>}
            {form.gpsStartLat && form.gpsStartLon && (
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                Koordinaten: {parseFloat(form.gpsStartLat).toFixed(6)}, {parseFloat(form.gpsStartLon).toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* FIX 6: Team & Stunden */}
      {(team.length > 0 || gruppeId) && (
        <div className="mb-6 bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden">
          <div className="bg-[var(--color-surface-container-highest)] px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>👷</span>
              <h3 className="font-semibold text-[var(--color-on-surface)] text-sm">Team &amp; Stunden</h3>
            </div>
            {team.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={globalStunden}
                  onChange={e => setGlobalStunden(e.target.value)}
                  placeholder="Std"
                  className="w-16 border border-border rounded px-2 py-1 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)]"
                />
                <button
                  type="button"
                  onClick={setGlobalStundenFuerAlle}
                  className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 whitespace-nowrap"
                  title="Gleichen Wert für alle setzen"
                >
                  Alle setzen
                </button>
                <button
                  type="button"
                  onClick={verteileGleichmaessig}
                  className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 whitespace-nowrap"
                  title="Gesamtstunden gleichmäßig auf alle MA verteilen"
                >
                  Verteilen
                </button>
              </div>
            )}
          </div>
          <div className="p-4">
            {team.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-variant)] text-center py-4">
                {gruppeId ? 'Lade Gruppenmitglieder…' : 'Kein Gruppe zugewiesen'}
              </p>
            ) : (
              <div className="space-y-3">
                {team.map((m, idx) => (
                  <div
                    key={m.mitarbeiterId}
                    className={`rounded-lg border p-3 transition-all ${m.krank ? 'bg-red-500/10 border-red-500/30 opacity-70' : 'bg-[var(--color-surface-container-highest)] border-border'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${m.krank ? 'text-red-400 line-through' : 'text-[var(--color-on-surface)]'}`}>
                        {m.name}
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.krank}
                          onChange={e => updateTeamMitglied(idx, {
                            krank: e.target.checked,
                            stunden: e.target.checked ? '0' : '',
                          })}
                          className="w-4 h-4 accent-red-500"
                        />
                        <span className="text-xs text-red-400 font-medium">Krank</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Stunden (0–10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={m.krank ? '0' : m.stunden}
                          disabled={m.krank}
                          onChange={e => updateTeamMitglied(idx, { stunden: e.target.value })}
                          className="w-full border border-border rounded px-2 py-1.5 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] disabled:opacity-50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Maschine (optional)</label>
                        <input
                          type="text"
                          value={m.maschine}
                          disabled={m.krank}
                          onChange={e => updateTeamMitglied(idx, { maschine: e.target.value })}
                          placeholder="z.B. Forstbohrer, Motorsäge"
                          className="w-full border border-border rounded px-2 py-1.5 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] placeholder-[var(--color-on-surface-variant)] disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Masch. Std</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={m.maschinenstunden}
                          disabled={m.krank || !m.maschine}
                          onChange={e => updateTeamMitglied(idx, { maschinenstunden: e.target.value })}
                          className="w-full border border-border rounded px-2 py-1.5 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* F-3: Protokoll-Items (Dienstleistungs-Verknüpfung) */}
      <div className="mb-6 bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden">
        <div className="bg-[var(--color-surface-container-highest)] px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <h3 className="font-semibold text-[var(--color-on-surface)] text-sm">Leistungspositionen</h3>
          </div>
          <button
            type="button"
            onClick={() => setProtokollItems(prev => [...prev, { dienstleistung: '', flaeche: '', anzahlPflanzen: '', stunden: '', bemerkung: '' }])}
            className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-600"
          >
            + Leistung
          </button>
        </div>
        <div className="p-4">
          {protokollItems.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)] text-center py-3">
              Keine Leistungspositionen. Klicken Sie &quot;+ Leistung&quot; zum Hinzufügen.
            </p>
          ) : (
            <div className="space-y-3">
              {protokollItems.map((item, idx) => (
                <div key={idx} className="bg-[var(--color-surface-container-highest)] border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Position {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setProtokollItems(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Entfernen
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Dienstleistung</label>
                      <select
                        value={item.dienstleistung}
                        onChange={e => setProtokollItems(prev => prev.map((it, i) => i === idx ? { ...it, dienstleistung: e.target.value } : it))}
                        className="w-full border border-border rounded px-2 py-1.5 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)]"
                      >
                        <option value="">Bitte wählen...</option>
                        {Object.entries(DIENSTLEISTUNG_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                        <option value="sonstiges">Sonstiges</option>
                      </select>
                      {/* FM-12: Smart Items Vorschläge */}
                      {item.dienstleistung && getSmartItemsForDienstleistung(item.dienstleistung).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {getSmartItemsForDienstleistung(item.dienstleistung).map((si: SmartItem) => (
                            <button
                              key={si.name}
                              type="button"
                              onClick={() => setProtokollItems(prev => [...prev, { dienstleistung: item.dienstleistung, flaeche: '', anzahlPflanzen: si.einheit === 'Stück' ? String(si.richtwert) : '', stunden: si.einheit === 'h' ? String(si.richtwert) : '', bemerkung: si.name }])}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-green-700/40 text-green-500 hover:bg-green-700/20 transition-colors"
                            >
                              + {si.name} ({si.richtwert} {si.einheit})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Stunden</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.stunden}
                        onChange={e => setProtokollItems(prev => prev.map((it, i) => i === idx ? { ...it, stunden: e.target.value } : it))}
                        className="w-full border border-border rounded px-2 py-1.5 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Fläche (ha)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.flaeche}
                        onChange={e => setProtokollItems(prev => prev.map((it, i) => i === idx ? { ...it, flaeche: e.target.value } : it))}
                        className="w-full border border-border rounded px-2 py-1.5 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kommentar */}
      <div className="bg-[var(--color-surface-container)] rounded-xl border border-border overflow-hidden mb-6">
        <div className="bg-[var(--color-surface-container-highest)] px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-[var(--color-on-surface)] text-sm">💬 Kommentar</h3>
        </div>
        <div className="p-4">
          <textarea
            value={form.kommentar}
            onChange={e => setForm(f => ({ ...f, kommentar: e.target.value }))}
            placeholder="Tageskommentar des Gruppenführers…"
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] placeholder-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
          />
        </div>
      </div>

      {/* Sprint FU (D5): Live-Berechnungen */}
      {(gesamtStunden > 0 || baumanzahl > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-green-800 text-sm mb-3">📊 Berechnete Kennzahlen</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-green-600">Gesamtstunden</p>
              <p className="text-lg font-bold text-green-800">{gesamtStunden.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-xs text-green-600">Gepflanzte Bäume</p>
              <p className="text-lg font-bold text-green-800">{baumanzahl.toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-xs text-green-600">Stück/Stunde</p>
              <p className="text-lg font-bold text-green-800">{stckProStunde}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sprint FU (D6): Validierungsfehler */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-red-800 text-sm mb-2">⚠️ Bitte korrigieren:</h3>
          <ul className="list-disc list-inside text-sm text-red-700">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit('entwurf')}
          disabled={loading}
          className="flex-1 border border-border text-[var(--color-on-surface)] py-3 rounded-xl font-semibold hover:bg-[var(--color-surface-container-highest)] disabled:opacity-50"
        >
          {loading ? '…' : editId ? 'Änderungen speichern' : 'Entwurf speichern'}
        </button>
        {!editId && (
        <button
          onClick={() => handleSubmit('eingereicht')}
          disabled={loading}
          className="flex-1 bg-green-800 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Einreichen ✓'}
        </button>
        )}
      </div>
    </div>
  )
}
