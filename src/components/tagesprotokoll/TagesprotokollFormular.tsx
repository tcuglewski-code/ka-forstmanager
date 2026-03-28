'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  // FIX 6: Team-Mitglieder
  const [team, setTeam] = useState<TeamMitglied[]>([])
  const [globalStunden, setGlobalStunden] = useState('')

  // ──────────────────────────────────────────────────────────────────────────
  // Formular-State (FIX 1: initial values aus Auftrag)
  // ──────────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    datum: new Date().toISOString().split('T')[0],
    ersteller: isAdmin ? '' : userName,
    // Revier & Gruppe
    forstamt: defaultFoerstamt,
    revier: defaultRevier,
    revierleiter: defaultRevierleiter,
    abteilung: defaultAbteilung,
    waldbesitzerName: waldbesitzer || '',
    gruppe: '',
    // Arbeitszeit
    zeitBeginn: '',
    zeitEnde: '',
    pausezeit: '',
    // Pflanzung Hand
    std_einschlag: '', std_handpflanzung: '', stk_pflanzung: '',
    // Pflanzung Bohrer
    std_zum_bohrer: '', std_mit_bohrer: '', stk_pflanzung_mit_bohrer: '',
    // Freischneider/Motorsäge
    std_freischneider: '', std_motorsaege: '',
    // Pflanzenschutz
    std_wuchshuellen: '', stk_wuchshuellen: '', std_netze_staebe_spiralen: '', stk_netze_staebe_spiralen: '',
    // Zaunbau
    std_zaunbau: '', stk_drahtverbinder: '', lfm_zaunbau: '',
    // Nachbesserung
    std_nachbesserung: '', stk_nachbesserung: '', std_sonstige_arbeiten: '',
    // Witterung
    witterung: 'sonnig',
    // GPS (FIX 1: Vorausfüllen)
    gpsStartLat: defaultGpsLat?.toFixed(7) ?? '',
    gpsStartLon: defaultGpsLon?.toFixed(7) ?? '',
    // Kommentar
    kommentar: '',
    bericht: '',
  })

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 5: Gruppenführer-Liste laden (nur für Admins)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/mitarbeiter?rolle=gruppenführer')
      .then(r => r.json())
      .then((data: GruppenfuehrerOption[]) => setGruppenfuehrerListe(data))
      .catch(() => {})
  }, [isAdmin])

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
      .catch(() => {})
  }, [gruppeId])

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 2: Arbeitszeit — max. 10h + gesetzliche Pause (ArbZG §4)
  // ──────────────────────────────────────────────────────────────────────────
  const berechnePause = (beginn: string, ende: string) => {
    if (!beginn || !ende) return
    const start = new Date(beginn).getTime()
    const endTime = new Date(ende).getTime()
    if (isNaN(start) || isNaN(endTime) || endTime <= start) return

    const diffStunden = (endTime - start) / (1000 * 60 * 60)

    if (diffStunden > 10) {
      alert('Arbeitszeit darf 10 Stunden nicht überschreiten (gesetzliche Vorgabe, ArbZG §3).')
      const maxEnde = new Date(start + 10 * 60 * 60 * 1000)
      setForm(f => ({ ...f, zeitEnde: maxEnde.toISOString().slice(0, 16) }))
      return
    }

    let gesetzlichePause = 0
    if (diffStunden > 9) gesetzlichePause = 45
    else if (diffStunden > 6) gesetzlichePause = 30

    setForm(f => ({ ...f, pausezeit: gesetzlichePause.toString() }))
  }

  const handleZeitChange = (field: 'zeitBeginn' | 'zeitEnde', value: string) => {
    setForm(f => {
      const updated = { ...f, [field]: value }
      const b = field === 'zeitBeginn' ? value : f.zeitBeginn
      const e = field === 'zeitEnde' ? value : f.zeitEnde
      if (b && e) setTimeout(() => berechnePause(b, e), 0)
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
    
    if (form.zeitBeginn && form.zeitEnde) {
      const beginn = new Date(form.zeitBeginn)
      const ende = new Date(form.zeitEnde)
      if (beginn >= ende) {
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
        // Arbeitszeit
        zeitBeginn: form.zeitBeginn ? new Date(form.zeitBeginn).toISOString() : null,
        zeitEnde: form.zeitEnde ? new Date(form.zeitEnde).toISOString() : null,
        pausezeit: n(form.pausezeit),
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
      }

      const res = await fetch('/api/tagesprotokoll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      if (onSaved) onSaved()
      else router.back()
    } catch (e) {
      alert('Fehler: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FIX 3: Helper-Funktionen mit hellen Design-Klassen
  // ──────────────────────────────────────────────────────────────────────────
  const inp = (field: keyof typeof form, type = 'text', placeholder = '') => (
    <input
      type={type}
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
    />
  )

  const sel = (field: keyof typeof form, opts: string[]) => (
    <select
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
    >
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  const section = (title: string, icon: string, children: React.ReactNode) => (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <span>{icon}</span>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  )

  const field = (label: string, child: React.ReactNode, fullWidth = false) => (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {child}
    </div>
  )

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Tagesprotokoll</h2>
      {auftragTitel && <p className="text-sm text-gray-500 mb-6">Auftrag: {auftragTitel}</p>}

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('Datum *', inp('datum', 'date'))}

        {/* FIX 5: Rollenabhängiges Gruppenführer-Feld */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Gruppenführer</label>
          {isAdmin ? (
            <select
              value={form.ersteller}
              onChange={e => setForm(f => ({ ...f, ersteller: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">— Gruppenführer wählen —</option>
              {gruppenfuehrerListe.map(gf => (
                <option key={gf.id} value={`${gf.vorname} ${gf.nachname}`}>
                  {gf.vorname} {gf.nachname}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50">
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
        {field('Gruppe', inp('gruppe', 'text', 'Gruppe A'))}
      </>)}

      {/* FIX 2: Arbeitszeit mit max 10h + Auto-Pause */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <span>⏰</span>
          <h3 className="font-semibold text-gray-800 text-sm">Arbeitszeit vor Ort</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Beginn</label>
            <input
              type="datetime-local"
              value={form.zeitBeginn}
              onChange={e => handleZeitChange('zeitBeginn', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ende</label>
            <input
              type="datetime-local"
              value={form.zeitEnde}
              onChange={e => handleZeitChange('zeitEnde', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Pause (Minuten)</label>
            <input
              type="number"
              value={form.pausezeit}
              onChange={e => setForm(f => ({ ...f, pausezeit: e.target.value }))}
              placeholder="30"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <p className="text-xs text-gray-400 mt-1">
              Automatisch nach ArbZG §4: &gt;6h = 30 min, &gt;9h = 45 min. Max. Arbeitszeit: 10h.
            </p>
          </div>
        </div>
      </div>

      {section('Pflanzung mit Hand', '🤲', <>
        {field('Einschlag (Stunden)', inp('std_einschlag', 'number', '0'))}
        {field('Stunden Pflanzung', inp('std_handpflanzung', 'number', '0'))}
        {field('Stückzahl Handpflanzung', inp('stk_pflanzung', 'number', '0'))}
      </>)}

      {section('Pflanzung mit Bohrer', '🔩', <>
        {field('Handpflanzung zum Bohrer (Std)', inp('std_zum_bohrer', 'number', '0'))}
        {field('Laufzeit des Bohrers (Std)', inp('std_mit_bohrer', 'number', '0'))}
        {field('Stückzahl Bohrerpflanzung', inp('stk_pflanzung_mit_bohrer', 'number', '0'))}
      </>)}

      {section('Freischneider und Motorsäge', '⚙️', <>
        {field('Stunden Freischneider', inp('std_freischneider', 'number', '0'))}
        {field('Stunden Motorsäge', inp('std_motorsaege', 'number', '0'))}
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
      <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <span>🌤️</span>
          <h3 className="font-semibold text-gray-800 text-sm">Witterung &amp; GPS</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('Witterung', sel('witterung', ['sonnig', 'bedeckt', 'leichter Regen', 'starker Regen', 'Schnee', 'Nebel', 'Frost']))}

          {/* FIX 4: GPS-Button statt manuelle Eingabe */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-2">GPS Standort (Start)</label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                {gpsStatus === 'ermittelt' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                    ✓ {form.gpsStartLat}, {form.gpsStartLon}
                    <button
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, gpsStartLat: '', gpsStartLon: '' })); setGpsStatus('leer') }}
                      className="ml-2 text-red-500 text-xs hover:underline"
                    >
                      zurücksetzen
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400">
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
              <p className="text-xs text-gray-400 mt-1">
                Koordinaten: {parseFloat(form.gpsStartLat).toFixed(6)}, {parseFloat(form.gpsStartLon).toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* FIX 6: Team & Stunden */}
      {(team.length > 0 || gruppeId) && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>👷</span>
              <h3 className="font-semibold text-gray-800 text-sm">Team &amp; Stunden</h3>
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
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                />
                <button
                  type="button"
                  onClick={setGlobalStundenFuerAlle}
                  className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 whitespace-nowrap"
                >
                  Alle setzen
                </button>
              </div>
            )}
          </div>
          <div className="p-4">
            {team.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {gruppeId ? 'Lade Gruppenmitglieder…' : 'Kein Gruppe zugewiesen'}
              </p>
            ) : (
              <div className="space-y-3">
                {team.map((m, idx) => (
                  <div
                    key={m.mitarbeiterId}
                    className={`rounded-lg border p-3 transition-all ${m.krank ? 'bg-red-50 border-red-200 opacity-70' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${m.krank ? 'text-red-600 line-through' : 'text-gray-800'}`}>
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
                        <span className="text-xs text-red-600 font-medium">Krank</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Stunden (0–10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={m.krank ? '0' : m.stunden}
                          disabled={m.krank}
                          onChange={e => updateTeamMitglied(idx, { stunden: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Maschine (optional)</label>
                        <input
                          type="text"
                          value={m.maschine}
                          disabled={m.krank}
                          onChange={e => updateTeamMitglied(idx, { maschine: e.target.value })}
                          placeholder="z.B. Forstbohrer, Motorsäge"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Masch. Std</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={m.maschinenstunden}
                          disabled={m.krank || !m.maschine}
                          onChange={e => updateTeamMitglied(idx, { maschinenstunden: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-400"
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

      {/* Kommentar */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-sm">💬 Kommentar</h3>
        </div>
        <div className="p-4">
          <textarea
            value={form.kommentar}
            onChange={e => setForm(f => ({ ...f, kommentar: e.target.value }))}
            placeholder="Tageskommentar des Gruppenführers…"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
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
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? '…' : 'Entwurf speichern'}
        </button>
        <button
          onClick={() => handleSubmit('eingereicht')}
          disabled={loading}
          className="flex-1 bg-green-800 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Einreichen ✓'}
        </button>
      </div>
    </div>
  )
}
