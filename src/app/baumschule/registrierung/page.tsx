"use client"

/**
 * BS-MKT-01 Phase 2: Öffentliche Selbst-Registrierung für Baumschulen
 * /baumschule/registrierung
 *
 * Nach erfolgreichem Submit wird die Baumschule mit status="pending"
 * angelegt. Sie erhält eine Bestätigungs-Mail und wartet auf Admin-Freigabe.
 */

import { useState } from "react"

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
]

const BAUMARTEN_DEFAULT = [
  "Stieleiche", "Traubeneiche", "Rotbuche", "Hainbuche",
  "Fichte", "Kiefer", "Lärche", "Douglasie",
  "Birke", "Esche", "Ahorn", "Vogelkirsche",
  "Erle", "Linde", "Ulme", "Eberesche",
]

type FormState = {
  firmenname: string
  ansprechpartner: string
  email: string
  telefon: string
  plz: string
  ort: string
  bundesland: string
  lieferBundeslaender: string[]
  baumarten: string[]
  baumartenCustom: string
  kapazitaet: string
  zufZertifiziert: boolean
  datenschutzAccepted: boolean
  // Honeypot — muss leer bleiben
  website: string
}

const INITIAL: FormState = {
  firmenname: "",
  ansprechpartner: "",
  email: "",
  telefon: "",
  plz: "",
  ort: "",
  bundesland: "",
  lieferBundeslaender: [],
  baumarten: [],
  baumartenCustom: "",
  kapazitaet: "",
  zufZertifiziert: false,
  datenschutzAccepted: false,
  website: "",
}

