import { Settings, Users, Calendar, Package, Shield, Bell } from "lucide-react"

export default function AdminDocPage() {
  return (
    <article style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-body)" }}>
      <header className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: "rgba(44,58,28,0.1)", color: "#2C3A1C" }}
        >
          <Settings className="w-3.5 h-3.5" />
          Administration
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          Administration
        </h1>
        <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
          Als Administrator verwalten Sie Mitarbeiter, Saisons, Lager und Systemeinstellungen.
          Dieser Bereich erläutert die wichtigsten Aufgaben und Best Practices.
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
          <span className="inline-flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#2C3A1C" }} />
            Mitarbeiter verwalten
          </span>
        </h2>
        <p className="leading-relaxed mb-3">
          Im Bereich <strong>Mitarbeiter</strong> verwalten Sie die Stammdaten Ihres Teams.
          Beim Anlegen werden Name, Funktion, Telefonnummer und E-Mail erfasst. Jeder
          Mitarbeiter erhält eine Rolle, die seine Zugriffsrechte bestimmt:{" "}
          <strong>Mitarbeiter</strong> (nur App), <strong>Gruppenführer</strong> (App +
          Tagesprotokoll-Verwaltung) oder <strong>Admin</strong> (vollständiger Zugriff).
        </p>
        <p className="leading-relaxed mb-3">
          Qualifikationen wie Motorsägenführerschein, Erste-Hilfe-Kurs oder Pflanzschulung
          werden mit Ausstellungsdatum und Ablaufdatum hinterlegt. ForstManager warnt
          automatisch, wenn eine Qualifikation in den nächsten 60 Tagen abläuft — so können
          Sie rechtzeitig Auffrischungen planen.
        </p>
        <p className="leading-relaxed">
          Beim Ausscheiden eines Mitarbeiters wird der Datensatz nicht gelöscht, sondern
          archiviert. Das bewahrt die historische Datenintegrität: Tagesprotokolle und
          Lohnabrechnungen vergangener Saisons bleiben weiterhin korrekt zuordenbar.
        </p>
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
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: "#2C3A1C" }} />
            Saisons einrichten
          </span>
        </h2>
        <p className="leading-relaxed mb-3">
          ForstManager organisiert Aufträge entlang von <strong>Saisons</strong>. Eine Saison
          ist ein Zeitraum mit zugewiesenem Pflanzbestand, festen Lohnsätzen und einer
          Reporting-Klammer. Üblich sind zwei Saisons pro Jahr: Frühjahr (März bis Mai) und
          Herbst (Oktober bis November), abgestimmt auf die Vegetationsperioden.
        </p>
        <p className="leading-relaxed mb-3">
          Beim Anlegen einer Saison werden Start- und Enddatum, vorgesehene Baumarten,
          erwartete Pflanzmengen und Standard-Lohnsätze definiert. Aufträge können einer
          Saison automatisch zugeordnet werden, wenn ihr Pflanztermin in den entsprechenden
          Zeitraum fällt.
        </p>
        <p className="leading-relaxed">
          Am Saisonende erlaubt ForstManager einen Jahresabschluss-Report mit allen relevanten
          Kennzahlen: gepflanzte Bäume nach Art, Materialverbrauch, geleistete Stunden,
          Umsatz pro Auftrag. Dieser Report dient als Grundlage für die Steuerberatung und für
          interne Auswertungen.
        </p>
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
          <span className="inline-flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: "#2C3A1C" }} />
            Lager verwalten
          </span>
        </h2>
        <p className="leading-relaxed mb-3">
          Das <strong>Lager</strong> bildet alle Verbrauchsgüter ab — von Setzlingen über
          Schutzmaterial bis zu Werkzeugen. Jeder Artikel hat eine Kategorie, einen
          Standardlieferanten und eine Mindestbestandsmenge. Wird die Mindestmenge
          unterschritten, erscheint eine Warnung im Dashboard.
        </p>
        <p className="leading-relaxed mb-3">
          Wareneingänge werden über <strong>Lieferantenbestellungen</strong> erfasst. Pro
          Bestellung wird der Lieferant gewählt, die Artikel und Mengen eingegeben und der
          erwartete Liefertermin festgelegt. Bei Wareneingang bucht der Administrator die
          Mengen auf den Lagerbestand. Warenausgänge erfolgen meist automatisch über die App —
          jede Materialentnahme im Tagesprotokoll bucht das Lager direkt aus.
        </p>
        <p className="leading-relaxed">
          Mehrere Lagerstandorte werden unterstützt: Hauptlager, Außenlager, Fahrzeuge. Die
          Übersicht zeigt jederzeit, welches Material an welchem Ort verfügbar ist — ein
          wichtiger Punkt, wenn mehrere Gruppen parallel auf verschiedenen Flächen arbeiten.
        </p>
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
          <span className="inline-flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "#2C3A1C" }} />
            Benutzerrechte
          </span>
        </h2>
        <p className="leading-relaxed mb-3">
          Über <strong>Administration → Benutzerverwaltung</strong> steuern Sie, welche Person
          welche Bereiche sehen darf. ForstManager folgt dem Prinzip der minimalen Rechte:
          Standardmäßig sieht jeder nur die Daten, die für seine Rolle nötig sind. Erst durch
          eine explizite Freigabe werden weitere Bereiche sichtbar.
        </p>
        <p className="leading-relaxed">
          Bei sensiblen Vorgängen — etwa Lohnabrechnung oder Vorschussverwaltung — empfiehlt
          sich ein Vier-Augen-Prinzip: Die Eingabe erfolgt durch einen Bearbeiter, die Freigabe
          durch eine zweite Person. Dieses Prinzip lässt sich pro Bereich aktivieren.
        </p>
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
          <span className="inline-flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: "#2C3A1C" }} />
            Benachrichtigungen
          </span>
        </h2>
        <p className="leading-relaxed mb-3">
          ForstManager kann automatische Benachrichtigungen versenden — per E-Mail, in der App
          oder über Telegram. Typische Auslöser sind: ablaufende Qualifikationen, kritische
          Lagerbestände, anstehende Abnahmen, neue Aufträge oder ausstehende Zahlungen.
        </p>
        <p className="leading-relaxed">
          In den Einstellungen wählt jeder Benutzer selbst, welche Kanäle er nutzen möchte.
          Administratoren können zusätzliche Pflicht-Benachrichtigungen definieren, die nicht
          deaktiviert werden können — etwa für sicherheitsrelevante Ereignisse.
        </p>
      </section>
    </article>
  )
}
