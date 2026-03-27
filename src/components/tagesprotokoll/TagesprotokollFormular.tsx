'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  auftragId: string
  auftragTitel?: string
  waldbesitzer?: string
  gruppeId?: string
  onSaved?: () => void
}

export default function TagesprotokollFormular({ auftragId, auftragTitel, waldbesitzer, gruppeId, onSaved }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    datum: new Date().toISOString().split('T')[0],
    ersteller: '',
    // Revier & Gruppe
    forstamt: '', revier: '', revierleiter: '', abteilung: '', waldbesitzerName: waldbesitzer || '', gruppe: '',
    // Arbeitszeit
    zeitBeginn: '', zeitEnde: '', pausezeit: '',
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
    gpsStartLat: '', gpsStartLon: '',
    // Kommentar
    kommentar: '',
    bericht: '',
  })

  const n = (val: string) => val === '' ? null : Number(val)

  const handleSubmit = async (status: 'entwurf' | 'eingereicht') => {
    setLoading(true)
    try {
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

  const inp = (field: keyof typeof form, type = 'text', placeholder = '') => (
    <input
      type={type}
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
    />
  )

  const sel = (field: keyof typeof form, opts: string[]) => (
    <select
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
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

  const field = (label: string, child: React.ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {child}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Tagesprotokoll</h2>
      {auftragTitel && <p className="text-sm text-gray-500 mb-6">Auftrag: {auftragTitel}</p>}

      <div className="mb-4 grid grid-cols-2 gap-4">
        {field('Datum *', inp('datum', 'date'))}
        {field('Gruppenführer (Name)', inp('ersteller', 'text', 'Stefan Weber'))}
      </div>

      {section('Revier und Gruppe', '🌲', <>
        {field('Forstamt', inp('forstamt', 'text', 'Forstamt Darmstadt'))}
        {field('Revier', inp('revier', 'text', 'Revier Nord'))}
        {field('Revierleiter', inp('revierleiter', 'text', 'Name des Revierleiters'))}
        {field('Abteilung', inp('abteilung', 'text', 'Abt. 12a'))}
        {field('Waldbesitzer', inp('waldbesitzerName', 'text', 'Klaus Hoffmann'))}
        {field('Gruppe', inp('gruppe', 'text', 'Gruppe A'))}
      </>)}

      {section('Arbeitszeit vor Ort', '⏰', <>
        {field('Beginn', inp('zeitBeginn', 'datetime-local'))}
        {field('Ende', inp('zeitEnde', 'datetime-local'))}
        {field('Pause (Minuten)', inp('pausezeit', 'number', '45'))}
      </>)}

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

      {section('Witterung & GPS', '🌤️', <>
        {field('Witterung', sel('witterung', ['sonnig', 'bedeckt', 'leichter Regen', 'starker Regen', 'Schnee', 'Nebel', 'Frost']))}
        {field('GPS Breitengrad (Start)', inp('gpsStartLat', 'number', '49.8488'))}
        {field('GPS Längengrad (Start)', inp('gpsStartLon', 'number', '8.6427'))}
      </>)}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-sm">💬 Kommentar</h3>
        </div>
        <div className="p-4">
          <textarea
            value={form.kommentar}
            onChange={e => setForm(f => ({ ...f, kommentar: e.target.value }))}
            placeholder="Tageskommentar des Gruppenführers..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit('entwurf')}
          disabled={loading}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? '...' : 'Entwurf speichern'}
        </button>
        <button
          onClick={() => handleSubmit('eingereicht')}
          disabled={loading}
          className="flex-1 bg-green-800 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Einreichen ✓'}
        </button>
      </div>
    </div>
  )
}
