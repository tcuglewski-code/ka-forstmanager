"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Auftrag {
  id: string
  titel: string
  waldbesitzer?: string | null
  gruppe?: { name: string } | null
}

interface TagesprotokollFormularProps {
  auftrag: Auftrag
  onSuccess: () => void
  onCancel: () => void
  initialData?: Partial<FormData>
  protokollId?: string
}

interface FormData {
  datum: string
  // Sektion 1
  forstamt: string
  revier: string
  revierleiter: string
  abteilung: string
  waldbesitzerName: string
  gruppeNr: string
  // Sektion 2
  zeitBeginn: string
  zeitEnde: string
  pausezeit: string
  // Sektion 3
  std_einschlag: string
  std_handpflanzung: string
  stk_pflanzung: string
  // Sektion 4
  std_zum_bohrer: string
  std_mit_bohrer: string
  stk_pflanzung_mit_bohrer: string
  // Sektion 5
  std_freischneider: string
  std_motorsaege: string
  // Sektion 6
  std_wuchshuellen: string
  stk_wuchshuellen: string
  std_netze_staebe_spiralen: string
  stk_netze_staebe_spiralen: string
  // Sektion 7
  std_zaunbau: string
  stk_drahtverbinder: string
  lfm_zaunbau: string
  // Sektion 8
  std_nachbesserung: string
  stk_nachbesserung: string
  std_sonstige_arbeiten: string
  // Sektion 9
  witterung: string
  gpsStartLat: string
  gpsStartLon: string
  // Sektion 10
  kommentar: string
  bericht: string
}

const emptyForm = (auftrag: Auftrag): FormData => ({
  datum: new Date().toISOString().split("T")[0],
  forstamt: "",
  revier: "",
  revierleiter: "",
  abteilung: "",
  waldbesitzerName: auftrag.waldbesitzer ?? "",
  gruppeNr: auftrag.gruppe?.name ?? "",
  zeitBeginn: "",
  zeitEnde: "",
  pausezeit: "",
  std_einschlag: "",
  std_handpflanzung: "",
  stk_pflanzung: "",
  std_zum_bohrer: "",
  std_mit_bohrer: "",
  stk_pflanzung_mit_bohrer: "",
  std_freischneider: "",
  std_motorsaege: "",
  std_wuchshuellen: "",
  stk_wuchshuellen: "",
  std_netze_staebe_spiralen: "",
  stk_netze_staebe_spiralen: "",
  std_zaunbau: "",
  stk_drahtverbinder: "",
  lfm_zaunbau: "",
  std_nachbesserung: "",
  stk_nachbesserung: "",
  std_sonstige_arbeiten: "",
  witterung: "",
  gpsStartLat: "",
  gpsStartLon: "",
  kommentar: "",
  bericht: "",
})

function SektionBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#181818] transition-colors text-left"
      >
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {open && (
        <div className="p-4 bg-[#0d0d0d] space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60"

function numField(
  value: string,
  onChange: (v: string) => void,
  placeholder = ""
) {
  return (
    <input
      type="number"
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  )
}

function textField(
  value: string,
  onChange: (v: string) => void,
  placeholder = ""
) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  )
}

