import { ClipboardList, MapPin, UsersRound, CheckCircle2, AlertCircle } from "lucide-react"

export default function AuftraegeDocPage() {
  return (
    <article style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-body)" }}>
      <header className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: "rgba(44,58,28,0.1)", color: "#2C3A1C" }}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Funktionen
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          Auftragsmanagement
        </h1>
        <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
          Aufträge sind das Herzstück von ForstManager. Sie verbinden Kunden, Flächen, Material
          und Personal zu einer nachvollziehbaren Maßnahme.
        </p>
      </header>

      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Lebenszyklus eines Auftrags
        </h2>
        <p className="leading-relaxed mb-4">
          Ein Auftrag durchläuft in ForstManager fünf klar definierte Phasen. Jede Phase ist im
          System sichtbar und auswertbar, sodass die Geschäftsleitung jederzeit weiß, wo die
          einzelnen Maßnahmen stehen. Die Übergänge zwischen den Phasen erfolgen entweder manuell
          durch einen Auftragsverantwortlichen oder automatisch, wenn ein technisches Kriterium
          erfüllt ist (etwa die Abnahme durch das Forstamt).
        </p>
        <ol className="space-y-3 mb-4 list-none pl-0">
          {[
            { name: "Angelegt", desc: "Stammdaten und Kunde sind erfasst, jedoch noch keine Fläche oder Gruppe zugewiesen." },
            { name: "Geplant", desc: "Flächen, Material und Saison stehen fest. Der Auftrag ist freigegeben, aber noch nicht aktiv." },
            { name: "Aktiv", desc: "Eine Gruppe arbeitet auf der Fläche. Tagesprotokolle werden über die App erfasst." },
            { name: "Abnahmebereit", desc: "Pflanzarbeiten sind beendet, das Forstamt wurde zur Abnahme geladen." },
            { name: "Abgeschlossen", desc: "Abnahme erteilt, Rechnung gestellt, Reporting verfügbar." },
          ].map((phase, i) => (
            <li
              key={phase.name}
              className="flex items-start gap-4 p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-surface-container-low)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ backgroundColor: "#2C3A1C", color: "#ffffff" }}
              >
                {i + 1}
              </div>
              <div>
                <p className="font-semibold mb-0.5" style={{ color: "var(--color-on-surface)" }}>
                  {phase.name}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {phase.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Flächen erfassen
        </h2>
        <p className="leading-relaxed mb-3">
          Eine Fläche ist die geografische Grundlage jedes Auftrags. ForstManager unterstützt
          drei Wege, eine Fläche zu erfassen: über die <strong>PLZ-Suche</strong> mit
          Bundesland-Vorschlag, über die <strong>Adresseingabe</strong> mit automatischer
          Geocodierung oder durch <strong>direkte Koordinaten</strong> (WGS84). Bei der
          PLZ-Eingabe ermittelt das System automatisch das zuständige Forstamt aus der internen
          Datenbank und schlägt einen Ansprechpartner vor.
        </p>
        <p className="leading-relaxed mb-3">
          Pro Auftrag können mehrere Flächen hinterlegt werden — etwa wenn ein Kunde mehrere
          benachbarte Parzellen aufforsten lässt. Jede Fläche enthält Angaben zu Größe (in
          Hektar), Bodenart, vorgesehener Baumart und gegebenenfalls Schutzmaßnahmen wie Zaun
          oder Einzelschutz.
        </p>
        <div className="flex items-start gap-3 p-4 rounded-lg my-4" style={{ backgroundColor: "rgba(44,58,28,0.05)" }}>
          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#2C3A1C" }} />
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            <strong style={{ color: "var(--color-on-surface)" }}>Hinweis:</strong> Für förderfähige
            Maßnahmen prüft ForstManager automatisch, ob die Fläche in einem aktuellen
            Förderprogramm enthalten ist.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Gruppen zuweisen
        </h2>
        <p className="leading-relaxed mb-3">
          Eine Gruppe ist ein Team aus Mitarbeitern, das gemeinsam einen Auftrag bearbeitet. Beim
          Anlegen einer Gruppe wird ein <strong>Gruppenführer</strong> bestimmt, der für das
          Tagesprotokoll verantwortlich ist. Gruppen können dauerhaft bestehen oder
          auftragsbezogen zusammengestellt werden.
        </p>
        <div className="flex items-start gap-3 p-4 rounded-lg my-4" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          <UsersRound className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#2C3A1C" }} />
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            Sobald eine Gruppe einem Auftrag zugewiesen wird, sehen alle Mitglieder den Auftrag
            in ihrer mobilen App und können das Tagesprotokoll führen.
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          Häufige Fehler vermeiden
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { ok: true, text: "Vor der Zuweisung prüfen: Hat die Gruppe das nötige Material im Lager reserviert?" },
            { ok: false, text: "Aufträge anlegen ohne PLZ — das Forstamt kann nicht zugeordnet werden." },
            { ok: true, text: "Den Status „Abnahmebereit“ erst setzen, wenn alle Tagesprotokolle abgeschlossen sind." },
            { ok: false, text: "Mehrere Gruppen gleichzeitig auf einer Fläche einsetzen ohne klare Aufgabenteilung." },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              {item.ok ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#16a34a" }} />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
              )}
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}
