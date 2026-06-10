import Link from "next/link"
import {
  Rocket,
  ClipboardList,
  Smartphone,
  Settings,
  Code2,
  ArrowRight,
  Lightbulb,
} from "lucide-react"

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="my-6 rounded-xl flex items-center justify-center"
      style={{
        backgroundColor: "var(--color-surface-container-low)",
        border: "2px dashed var(--color-outline-variant)",
        aspectRatio: "16 / 9",
      }}
    >
      <div className="text-center px-6">
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          📸 Screenshot
        </p>
        <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
          {label}
        </p>
      </div>
    </div>
  )
}

const articleStyle = {
  color: "var(--color-on-surface)",
  fontFamily: "var(--font-body)",
}

export default function ErsteSchrittePage() {
  return (
    <article style={articleStyle}>
      <header className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{
            backgroundColor: "rgba(44,58,28,0.1)",
            color: "#2C3A1C",
          }}
        >
          <Rocket className="w-3.5 h-3.5" />
          Einstieg
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          Erste Schritte mit ForstManager
        </h1>
        <p
          className="text-base md:text-lg leading-relaxed"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          Dieser Guide führt Sie durch die ersten Minuten mit ForstManager: vom Login
          bis zum ersten angelegten Auftrag.
        </p>
      </header>

      {/* Section 1 */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          1. Login
        </h2>
        <p className="leading-relaxed mb-4">
          ForstManager ist eine Web-Anwendung und benötigt keine Installation. Öffnen Sie
          Ihren Browser und rufen Sie die folgende URL auf:
        </p>
        <div
          className="my-4 p-4 rounded-lg font-mono text-sm"
          style={{
            backgroundColor: "#1a1a1a",
            color: "#a3e635",
            border: "1px solid #2a2a2a",
          }}
        >
          https://ka-forstmanager.vercel.app/login
        </div>
        <p className="leading-relaxed mb-4">
          Geben Sie Ihre <strong>E-Mail-Adresse</strong> und Ihr <strong>Passwort</strong>{" "}
          ein. Die Zugangsdaten erhalten Sie von Ihrer Administration. Sollten Sie Ihr
          Passwort vergessen haben, nutzen Sie den Link &bdquo;Passwort vergessen&ldquo;
          unterhalb des Login-Formulars.
        </p>

        <ScreenshotPlaceholder label="Screenshot: Login-Seite mit E-Mail- und Passwort-Feld" />

        <div
          className="my-4 p-4 rounded-xl flex items-start gap-3"
          style={{
            backgroundColor: "rgba(197,165,90,0.08)",
            border: "1px solid rgba(197,165,90,0.25)",
          }}
        >
          <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#C5A55A" }} />
          <div>
            <p className="text-sm font-semibold mb-0.5">Tipp</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
              Setzen Sie ein Lesezeichen für die Login-Seite. So sind Sie mit einem Klick
              im System.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          2. Das Dashboard
        </h2>
        <p className="leading-relaxed mb-4">
          Nach dem Login landen Sie automatisch auf dem <strong>Dashboard</strong>. Hier
          sehen Sie auf einen Blick die wichtigsten Kennzahlen: aktive Aufträge, geleistete
          Stunden, anstehende Termine und offene Abnahmen.
        </p>

        <ScreenshotPlaceholder label="Screenshot: Dashboard-Übersicht mit Kennzahlen-Karten" />

        <h3
          className="text-lg font-semibold mt-6 mb-2"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          Navigation links
        </h3>
        <p className="leading-relaxed mb-3">
          Die linke Seitenleiste enthält alle Hauptbereiche. Die wichtigsten Einträge:
        </p>
        <ul className="space-y-2 mb-4 list-none pl-0">
          {[
            ["Dashboard", "Ihre tägliche Startseite mit Kennzahlen und Schnellzugriffen."],
            ["Aufträge", "Alle laufenden und abgeschlossenen Aufträge."],
            ["Mitarbeiter", "Ihre Belegschaft mit Qualifikationen und Verfügbarkeit."],
            ["Gruppen", "Teams für die Auftragsausführung im Feld."],
            ["Lager", "Bestand an Setzlingen, Material und Verbrauchsgütern."],
            ["Reports", "Auswertungen und Berichte für Geschäftsleitung und Behörden."],
          ].map(([label, desc]) => (
            <li
              key={label}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "var(--color-surface-container-low)" }}
            >
              <span
                className="font-semibold text-sm flex-shrink-0 min-w-[110px]"
                style={{ color: "#2C3A1C" }}
              >
                {label}
              </span>
              <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                {desc}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          3. Erster Auftrag anlegen
        </h2>
        <p className="leading-relaxed mb-4">
          Ein Auftrag bildet die Klammer um eine Aufforstungsmaßnahme: Kunde, Fläche,
          eingesetzte Gruppe und Material. So legen Sie Schritt für Schritt einen neuen
          Auftrag an:
        </p>
        <ol className="space-y-3 mb-4 list-none pl-0 counter-reset-list">
          {[
            ["Aufträge → Neuer Auftrag", "Klicken Sie in der Seitenleiste auf „Aufträge“ und dann oben rechts auf den Button „Neuer Auftrag“."],
            ["Kundendaten eingeben", "Wählen Sie einen vorhandenen Kunden aus oder legen Sie einen neuen an. Pflichtfelder sind Name, Anschrift und Kontakt."],
            ["Fläche hinzufügen", "Erfassen Sie die Forstfläche per PLZ-Suche, Adresse oder Koordinaten. ForstManager prüft automatisch das zuständige Forstamt."],
            ["Gruppe zuweisen", "Wählen Sie eine bestehende Arbeitsgruppe oder erstellen Sie eine neue. Der Gruppenführer erhält automatisch eine Benachrichtigung."],
            ["Speichern", "Mit „Speichern“ wird der Auftrag angelegt und ist sofort in der App verfügbar."],
          ].map(([step, desc], i) => (
            <li
              key={i}
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
                <p className="font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
                  {step}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          4. Mitarbeiter einladen
        </h2>
        <p className="leading-relaxed mb-3">
          Damit Ihr Team mit der App im Feld arbeiten kann, müssen Sie die Mitarbeiter
          zunächst im System anlegen. Wechseln Sie dazu in den Bereich{" "}
          <strong>Mitarbeiter</strong> und klicken Sie auf <strong>„Mitarbeiter hinzufügen“</strong>.
        </p>
        <p className="leading-relaxed mb-3">
          Nach Eingabe der Stammdaten (Name, Funktion, Telefonnummer) erhält der
          Mitarbeiter eine Einladungs-Mail mit Login-Link. Die Rolle bestimmt, welche
          Bereiche der Person zur Verfügung stehen:
        </p>
        <ul className="space-y-1.5 mb-4 list-disc pl-5" style={{ color: "var(--color-on-surface-variant)" }}>
          <li><strong>Mitarbeiter</strong> — Zugriff auf zugewiesene Aufträge in der App</li>
          <li><strong>Gruppenführer</strong> — zusätzlich Bearbeitung des Tagesprotokolls</li>
          <li><strong>Admin</strong> — vollständiger Zugriff inkl. Stammdaten und Reports</li>
        </ul>
      </section>

      {/* FAQ anchor */}
      <section id="faq" className="mb-10">
        <h2
          className="text-2xl font-bold mb-3 pb-2"
          style={{
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-display)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          FAQ — Häufige Fragen
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Ich habe mein Passwort vergessen. Was tun?",
              a: "Klicken Sie auf der Login-Seite auf „Passwort vergessen“. Sie erhalten eine E-Mail mit einem Link, über den Sie ein neues Passwort vergeben können.",
            },
            {
              q: "Kann ich ForstManager auch ohne Internet nutzen?",
              a: "Die Web-Anwendung benötigt eine Verbindung. Die mobile App hingegen unterstützt einen Offline-Modus für das Tagesprotokoll im Wald.",
            },
            {
              q: "Wie lade ich Mitarbeiter ein?",
              a: "Gehen Sie auf „Mitarbeiter“ → „Hinzufügen“, geben Sie Name und E-Mail an. Der Mitarbeiter erhält automatisch einen Einladungs-Link.",
            },
            {
              q: "Wo finde ich die App zum Download?",
              a: "Die ForstManager-App steht im Apple App Store und im Google Play Store unter „Koch Aufforstung“ bereit.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              <p className="font-semibold mb-1.5" style={{ color: "var(--color-on-surface)" }}>
                {item.q}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Next steps */}
      <section className="mb-6">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-display)" }}
        >
          Nächste Schritte
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: "/dokumentation/auftraege", label: "Auftragsmanagement vertiefen", icon: ClipboardList },
            { href: "/dokumentation/app", label: "Mobile App einrichten", icon: Smartphone },
            { href: "/dokumentation/admin", label: "Administration kennenlernen", icon: Settings },
            { href: "/dokumentation/api", label: "API für Integrationen", icon: Code2 },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between p-4 rounded-lg group transition-all hover:shadow-md"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4" style={{ color: "#2C3A1C" }} />
                <span className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
                  {label}
                </span>
              </span>
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                style={{ color: "var(--color-on-surface-variant)" }}
              />
            </Link>
          ))}
        </div>
      </section>
    </article>
  )
}