export default function RegistrierungPage() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleArrayValue(key: "lieferBundeslaender" | "baumarten", value: string) {
    setForm((prev) => {
      const list = prev[key]
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.datenschutzAccepted) {
      setError("Bitte stimmen Sie der Datenschutzerklärung zu.")
      return
    }

    const customArten = form.baumartenCustom
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const baumarten = [...form.baumarten, ...customArten]

    setSubmitting(true)
    try {
      const res = await fetch("/api/public/baumschulen/registrierung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmenname: form.firmenname,
          ansprechpartner: form.ansprechpartner,
          email: form.email,
          telefon: form.telefon,
          plz: form.plz,
          ort: form.ort,
          bundesland: form.bundesland,
          lieferBundeslaender: form.lieferBundeslaender,
          baumarten,
          kapazitaet: form.kapazitaet,
          zufZertifiziert: form.zufZertifiziert,
          datenschutzAccepted: form.datenschutzAccepted,
          website: form.website,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Die Bewerbung konnte nicht gespeichert werden.")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Netzwerkfehler. Bitte versuchen Sie es erneut.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm max-w-xl w-full p-10 text-center space-y-5">
          <div className="text-5xl">🌲</div>
          <h1 className="text-2xl font-bold text-emerald-900">Vielen Dank!</h1>
          <p className="text-stone-700 leading-relaxed">
            Ihre Bewerbung ist bei uns eingegangen. Wir prüfen Ihre Angaben und melden uns
            innerhalb von <strong>2 Werktagen</strong> bei Ihnen.
          </p>
          <p className="text-stone-600 text-sm">
            Sobald wir Sie freigeschaltet haben, erhalten Sie per E-Mail einen persönlichen
            Login-Link für Ihr Baumschul-Portal.
          </p>
          <a
            href="https://kochaufforstung.de"
            className="inline-block mt-2 text-emerald-700 hover:text-emerald-900 underline"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <div className="text-4xl mb-3">🌲</div>
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">
            Bewerbung als Partner-Baumschule
          </h1>
          <p className="text-stone-700 max-w-xl mx-auto">
            Koch Aufforstung GmbH bringt Waldbesitzer und Baumschulen zusammen. Bewerben
            Sie sich hier, um Teil unseres Netzwerks zu werden und Pflanzanfragen aus
            unserer Region zu erhalten.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6"
        >
          {/* Honeypot — unsichtbar für Menschen, Bots füllen es aus */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Website (bitte leer lassen)
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
              />
            </label>
          </div>

          {/* ── Kontakt-Block ─────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-emerald-900">Über Ihre Baumschule</h2>

            <Field label="Firmenname *" required>
              <input
                type="text"
                required
                maxLength={200}
                value={form.firmenname}
                onChange={(e) => updateField("firmenname", e.target.value)}
                className={inputCls}
                placeholder="z.B. Baumschule Müller GmbH"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Ansprechpartner *" required>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={form.ansprechpartner}
                  onChange={(e) => updateField("ansprechpartner", e.target.value)}
                  className={inputCls}
                  placeholder="Vor- und Nachname"
                />
              </Field>
              <Field label="Telefon">
                <input
                  type="tel"
                  maxLength={50}
                  value={form.telefon}
                  onChange={(e) => updateField("telefon", e.target.value)}
                  className={inputCls}
                  placeholder="+49 ..."
                />
              </Field>
            </div>

            <Field label="E-Mail-Adresse *" required>
              <input
                type="email"
                required
                maxLength={200}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={inputCls}
                placeholder="info@baumschule-mustermann.de"
              />
            </Field>

            <div className="grid sm:grid-cols-[140px_1fr_220px] gap-4">
              <Field label="PLZ">
                <input
                  type="text"
                  maxLength={10}
                  value={form.plz}
                  onChange={(e) => updateField("plz", e.target.value)}
                  className={inputCls}
                  placeholder="20095"
                />
              </Field>
              <Field label="Ort *" required>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.ort}
                  onChange={(e) => updateField("ort", e.target.value)}
                  className={inputCls}
                  placeholder="Hamburg"
                />
              </Field>
              <Field label="Bundesland *" required>
                <select
                  required
                  value={form.bundesland}
                  onChange={(e) => updateField("bundesland", e.target.value)}
                  className={inputCls}
                >
                  <option value="">— bitte wählen —</option>
                  {BUNDESLAENDER.map((bl) => (
                    <option key={bl} value={bl}>
                      {bl}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* ── Liefergebiet ─────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-emerald-900">In welche Bundesländer liefern Sie?</h2>
            <p className="text-sm text-stone-600">
              Wenn Sie nichts auswählen, gehen wir von einer bundesweiten Belieferung aus.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUNDESLAENDER.map((bl) => {
                const active = form.lieferBundeslaender.includes(bl)
                return (
                  <label
                    key={bl}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                      active
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-stone-200 bg-white hover:border-emerald-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-700"
                      checked={active}
                      onChange={() => toggleArrayValue("lieferBundeslaender", bl)}
                    />
                    {bl}
                  </label>
                )
              })}
            </div>
          </section>

          {/* ── Sortiment ────────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-emerald-900">Welche Baumarten haben Sie im Sortiment?</h2>
            <div className="flex flex-wrap gap-2">
              {BAUMARTEN_DEFAULT.map((ba) => {
                const active = form.baumarten.includes(ba)
                return (
                  <button
                    type="button"
                    key={ba}
                    onClick={() => toggleArrayValue("baumarten", ba)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-stone-700 border-stone-300 hover:border-emerald-500"
                    }`}
                  >
                    {ba}
                  </button>
                )
              })}
            </div>
            <Field label="Weitere Baumarten (kommagetrennt)">
              <input
                type="text"
                maxLength={500}
                value={form.baumartenCustom}
                onChange={(e) => updateField("baumartenCustom", e.target.value)}
                className={inputCls}
                placeholder="z.B. Walnuss, Speierling, Wildapfel"
              />
            </Field>
          </section>

          {/* ── Kapazität + Zertifizierung ───────────────────────── */}
          <section className="space-y-4">
            <Field label="Kapazität / Mindestbestellmenge / Hinweise">
              <textarea
                rows={3}
                maxLength={1000}
                value={form.kapazitaet}
                onChange={(e) => updateField("kapazitaet", e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="z.B. Mindestbestellmenge 500 Stück, Saisonbeschränkung Oktober–April, ..."
              />
            </Field>

            <label className="flex items-start gap-3 border border-stone-200 rounded-lg p-3 bg-stone-50">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-emerald-700"
                checked={form.zufZertifiziert}
                onChange={(e) => updateField("zufZertifiziert", e.target.checked)}
              />
              <span className="text-sm">
                <strong>ZÜF-zertifiziert</strong>{" "}
                <span className="text-stone-500">(Zentralstelle der Forstpflanzenzucht)</span>
                <br />
                <span className="text-stone-600 text-xs">
                  Wir kennzeichnen ZÜF-zertifizierte Baumschulen in unserem Marketplace
                  besonders.
                </span>
              </span>
            </label>
          </section>

          {/* ── DSGVO ────────────────────────────────────────────── */}
          <section className="border-t border-stone-200 pt-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 accent-emerald-700"
                checked={form.datenschutzAccepted}
                onChange={(e) => updateField("datenschutzAccepted", e.target.checked)}
              />
              <span className="text-sm text-stone-700">
                Ich willige in die Verarbeitung meiner Daten zur Bearbeitung dieser Bewerbung
                gemäß der{" "}
                <a
                  href="https://kochaufforstung.de/datenschutz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline hover:text-emerald-900"
                >
                  Datenschutzerklärung
                </a>{" "}
                ein. *
              </span>
            </label>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting || !form.datenschutzAccepted}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-semibold rounded-lg px-6 py-3 transition"
            >
              {submitting ? "Wird gesendet..." : "Bewerbung abschicken"}
            </button>
          </div>

          <p className="text-xs text-stone-500 text-center pt-2">
            Wir prüfen jede Bewerbung sorgfältig und melden uns innerhalb von 2 Werktagen.
          </p>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────

const inputCls =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {required && <span className="sr-only"> (Pflichtfeld)</span>}
      </span>
      {children}
    </label>
  )
}