export default function TagesprotokollFormular({
  auftrag,
  onSuccess,
  onCancel,
  initialData,
  protokollId,
}: TagesprotokollFormularProps) {
  const base = emptyForm(auftrag)
  const [form, setForm] = useState<FormData>({ ...base, ...initialData })
  const [saving, setSaving] = useState(false)

  const set = (key: keyof FormData) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  function buildPayload(status: string) {
    const numOrNull = (v: string) => (v === "" ? null : Number(v))
    const dateOrNull = (v: string) => (v === "" ? null : new Date(v).toISOString())

    return {
      auftragId: auftrag.id,
      datum: new Date(form.datum).toISOString(),
      status,
      // Sektion 1
      forstamt: form.forstamt || null,
      revier: form.revier || null,
      revierleiter: form.revierleiter || null,
      abteilung: form.abteilung || null,
      waldbesitzerName: form.waldbesitzerName || null,
      // Sektion 2
      zeitBeginn: dateOrNull(form.zeitBeginn),
      zeitEnde: dateOrNull(form.zeitEnde),
      pausezeit: numOrNull(form.pausezeit),
      // Sektion 3
      std_einschlag: numOrNull(form.std_einschlag),
      std_handpflanzung: numOrNull(form.std_handpflanzung),
      stk_pflanzung: numOrNull(form.stk_pflanzung),
      // Sektion 4
      std_zum_bohrer: numOrNull(form.std_zum_bohrer),
      std_mit_bohrer: numOrNull(form.std_mit_bohrer),
      stk_pflanzung_mit_bohrer: numOrNull(form.stk_pflanzung_mit_bohrer),
      // Sektion 5
      std_freischneider: numOrNull(form.std_freischneider),
      std_motorsaege: numOrNull(form.std_motorsaege),
      // Sektion 6
      std_wuchshuellen: numOrNull(form.std_wuchshuellen),
      stk_wuchshuellen: numOrNull(form.stk_wuchshuellen),
      std_netze_staebe_spiralen: numOrNull(form.std_netze_staebe_spiralen),
      stk_netze_staebe_spiralen: numOrNull(form.stk_netze_staebe_spiralen),
      // Sektion 7
      std_zaunbau: numOrNull(form.std_zaunbau),
      stk_drahtverbinder: numOrNull(form.stk_drahtverbinder),
      lfm_zaunbau: numOrNull(form.lfm_zaunbau),
      // Sektion 8
      std_nachbesserung: numOrNull(form.std_nachbesserung),
      stk_nachbesserung: numOrNull(form.stk_nachbesserung),
      std_sonstige_arbeiten: numOrNull(form.std_sonstige_arbeiten),
      // Sektion 9
      witterung: form.witterung || null,
      gpsStartLat: numOrNull(form.gpsStartLat),
      gpsStartLon: numOrNull(form.gpsStartLon),
      // Sektion 10
      kommentar: form.kommentar || null,
      bericht: form.bericht || "",
    }
  }

  async function handleSave(status: string) {
    setSaving(true)
    const payload = buildPayload(status)
    try {
      if (protokollId) {
        await fetch(`/api/tagesprotokoll/${protokollId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/tagesprotokoll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      onSuccess()
    } catch (err) {
      console.error("Fehler beim Speichern:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Datum (immer sichtbar oben) */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Datum *</label>
        <input
          type="date"
          value={form.datum}
          onChange={(e) => set("datum")(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      {/* Sektion 1 */}
      <SektionBlock title="1 · Revier und Gruppe">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Forstamt">{textField(form.forstamt, set("forstamt"))}</Field>
          <Field label="Revier">{textField(form.revier, set("revier"))}</Field>
          <Field label="Revierleiter">{textField(form.revierleiter, set("revierleiter"))}</Field>
          <Field label="Abteilung">{textField(form.abteilung, set("abteilung"))}</Field>
          <Field label="Waldbesitzer">{textField(form.waldbesitzerName, set("waldbesitzerName"))}</Field>
          <Field label="Gruppe">{textField(form.gruppeNr, set("gruppeNr"))}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 2 */}
      <SektionBlock title="2 · Arbeitszeit vor Ort">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Beginn">
            <input
              type="datetime-local"
              value={form.zeitBeginn}
              onChange={(e) => set("zeitBeginn")(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Ende">
            <input
              type="datetime-local"
              value={form.zeitEnde}
              onChange={(e) => set("zeitEnde")(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Pause (Minuten)">{numField(form.pausezeit, set("pausezeit"), "0")}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 3 */}
      <SektionBlock title="3 · Pflanzung mit Hand" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Einschlag (Std.)">{numField(form.std_einschlag, set("std_einschlag"))}</Field>
          <Field label="Std. Handpflanzung">{numField(form.std_handpflanzung, set("std_handpflanzung"))}</Field>
          <Field label="Stückzahl Handpflanzung">{numField(form.stk_pflanzung, set("stk_pflanzung"))}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 4 */}
      <SektionBlock title="4 · Pflanzung mit Bohrer" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Handpflanzung zum Bohrer (Std.)">{numField(form.std_zum_bohrer, set("std_zum_bohrer"))}</Field>
          <Field label="Laufzeit Bohrer (Std.)">{numField(form.std_mit_bohrer, set("std_mit_bohrer"))}</Field>
          <Field label="Stückzahl mit Bohrer">{numField(form.stk_pflanzung_mit_bohrer, set("stk_pflanzung_mit_bohrer"))}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 5 */}
      <SektionBlock title="5 · Freischneider & Motorsäge" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Std. Freischneider">{numField(form.std_freischneider, set("std_freischneider"))}</Field>
          <Field label="Std. Motorsäge">{numField(form.std_motorsaege, set("std_motorsaege"))}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 6 */}
      <SektionBlock title="6 · Pflanzenschutz" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Std. Wuchshüllen anbringen">{numField(form.std_wuchshuellen, set("std_wuchshuellen"))}</Field>
          <Field label="Stk. Wuchshüllen">{numField(form.stk_wuchshuellen, set("stk_wuchshuellen"))}</Field>
          <Field label="Std. Netz/Stäbe/Spiralen">{numField(form.std_netze_staebe_spiralen, set("std_netze_staebe_spiralen"))}</Field>
          <Field label="Stk. Netz/Stäbe/Spiralen">{numField(form.stk_netze_staebe_spiralen, set("stk_netze_staebe_spiralen"))}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 7 */}
      <SektionBlock title="7 · Zaunbau" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Std. Zaunbau">{numField(form.std_zaunbau, set("std_zaunbau"))}</Field>
          <Field label="Stk. Drahtverbinder">{numField(form.stk_drahtverbinder, set("stk_drahtverbinder"))}</Field>
          <Field label="Laufmeter Zaunbau">{numField(form.lfm_zaunbau, set("lfm_zaunbau"))}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 8 */}
      <SektionBlock title="8 · Nachbesserung" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Std. Nachbesserung">{numField(form.std_nachbesserung, set("std_nachbesserung"))}</Field>
          <Field label="Stk. Nachbesserung">{numField(form.stk_nachbesserung, set("stk_nachbesserung"))}</Field>
          <Field label="Std. sonstige Arbeiten">{numField(form.std_sonstige_arbeiten, set("std_sonstige_arbeiten"))}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 9 */}
      <SektionBlock title="9 · Witterung & Standort">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Witterung">
            <select
              value={form.witterung}
              onChange={(e) => set("witterung")(e.target.value)}
              className={inputCls}
            >
              <option value="">— bitte wählen —</option>
              <option value="sonnig">Sonnig</option>
              <option value="bedeckt">Bedeckt</option>
              <option value="Regen">Regen</option>
              <option value="Schnee">Schnee</option>
              <option value="Nebel">Nebel</option>
            </select>
          </Field>
          <div />
          <Field label="GPS Lat Start">{numField(form.gpsStartLat, set("gpsStartLat"), "z.B. 48.1234")}</Field>
          <Field label="GPS Lon Start">{numField(form.gpsStartLon, set("gpsStartLon"), "z.B. 11.5678")}</Field>
        </div>
      </SektionBlock>

      {/* Sektion 10 */}
      <SektionBlock title="10 · Kommentar & Bericht">
        <Field label="Kommentar">
          <textarea
            value={form.kommentar}
            onChange={(e) => set("kommentar")(e.target.value)}
            className={inputCls}
            rows={4}
            placeholder="Freitextkommentar zum Einsatz..."
          />
        </Field>
        <Field label="Bericht (intern)">
          <textarea
            value={form.bericht}
            onChange={(e) => set("bericht")(e.target.value)}
            className={inputCls}
            rows={3}
            placeholder="Internes Notizfeld..."
          />
        </Field>
      </SektionBlock>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-[#333] text-zinc-400 text-sm hover:bg-[#222] transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => handleSave("entwurf")}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-600 text-zinc-300 bg-[#1e1e1e] text-sm hover:bg-[#282828] transition-colors disabled:opacity-50"
        >
          {saving ? "Speichern..." : "Entwurf speichern"}
        </button>
        <button
          type="button"
          onClick={() => handleSave("eingereicht")}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "Einreichen ✓"}
        </button>
      </div>
    </div>
  )
}
