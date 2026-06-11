// AUDIT-FIX: [Dead-Link] /datenschutz war verlinkt (Buchhaltung-Footer/Login), existierte aber nicht (404)
export const metadata = { title: "Datenschutzerklärung — Koch Aufforstung" }

export default function DatenschutzPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist:
            <br />
            Koch Aufforstung — Kontakt: info@koch-aufforstung.de
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Verarbeitete Daten</h2>
          <p>
            Im Rahmen der Nutzung des ForstManager-Systems verarbeiten wir personenbezogene
            Daten, die zur Vertragserfüllung und Auftragsabwicklung erforderlich sind
            (Art. 6 Abs. 1 lit. b DSGVO): Name, Kontaktdaten, Auftrags- und Flächendaten,
            Zeiterfassungs- und Abrechnungsdaten.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Speicherdauer</h2>
          <p>
            Personenbezogene Daten werden gelöscht, sobald sie für die Zwecke, für die sie
            erhoben wurden, nicht mehr erforderlich sind und keine gesetzlichen
            Aufbewahrungspflichten (z.&nbsp;B. nach HGB/AO) entgegenstehen.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Empfänger / Auftragsverarbeiter</h2>
          <p>
            Für den Betrieb der Anwendung setzen wir technische Dienstleister ein
            (Hosting, Datenbank, E-Mail-Versand). Mit diesen bestehen, soweit erforderlich,
            Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
            (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit
            (Art. 20) sowie Widerspruch (Art. 21 DSGVO). Außerdem besteht ein
            Beschwerderecht bei der zuständigen Datenschutzaufsichtsbehörde.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Cookies / Sitzungsdaten</h2>
          <p>
            Diese Anwendung verwendet technisch notwendige Cookies zur Sitzungsverwaltung
            (Login). Eine darüber hinausgehende Tracking- oder Analysefunktion findet nicht
            statt.
          </p>
        </div>
      </section>

      <p className="mt-10 text-xs text-zinc-500">
        Hinweis: Diese Erklärung ist eine Basisfassung — vor Produktivschaltung rechtlich
        prüfen und um konkrete Dienstleister ergänzen.
      </p>
    </main>
  )
}
